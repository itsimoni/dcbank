"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Calculator,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaxRecord {
  id: string;
  user_id: string;
  taxes: number;
  on_hold: number;
  paid: number;
  created_at: string;
  updated_at: string;
}

interface TaxStats {
  pending: { count: number; amount: number };
  on_hold: { count: number; amount: number };
  paid: { count: number; amount: number };
}

interface TaxCardProps {
  userProfile: {
    id: string;
    client_id: string;
    full_name: string | null;
    email: string | null;
  };
  setActiveTab: (tab: string) => void;
}

export default function TaxCard({ userProfile, setActiveTab }: TaxCardProps) {
  const [taxRecord, setTaxRecord] = useState<TaxRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [taxStats, setTaxStats] = useState<TaxStats>({
    pending: { count: 0, amount: 0 },
    on_hold: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
  });
  const { language } = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);

  useEffect(() => {
    fetchTaxes();
    setupTaxSubscription();
  }, [userProfile]);

  const fetchTaxes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Query the user's tax record
      const { data, error } = await supabase
        .from("taxes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no record exists, create one
        if (error.code === "PGRST116") {
          const { data: newRecord, error: insertError } = await supabase
            .from("taxes")
            .insert({
              user_id: user.id,
              taxes: 0,
              on_hold: 0,
              paid: 0,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating tax record:", insertError);
            return;
          }

          setTaxRecord(newRecord);
          setTaxStats({
            pending: { count: 0, amount: 0 },
            on_hold: { count: 0, amount: 0 },
            paid: { count: 0, amount: 0 },
          });
        } else {
          console.error("Error fetching taxes:", error);
          return;
        }
      } else {
        setTaxRecord(data);

        // Calculate statistics from the aggregate data
        setTaxStats({
          pending: {
            count: data.taxes > 0 ? 1 : 0,
            amount: Number(data.taxes),
          },
          on_hold: {
            count: data.on_hold > 0 ? 1 : 0,
            amount: Number(data.on_hold),
          },
          paid: {
            count: data.paid > 0 ? 1 : 0,
            amount: Number(data.paid),
          },
        });
      }
    } catch (error) {
      console.error("Error fetching taxes:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupTaxSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Set up real-time subscription for taxes table
    const subscription = supabase
      .channel(`taxes_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "taxes",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Tax change detected:", payload);
          fetchTaxes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatName = (name: string | null) => {
    if (!name) return "N/A";
    return name
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const exportTaxReport = async () => {
    const totalTaxes = taxStats.pending.amount + taxStats.on_hold.amount + taxStats.paid.amount;
    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const reportTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const reportId = `TAX-${Date.now()}`;
    const formattedName = formatName(userProfile.full_name);

    const container = document.createElement("div");
    container.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; background: #fff; color: #1a1a1a; max-width: 100%; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #b91c1c;">
          <div style="font-size: 24px; font-weight: bold; color: #b91c1c; margin-bottom: 5px;">Malta Crypto Central Bank</div>
          <div style="font-size: 18px; color: #333; margin-bottom: 3px;">Tax Report</div>
          <div style="font-size: 12px; color: #666;">Generated on ${reportDate} at ${reportTime}</div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-size: 14px; font-weight: 600; color: #b91c1c; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e5e5;">Account Information</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="padding: 8px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Account Holder</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">${formattedName}</div>
            </div>
            <div style="padding: 8px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Email</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">${userProfile.email || "N/A"}</div>
            </div>
            <div style="padding: 8px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Client ID</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">${userProfile.client_id || "N/A"}</div>
            </div>
            <div style="padding: 8px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Report Period</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">Current Tax Year</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-size: 14px; font-weight: 600; color: #b91c1c; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e5e5;">Tax Breakdown</div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 8px 10px; text-align: left; background: #b91c1c; color: white; font-weight: 600; font-size: 11px;">Category</th>
                <th style="padding: 8px 10px; text-align: left; background: #b91c1c; color: white; font-weight: 600; font-size: 11px;">Status</th>
                <th style="padding: 8px 10px; text-align: right; background: #b91c1c; color: white; font-weight: 600; font-size: 11px;">Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px;">Pending Taxes</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; color: #d97706;">Awaiting Payment</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; font-weight: 500;">${formatCurrency(taxStats.pending.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px;">On Hold</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; color: #2563eb;">Under Review</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; font-weight: 500;">${formatCurrency(taxStats.on_hold.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 10px; font-size: 12px;">Paid Taxes</td>
                <td style="padding: 8px 10px; font-size: 12px; color: #16a34a;">Completed</td>
                <td style="padding: 8px 10px; font-size: 12px; text-align: right; font-weight: 500;">${formatCurrency(taxStats.paid.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="padding: 15px; background: #f5f5f5; border-radius: 6px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px;">
            <span>Pending Amount:</span>
            <span>${formatCurrency(taxStats.pending.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px;">
            <span>On Hold Amount:</span>
            <span>${formatCurrency(taxStats.on_hold.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px;">
            <span>Paid Amount:</span>
            <span>${formatCurrency(taxStats.paid.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #b91c1c; margin-top: 8px; font-size: 14px; font-weight: bold;">
            <span>Total Tax Liability:</span>
            <span>${formatCurrency(totalTaxes)}</span>
          </div>
        </div>

        <div style="margin-top: 25px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <div style="font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Authorized Signatory</div>
              <svg width="200" height="60" viewBox="0 0 200 60" style="display: block;">
                <g style="opacity: 0.95;">
                  <path d="M12 42 C14 32, 16 22, 20 14 C22 10, 26 12, 28 18 C30 24, 32 32, 34 38 C36 44, 38 42, 40 36 C42 30, 44 24, 46 20 C48 16, 52 18, 54 24 C56 30, 54 36, 50 38 C46 40, 44 36, 48 34"
                        stroke="#0f172a" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M52 38 C56 36, 58 34, 60 36 C62 38, 60 42, 56 42"
                        stroke="#0f172a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                  <path d="M68 44 C66 40, 66 36, 68 32 C70 28, 74 28, 76 32 C78 36, 78 40, 76 44 C74 48, 70 48, 68 44 M76 36 L82 36"
                        stroke="#0f172a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
                  <path d="M86 28 C86 32, 86 40, 86 46 M86 34 C90 30, 94 30, 96 34 C98 38, 96 42, 92 44"
                        stroke="#0f172a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                  <path d="M102 34 C104 30, 108 28, 112 30 C116 32, 116 38, 112 42 C108 46, 104 44, 104 40 C104 36, 108 34, 114 36 L122 44"
                        stroke="#0f172a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
                  <path d="M124 34 C126 30, 130 28, 134 30 C138 32, 138 38, 134 42 C130 46, 126 44, 126 40 C126 36, 130 34, 136 36 L142 42"
                        stroke="#0f172a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
                  <path d="M148 34 C148 30, 152 28, 156 30 C160 32, 160 38, 156 42 C152 46, 148 44, 148 40 C148 36, 150 34, 154 34"
                        stroke="#0f172a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                  <path d="M164 28 C164 34, 164 40, 164 46 M164 36 C168 32, 172 32, 174 36 C176 40, 174 44, 170 44"
                        stroke="#0f172a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                </g>
              </svg>
              <div style="border-top: 1px solid #333; width: 180px; margin-top: 5px;"></div>
              <div style="font-size: 11px; font-weight: 600; color: #1a1a1a; margin-top: 8px;">Dr. Marcus J. Brennan</div>
              <div style="font-size: 9px; color: #666; margin-top: 2px;">Chief Financial Officer</div>
              <div style="font-size: 9px; color: #666;">Malta Crypto Central Bank</div>
              <div style="font-size: 8px; color: #999; margin-top: 4px;">License No. MFSA/CFO/2019-0847</div>
            </div>
            <div style="text-align: center;">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#8b0000" stroke-width="2"/>
                <circle cx="50" cy="50" r="44" fill="none" stroke="#8b0000" stroke-width="1"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8b0000" stroke-width="0.5"/>
                <path id="textPathTop" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0" fill="none"/>
                <text font-size="6" fill="#8b0000" font-weight="bold" letter-spacing="2">
                  <textPath href="#textPathTop" startOffset="15%">MALTA CRYPTO CENTRAL BANK</textPath>
                </text>
                <path id="textPathBottom" d="M 50,50 m 35,0 a 35,35 0 1,1 -70,0" fill="none"/>
                <text font-size="5" fill="#8b0000" letter-spacing="1">
                  <textPath href="#textPathBottom" startOffset="22%">OFFICIAL DOCUMENT</textPath>
                </text>
                <circle cx="50" cy="50" r="22" fill="none" stroke="#8b0000" stroke-width="1.5"/>
                <text x="50" y="46" text-anchor="middle" font-size="10" fill="#8b0000" font-weight="bold">MCCB</text>
                <text x="50" y="56" text-anchor="middle" font-size="6" fill="#8b0000">VERIFIED</text>
                <line x1="30" y1="62" x2="70" y2="62" stroke="#8b0000" stroke-width="0.5"/>
                <text x="50" y="68" text-anchor="middle" font-size="4" fill="#8b0000">${reportDate.split(',')[0].toUpperCase()}</text>
              </svg>
              <div style="font-size: 7px; color: #888; margin-top: 4px;">Digital Verification Seal</div>
              <div style="font-size: 6px; color: #aaa;">Hash: ${reportId.substring(4, 12).toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 15px; text-align: center; font-size: 9px; color: #999;">
          <p style="margin: 2px 0;">Malta Crypto Central Bank - Secure Banking Platform</p>
          <p style="margin: 2px 0;">Report ID: ${reportId} | Date: ${reportDate}</p>
        </div>
      </div>
    `;

    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Tax_Report_${userProfile.client_id || "user"}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: "avoid-all" },
    };

    html2pdf().set(opt).from(container).save();
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-0 shadow-lg">
      <CardHeader className="bg-[#b91c1c] text-white">
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>{t.taxManagement}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2">
        <div className="space-y-4 mt-6">
          <div className="bg-white p-4 border border-gray-200 shadow-sm">

            <div className="grid grid-cols-3 gap-3">
              <div
                className="bg-white p-3 border border-[#b91c1c] cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setActiveTab("payments")}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-black">
                    {t.pending}
                  </span>
                </div>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(taxStats.pending.amount)}
                </p>
              </div>

              <div className="bg-white p-3 border border-[#b91c1c]">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-black">
                    {t.onHold}
                  </span>
                </div>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(taxStats.on_hold.amount)}
                </p>
              </div>

              <div className="bg-white p-3 border border-[#b91c1c]">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-black">
                    {t.paid}
                  </span>
                </div>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(taxStats.paid.amount)}
                </p>
              </div>
            </div>

            <Button
              onClick={exportTaxReport}
              className="w-full mt-4 bg-[#b91c1c] hover:bg-[#991b1b] text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t.exportTaxReport || "Export Tax Report (PDF)"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
