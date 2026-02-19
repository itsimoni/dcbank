"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";
import { priceService } from "@/lib/price-service";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  PiggyBank,
  Coins,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  RefreshCw,
  CreditCard,
  Building2,
  Activity,
  Zap,
  Eye,
  FileText,
} from "lucide-react";

interface InsightsSectionProps {
  userProfile: any;
  setActiveTab?: (tab: string) => void;
}

interface BalanceData {
  usd: number;
  euro: number;
  cad: number;
  gbp: number;
  chf: number;
  aud: number;
}

interface CryptoData {
  btc: number;
  eth: number;
  usdt: number;
}

interface BalanceHistoryRecord {
  id: string;
  recorded_at: string;
  usd_balance: number;
  eur_balance: number;
  gbp_balance: number;
  cad_balance: number;
  chf_balance: number;
  aud_balance: number;
  btc_balance: number;
  eth_balance: number;
  usdt_balance: number;
  total_value_usd: number;
}

interface Transaction {
  id: number;
  created_at: string;
  thType: string;
  thDetails: string;
  thStatus: string;
}

const FIAT_COLORS = ["#1e40af", "#0369a1", "#0891b2", "#0d9488", "#059669", "#16a34a"];
const CRYPTO_COLORS = ["#f59e0b", "#6366f1", "#22c55e"];

export default function InsightsSection({ userProfile, setActiveTab }: InsightsSectionProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);
  const [loading, setLoading] = useState(true);
  const [fiatBalances, setFiatBalances] = useState<BalanceData>({
    usd: 0, euro: 0, cad: 0, gbp: 0, chf: 0, aud: 0,
  });
  const [cryptoBalances, setCryptoBalances] = useState<CryptoData>({
    btc: 0, eth: 0, usdt: 0,
  });
  const [cryptoPrices, setCryptoPrices] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [taxData, setTaxData] = useState<{ taxes: number; on_hold: number; paid: number } | null>(null);
  const [externalAccounts, setExternalAccounts] = useState<any[]>([]);
  const [accountAge, setAccountAge] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [
          usdRes, euroRes, cadRes, gbpRes, chfRes, audRes, cryptoRes,
          prices, rates, historyRes, transRes, taxRes, extAccRes, profileRes
        ] = await Promise.all([
          supabase.from("usd_balances").select("balance").eq("user_id", user.id).maybeSingle(),
          supabase.from("euro_balances").select("balance").eq("user_id", user.id).maybeSingle(),
          supabase.from("cad_balances").select("balance").eq("user_id", user.id).maybeSingle(),
          supabase.from("gbp_balances").select("balance").eq("user_id", user.id).maybeSingle(),
          supabase.from("chf_balances").select("balance").eq("user_id", user.id).maybeSingle(),
          supabase.from("aud_balances").select("balance").eq("user_id", user.id).maybeSingle(),
          supabase.from("newcrypto_balances").select("btc_balance, eth_balance, usdt_balance").eq("user_id", user.id).maybeSingle(),
          priceService.getCryptoPrices(),
          priceService.getExchangeRates(),
          supabase.from("balance_history").select("*").eq("user_id", user.id).order("recorded_at", { ascending: true }).limit(30),
          supabase.from("TransactionHistory").select("*").eq("uuid", user.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("taxes").select("taxes, on_hold, paid").eq("user_id", user.id).maybeSingle(),
          supabase.from("external_accounts").select("*").eq("user_id", user.id).eq("is_active", true),
          supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
        ]);

        setFiatBalances({
          usd: Number(usdRes.data?.balance) || 0,
          euro: Number(euroRes.data?.balance) || 0,
          cad: Number(cadRes.data?.balance) || 0,
          gbp: Number(gbpRes.data?.balance) || 0,
          chf: Number(chfRes.data?.balance) || 0,
          aud: Number(audRes.data?.balance) || 0,
        });

        setCryptoBalances({
          btc: Number(cryptoRes.data?.btc_balance) || 0,
          eth: Number(cryptoRes.data?.eth_balance) || 0,
          usdt: Number(cryptoRes.data?.usdt_balance) || 0,
        });

        setCryptoPrices(prices);
        setExchangeRates(rates);
        setBalanceHistory(historyRes.data || []);
        setTransactions(transRes.data || []);
        setTaxData(taxRes.data);
        setExternalAccounts(extAccRes.data || []);

        if (profileRes.data?.created_at) {
          const createdDate = new Date(profileRes.data.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          setAccountAge(diffDays);
        }
      } catch (error) {
        console.error("Error fetching insights data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const convertToUSD = (amount: number, currency: string): number => {
    if (!exchangeRates) return amount;
    const rate = exchangeRates[currency];
    if (!rate) return amount;
    return amount / rate;
  };

  const fiatTotalUSD = useMemo(() =>
    fiatBalances.usd +
    convertToUSD(fiatBalances.euro, "EUR") +
    convertToUSD(fiatBalances.cad, "CAD") +
    convertToUSD(fiatBalances.gbp, "GBP") +
    convertToUSD(fiatBalances.chf, "CHF") +
    convertToUSD(fiatBalances.aud, "AUD"),
    [fiatBalances, exchangeRates]
  );

  const cryptoTotalUSD = useMemo(() => cryptoPrices
    ? cryptoBalances.btc * (cryptoPrices.BTC || 0) +
      cryptoBalances.eth * (cryptoPrices.ETH || 0) +
      cryptoBalances.usdt * 1
    : 0,
    [cryptoBalances, cryptoPrices]
  );

  const totalPortfolioUSD = fiatTotalUSD + cryptoTotalUSD;

  const fiatPercentage = totalPortfolioUSD > 0 ? (fiatTotalUSD / totalPortfolioUSD) * 100 : 0;
  const cryptoPercentage = totalPortfolioUSD > 0 ? (cryptoTotalUSD / totalPortfolioUSD) * 100 : 0;

  const allocationData = useMemo(() => [
    { name: "USD", value: fiatBalances.usd, color: FIAT_COLORS[0] },
    { name: "EUR", value: convertToUSD(fiatBalances.euro, "EUR"), color: FIAT_COLORS[1] },
    { name: "CAD", value: convertToUSD(fiatBalances.cad, "CAD"), color: FIAT_COLORS[2] },
    { name: "GBP", value: convertToUSD(fiatBalances.gbp, "GBP"), color: FIAT_COLORS[3] },
    { name: "CHF", value: convertToUSD(fiatBalances.chf, "CHF"), color: FIAT_COLORS[4] },
    { name: "AUD", value: convertToUSD(fiatBalances.aud, "AUD"), color: FIAT_COLORS[5] },
    { name: "BTC", value: cryptoPrices ? cryptoBalances.btc * cryptoPrices.BTC : 0, color: CRYPTO_COLORS[0] },
    { name: "ETH", value: cryptoPrices ? cryptoBalances.eth * cryptoPrices.ETH : 0, color: CRYPTO_COLORS[1] },
    { name: "USDT", value: cryptoBalances.usdt, color: CRYPTO_COLORS[2] },
  ].filter((item) => item.value > 0), [fiatBalances, cryptoBalances, cryptoPrices, exchangeRates]);

  const balanceChartData = useMemo(() => {
    if (balanceHistory.length === 0) return [];
    return balanceHistory.map((record) => ({
      date: new Date(record.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: Number(record.total_value_usd) || 0,
      fiat: Number(record.usd_balance) + Number(record.eur_balance) + Number(record.gbp_balance) + Number(record.cad_balance),
      crypto: Number(record.btc_balance) + Number(record.eth_balance) + Number(record.usdt_balance),
    }));
  }, [balanceHistory]);

  const transactionStats = useMemo(() => {
    const successful = transactions.filter(t => t.thStatus === "Successful").length;
    const pending = transactions.filter(t => t.thStatus === "Pending").length;
    const failed = transactions.filter(t => t.thStatus === "Failed" || t.thStatus === "Rejected").length;
    const total = transactions.length;

    const last30Days = transactions.filter(t => {
      const txDate = new Date(t.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return txDate >= thirtyDaysAgo;
    }).length;

    const transactionsByMonth: Record<string, number> = {};
    transactions.forEach(tx => {
      const month = new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      transactionsByMonth[month] = (transactionsByMonth[month] || 0) + 1;
    });

    const monthlyData = Object.entries(transactionsByMonth).slice(-6).map(([month, count]) => ({
      month,
      count,
    }));

    return { successful, pending, failed, total, last30Days, monthlyData };
  }, [transactions]);

  const calculateRiskScore = (): { score: number; level: string; color: string } => {
    if (totalPortfolioUSD === 0) return { score: 0, level: "N/A", color: "text-gray-500" };

    let riskScore = 0;
    riskScore += cryptoPercentage * 0.8;

    if (cryptoBalances.btc > 0 && cryptoPrices) {
      const btcValue = cryptoBalances.btc * cryptoPrices.BTC;
      const btcPercentage = (btcValue / totalPortfolioUSD) * 100;
      if (btcPercentage > 30) riskScore += 15;
    }

    const currencies = [
      fiatBalances.usd, fiatBalances.euro, fiatBalances.cad,
      fiatBalances.gbp, fiatBalances.chf, fiatBalances.aud,
    ];
    const nonZeroCurrencies = currencies.filter((c) => c > 0).length;
    if (nonZeroCurrencies <= 1) riskScore += 10;

    riskScore = Math.min(100, Math.max(0, riskScore));

    let level: string;
    let color: string;
    if (riskScore < 25) {
      level = "Conservative";
      color = "text-green-600";
    } else if (riskScore < 50) {
      level = "Moderate";
      color = "text-blue-600";
    } else if (riskScore < 75) {
      level = "Growth";
      color = "text-amber-600";
    } else {
      level = "Aggressive";
      color = "text-red-600";
    }

    return { score: Math.round(riskScore), level, color };
  };

  const risk = calculateRiskScore();

  const generateInsights = useMemo(() => {
    const insights: { type: "success" | "warning" | "info"; icon: any; title: string; description: string }[] = [];

    if (cryptoPercentage > 60) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        title: "High Crypto Exposure",
        description: "Your portfolio is heavily weighted toward cryptocurrency. Consider diversifying into traditional currencies for stability during market volatility.",
      });
    }

    if (fiatPercentage > 90 && totalPortfolioUSD > 10000) {
      insights.push({
        type: "info",
        icon: Lightbulb,
        title: "Conservative Positioning",
        description: "Your portfolio is predominantly fiat-based. While this provides stability, you may be missing potential growth opportunities in digital assets.",
      });
    }

    if (allocationData.length >= 5) {
      insights.push({
        type: "success",
        icon: CheckCircle2,
        title: "Well Diversified",
        description: `You have ${allocationData.length} different assets in your portfolio. This diversification helps protect against currency-specific risks.`,
      });
    }

    if (transactionStats.successful > 10) {
      insights.push({
        type: "success",
        icon: Activity,
        title: "Active Account",
        description: `You have ${transactionStats.successful} successful transactions. Your account shows healthy activity patterns.`,
      });
    }

    if (taxData && taxData.on_hold > 0) {
      insights.push({
        type: "warning",
        icon: FileText,
        title: "Pending Tax Obligations",
        description: `You have $${taxData.on_hold.toLocaleString()} in taxes on hold. Consider resolving this to avoid any transfer restrictions.`,
      });
    }

    if (externalAccounts.length === 0) {
      insights.push({
        type: "info",
        icon: Building2,
        title: "Link External Accounts",
        description: "Consider linking external bank accounts for easier fund transfers and a complete view of your finances.",
      });
    }

    if (balanceHistory.length >= 2) {
      const firstRecord = balanceHistory[0];
      const lastRecord = balanceHistory[balanceHistory.length - 1];
      const change = Number(lastRecord.total_value_usd) - Number(firstRecord.total_value_usd);
      if (change > 0) {
        insights.push({
          type: "success",
          icon: TrendingUp,
          title: "Portfolio Growth",
          description: `Your portfolio has grown by $${change.toLocaleString(undefined, { maximumFractionDigits: 2 })} over the tracked period. Keep up the good work!`,
        });
      }
    }

    if (accountAge > 365) {
      insights.push({
        type: "success",
        icon: Calendar,
        title: "Loyal Customer",
        description: `You've been with us for ${Math.floor(accountAge / 365)} year${accountAge >= 730 ? 's' : ''}. Thank you for your continued trust!`,
      });
    }

    return insights.slice(0, 4);
  }, [cryptoPercentage, fiatPercentage, totalPortfolioUSD, allocationData.length, transactionStats, taxData, externalAccounts.length, balanceHistory, accountAge]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 pt-16 md:pt-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b91c1c]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16 md:pt-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#b91c1c]/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#b91c1c]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.insights || "Portfolio Insights"}</h1>
          <p className="text-sm text-gray-500">Comprehensive analysis of your financial health</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Total Portfolio</span>
              <PiggyBank className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalPortfolioUSD)}</p>
            <p className="text-xs text-gray-500 mt-1">USD equivalent</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Fiat Holdings</span>
              <Coins className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(fiatTotalUSD)}</p>
            <p className="text-xs text-blue-600 mt-1">{fiatPercentage.toFixed(1)}% of portfolio</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Crypto Holdings</span>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(cryptoTotalUSD)}</p>
            <p className="text-xs text-amber-600 mt-1">{cryptoPercentage.toFixed(1)}% of portfolio</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Risk Profile</span>
              <Shield className={`w-5 h-5 ${risk.color}`} />
            </div>
            <p className={`text-2xl font-semibold ${risk.color}`}>{risk.level}</p>
            <p className="text-xs text-gray-500 mt-1">Score: {risk.score}/100</p>
          </CardContent>
        </Card>
      </div>

      {generateInsights.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#b91c1c]" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generateInsights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === "success"
                        ? "bg-green-50 border-green-500"
                        : insight.type === "warning"
                        ? "bg-amber-50 border-amber-500"
                        : "bg-blue-50 border-blue-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          insight.type === "success"
                            ? "text-green-600"
                            : insight.type === "warning"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900">
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconSize={10}
                      formatter={(value) => (
                        <span className="text-sm text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No assets to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900">
              Fiat vs Crypto Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-sm text-gray-600">Fiat Currencies</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{fiatPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={fiatPercentage} className="h-3 bg-gray-100" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm text-gray-600">Cryptocurrency</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{cryptoPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={cryptoPercentage} className="h-3 bg-gray-100" />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Diversification Status</h4>
              {cryptoPercentage > 50 ? (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    Heavy crypto weighting. Consider balancing with traditional currencies.
                  </p>
                </div>
              ) : fiatPercentage > 90 ? (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    Conservative positioning with strong fiat holdings.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-800">
                    Balanced mix of traditional and digital assets.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {balanceChartData.length > 1 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900">
              Portfolio Value Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceChartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#b91c1c"
                    strokeWidth={2}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-900">
            Transaction Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-2xl font-semibold text-gray-900">{transactionStats.total}</p>
              <p className="text-xs text-gray-500">Total Transactions</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-2xl font-semibold text-green-600">{transactionStats.successful}</p>
              <p className="text-xs text-gray-500">Successful</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-2xl font-semibold text-amber-600">{transactionStats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-2xl font-semibold text-red-600">{transactionStats.failed}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </div>

          {transactionStats.monthlyData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionStats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#b91c1c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-900">
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Volatility Exposure</span>
                <span className={`text-sm font-medium ${cryptoPercentage > 30 ? "text-amber-600" : "text-green-600"}`}>
                  {cryptoPercentage > 30 ? "Moderate" : "Low"}
                </span>
              </div>
              <Progress value={cryptoPercentage} className="h-2 bg-gray-100" />
              <p className="text-xs text-gray-500">
                Based on cryptocurrency holdings ({cryptoPercentage.toFixed(0)}% of portfolio)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Currency Diversification</span>
                <span className={`text-sm font-medium ${allocationData.length >= 3 ? "text-green-600" : "text-amber-600"}`}>
                  {allocationData.length >= 3 ? "Good" : "Limited"}
                </span>
              </div>
              <Progress value={Math.min(100, allocationData.length * 15)} className="h-2 bg-gray-100" />
              <p className="text-xs text-gray-500">
                {allocationData.length} active {allocationData.length === 1 ? "currency" : "currencies"} in portfolio
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Risk Score</span>
                <span className={`text-sm font-medium ${risk.color}`}>{risk.score}/100</span>
              </div>
              <Progress value={risk.score} className="h-2 bg-gray-100" />
              <p className="text-xs text-gray-500">
                {risk.level} risk profile based on asset composition
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              Fiat Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { code: "USD", balance: fiatBalances.usd, symbol: "$" },
                { code: "EUR", balance: fiatBalances.euro, symbol: "\u20ac" },
                { code: "GBP", balance: fiatBalances.gbp, symbol: "\u00a3" },
                { code: "CAD", balance: fiatBalances.cad, symbol: "C$" },
                { code: "CHF", balance: fiatBalances.chf, symbol: "Fr" },
                { code: "AUD", balance: fiatBalances.aud, symbol: "A$" },
              ].map((currency) => (
                <div key={currency.code} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{currency.code}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currency.symbol}{currency.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Crypto Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  code: "BTC",
                  balance: cryptoBalances.btc,
                  valueUSD: cryptoPrices ? cryptoBalances.btc * cryptoPrices.BTC : 0,
                  price: cryptoPrices?.BTC || 0,
                },
                {
                  code: "ETH",
                  balance: cryptoBalances.eth,
                  valueUSD: cryptoPrices ? cryptoBalances.eth * cryptoPrices.ETH : 0,
                  price: cryptoPrices?.ETH || 0,
                },
                {
                  code: "USDT",
                  balance: cryptoBalances.usdt,
                  valueUSD: cryptoBalances.usdt,
                  price: 1,
                },
              ].map((crypto) => (
                <div key={crypto.code} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <span className="text-sm text-gray-600">{crypto.code}</span>
                    <p className="text-xs text-gray-400">
                      {crypto.balance.toFixed(crypto.code === "USDT" ? 2 : 6)} @ ${crypto.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(crypto.valueUSD)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {(taxData || externalAccounts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {taxData && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Tax Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-lg font-semibold text-gray-900">${taxData.taxes.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Taxes</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg text-center">
                    <p className="text-lg font-semibold text-amber-600">${taxData.on_hold.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">On Hold</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-lg font-semibold text-green-600">${taxData.paid.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Paid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {externalAccounts.length > 0 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  Linked Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {externalAccounts.slice(0, 3).map((account) => (
                    <div key={account.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{account.bank_name}</p>
                          <p className="text-xs text-gray-500">****{account.last4 || "****"}</p>
                        </div>
                      </div>
                      <Badge variant={account.is_verified ? "default" : "secondary"} className="text-xs">
                        {account.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card className="bg-gray-50 border-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-gray-400" />
            <p className="text-xs text-gray-500">
              This analysis is based on your current portfolio composition and transaction history.
              Past performance does not guarantee future results. Consider consulting a financial advisor for personalized advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
