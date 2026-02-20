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

  const exportTaxReport = () => {
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

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Tax Report - ${userProfile.full_name || userProfile.email}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #fff; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #b91c1c; }
    .logo { font-size: 28px; font-weight: bold; color: #b91c1c; margin-bottom: 8px; }
    .report-title { font-size: 22px; color: #333; margin-bottom: 4px; }
    .report-date { font-size: 14px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 600; color: #b91c1c; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .info-item { padding: 10px; background: #f9f9f9; border-radius: 4px; }
    .info-label { font-size: 12px; color: #666; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 500; color: #333; }
    .tax-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .tax-table th, .tax-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    .tax-table th { background: #b91c1c; color: white; font-weight: 600; font-size: 13px; }
    .tax-table td { font-size: 14px; }
    .tax-table tr:last-child td { border-bottom: none; }
    .tax-table .amount { text-align: right; font-weight: 500; }
    .status-pending { color: #d97706; }
    .status-hold { color: #2563eb; }
    .status-paid { color: #16a34a; }
    .summary { margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 6px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .summary-row.total { border-top: 2px solid #b91c1c; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; }
    .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; padding-top: 20px; border-top: 1px solid #e5e5e5; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Digital Chain</div>
    <div class="report-title">Tax Report</div>
    <div class="report-date">Generated on ${reportDate} at ${reportTime}</div>
  </div>

  <div class="section">
    <div class="section-title">Account Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Account Holder</div>
        <div class="info-value">${userProfile.full_name || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${userProfile.email || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Client ID</div>
        <div class="info-value">${userProfile.client_id || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Report Period</div>
        <div class="info-value">Current Tax Year</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Tax Breakdown</div>
    <table class="tax-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Status</th>
          <th class="amount">Amount (USD)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pending Taxes</td>
          <td><span class="status-pending">Awaiting Payment</span></td>
          <td class="amount">${formatCurrency(taxStats.pending.amount)}</td>
        </tr>
        <tr>
          <td>On Hold</td>
          <td><span class="status-hold">Under Review</span></td>
          <td class="amount">${formatCurrency(taxStats.on_hold.amount)}</td>
        </tr>
        <tr>
          <td>Paid Taxes</td>
          <td><span class="status-paid">Completed</span></td>
          <td class="amount">${formatCurrency(taxStats.paid.amount)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="summary">
    <div class="summary-row">
      <span>Pending Amount:</span>
      <span>${formatCurrency(taxStats.pending.amount)}</span>
    </div>
    <div class="summary-row">
      <span>On Hold Amount:</span>
      <span>${formatCurrency(taxStats.on_hold.amount)}</span>
    </div>
    <div class="summary-row">
      <span>Paid Amount:</span>
      <span>${formatCurrency(taxStats.paid.amount)}</span>
    </div>
    <div class="summary-row total">
      <span>Total Tax Liability:</span>
      <span>${formatCurrency(totalTaxes)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Digital Chain - Secure Banking Platform</p>
    <p>This document was automatically generated and is valid without signature.</p>
    <p>Report ID: TAX-${Date.now()}</p>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
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
