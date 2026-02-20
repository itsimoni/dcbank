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

    const container = document.createElement("div");
    container.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #fff; color: #1a1a1a;">
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #b91c1c;">
          <div style="font-size: 28px; font-weight: bold; color: #b91c1c; margin-bottom: 8px;">Malta Crypto Central Bank</div>
          <div style="font-size: 22px; color: #333; margin-bottom: 4px;">Tax Report</div>
          <div style="font-size: 14px; color: #666;">Generated on ${reportDate} at ${reportTime}</div>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="font-size: 16px; font-weight: 600; color: #b91c1c; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5;">Account Information</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <div style="padding: 10px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Account Holder</div>
              <div style="font-size: 14px; font-weight: 500; color: #333;">${userProfile.full_name || "N/A"}</div>
            </div>
            <div style="padding: 10px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Email</div>
              <div style="font-size: 14px; font-weight: 500; color: #333;">${userProfile.email || "N/A"}</div>
            </div>
            <div style="padding: 10px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Client ID</div>
              <div style="font-size: 14px; font-weight: 500; color: #333;">${userProfile.client_id || "N/A"}</div>
            </div>
            <div style="padding: 10px; background: #f9f9f9; border-radius: 4px;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Report Period</div>
              <div style="font-size: 14px; font-weight: 500; color: #333;">Current Tax Year</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="font-size: 16px; font-weight: 600; color: #b91c1c; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5;">Tax Breakdown</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr>
                <th style="padding: 12px 15px; text-align: left; background: #b91c1c; color: white; font-weight: 600; font-size: 13px;">Category</th>
                <th style="padding: 12px 15px; text-align: left; background: #b91c1c; color: white; font-weight: 600; font-size: 13px;">Status</th>
                <th style="padding: 12px 15px; text-align: right; background: #b91c1c; color: white; font-weight: 600; font-size: 13px;">Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px;">Pending Taxes</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #d97706;">Awaiting Payment</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px; text-align: right; font-weight: 500;">${formatCurrency(taxStats.pending.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px;">On Hold</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #2563eb;">Under Review</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; font-size: 14px; text-align: right; font-weight: 500;">${formatCurrency(taxStats.on_hold.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-size: 14px;">Paid Taxes</td>
                <td style="padding: 12px 15px; font-size: 14px; color: #16a34a;">Completed</td>
                <td style="padding: 12px 15px; font-size: 14px; text-align: right; font-weight: 500;">${formatCurrency(taxStats.paid.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Pending Amount:</span>
            <span>${formatCurrency(taxStats.pending.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>On Hold Amount:</span>
            <span>${formatCurrency(taxStats.on_hold.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Paid Amount:</span>
            <span>${formatCurrency(taxStats.paid.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #b91c1c; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold;">
            <span>Total Tax Liability:</span>
            <span>${formatCurrency(totalTaxes)}</span>
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #999; padding-top: 20px; border-top: 1px solid #e5e5e5;">
          <p>Malta Crypto Central Bank - Secure Banking Platform</p>
          <p>This document was automatically generated and is valid without signature.</p>
          <p>Report ID: TAX-${Date.now()}</p>
        </div>
      </div>
    `;

    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 10,
      filename: `Tax_Report_${userProfile.client_id || "user"}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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
