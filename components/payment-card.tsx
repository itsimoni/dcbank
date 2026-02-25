"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { getTranslations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentRecord {
  id: string;
  user_id: string;
  payments: number;
  on_hold: number;
  paid: number;
  created_at: string;
  updated_at: string;
}

interface PaymentStats {
  pending: { count: number; amount: number };
  on_hold: { count: number; amount: number };
  paid: { count: number; amount: number };
}

interface PaymentCardProps {
  userProfile: {
    id: string;
    client_id: string;
    full_name: string | null;
    email: string | null;
  };
  setActiveTab: (tab: string) => void;
}

export default function PaymentCard({
  userProfile,
  setActiveTab,
}: PaymentCardProps) {
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    pending: { count: 0, amount: 0 },
    on_hold: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
  });
  const { language } = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);

  useEffect(() => {
    fetchPayments();
    setupPaymentSubscription();
  }, [userProfile]);

  const fetchPayments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newRecord, error: insertError } = await supabase
            .from("user_payments")
            .insert({
              user_id: user.id,
              payments: 0,
              on_hold: 0,
              paid: 0,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating payment record:", insertError);
            return;
          }

          setPaymentRecord(newRecord);
          setPaymentStats({
            pending: { count: 0, amount: 0 },
            on_hold: { count: 0, amount: 0 },
            paid: { count: 0, amount: 0 },
          });
        } else {
          console.error("Error fetching payments:", error);
          return;
        }
      } else {
        setPaymentRecord(data);
        setPaymentStats({
          pending: {
            count: data.payments > 0 ? 1 : 0,
            amount: Number(data.payments),
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
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupPaymentSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const subscription = supabase
      .channel(`user_payments_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_payments",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Payment change detected:", payload);
          fetchPayments();
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

  const exportPaymentReport = async () => {
    const totalPayments =
      paymentStats.pending.amount +
      paymentStats.on_hold.amount +
      paymentStats.paid.amount;
    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const reportTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const reportId = `PAY-${Date.now()}`;
    const formattedName = formatName(userProfile.full_name);

    const container = document.createElement("div");
    container.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; background: #fff; color: #1a1a1a; max-width: 100%; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 3px solid #b91c1c;">
          <div style="font-size: 24px; font-weight: bold; color: #b91c1c; margin-bottom: 5px;">Malta Crypto Central Bank</div>
          <div style="font-size: 18px; color: #333; margin-bottom: 3px;">Payment Report</div>
          <div style="font-size: 12px; color: #666;">${reportDate} ${reportTime}</div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-size: 14px; font-weight: 600; color: #b91c1c; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e5e5;">Account Information</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="padding: 8px; background: #f9f9f9;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Account Holder</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">${formattedName}</div>
            </div>
            <div style="padding: 8px; background: #f9f9f9;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Email</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">${userProfile.email || "N/A"}</div>
            </div>
            <div style="padding: 8px; background: #f9f9f9;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Client ID</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">${userProfile.client_id || "N/A"}</div>
            </div>
            <div style="padding: 8px; background: #f9f9f9;">
              <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Report Period</div>
              <div style="font-size: 12px; font-weight: 500; color: #333;">Current Period</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-size: 14px; font-weight: 600; color: #b91c1c; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e5e5;">Payment Breakdown</div>
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
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px;">Pending Payments</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px;">Awaiting Payment</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; font-weight: 500;">${formatCurrency(paymentStats.pending.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px;">On Hold</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px;">Under Review</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; font-weight: 500;">${formatCurrency(paymentStats.on_hold.amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 10px; font-size: 12px;">Completed Payments</td>
                <td style="padding: 8px 10px; font-size: 12px;">Completed</td>
                <td style="padding: 8px 10px; font-size: 12px; text-align: right; font-weight: 500;">${formatCurrency(paymentStats.paid.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="padding: 15px; background: #f5f5f5; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px;">
            <span>Pending Amount:</span>
            <span>${formatCurrency(paymentStats.pending.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px;">
            <span>On Hold Amount:</span>
            <span>${formatCurrency(paymentStats.on_hold.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px;">
            <span>Paid Amount:</span>
            <span>${formatCurrency(paymentStats.paid.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #b91c1c; margin-top: 8px; font-size: 14px; font-weight: bold;">
            <span>Total Payment Liability:</span>
            <span>${formatCurrency(totalPayments)}</span>
          </div>
        </div>

        <div style="margin-top: 25px; text-align: center;">
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
            <text x="50" y="68" text-anchor="middle" font-size="4" fill="#8b0000">${reportDate.split(",")[0].toUpperCase()}</text>
          </svg>
          <div style="font-size: 7px; color: #888; margin-top: 4px;">Digital Verification Seal</div>
          <div style="font-size: 6px; color: #aaa;">Hash: ${reportId.substring(4, 12).toUpperCase()}</div>
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
      filename: `Payment_Report_${userProfile.client_id || "user"}_${new Date().toISOString().split("T")[0]}.pdf`,
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
          <CreditCard className="h-5 w-5" />
          <span>{t.paymentManagement || "Payment Management"}</span>
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
                    {t.pending || "Pending"}
                  </span>
                </div>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(paymentStats.pending.amount)}
                </p>
              </div>

              <div className="bg-white p-3 border border-[#b91c1c]">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-black">
                    {t.onHold || "On Hold"}
                  </span>
                </div>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(paymentStats.on_hold.amount)}
                </p>
              </div>

              <div className="bg-white p-3 border border-[#b91c1c]">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-black">
                    {t.paid || "Paid"}
                  </span>
                </div>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(paymentStats.paid.amount)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => setActiveTab("payments")}
                className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b] text-white"
              >
                {t.makePayment || "Make a Payment"}
              </Button>
              <Button
                onClick={exportPaymentReport}
                className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b] text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t.exportPaymentReport || "Export Payment Report (PDF)"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
