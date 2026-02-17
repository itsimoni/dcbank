"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { priceService } from "@/lib/price-service";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

interface BalanceComparisonGraphProps {
  userId: string;
}

type ViewMode = 'all' | 'fiat' | 'crypto';

interface ChartDataPoint {
  name: string;
  usd?: number;
  eur?: number;
  cad?: number;
  btc?: number;
  eth?: number;
  usdt?: number;
  value?: number;
}

export default function BalanceComparisonGraph({ userId }: BalanceComparisonGraphProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [totalFiat, setTotalFiat] = useState(0);
  const [totalCrypto, setTotalCrypto] = useState(0);
  const [cryptoPrices, setCryptoPrices] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
  const [balancesInEur, setBalancesInEur] = useState({
    usd: 0,
    euro: 0,
    cad: 0,
    btc: 0,
    eth: 0,
    usdt: 0,
  });
  const [rawBalances, setRawBalances] = useState({
    usd: 0,
    euro: 0,
    cad: 0,
    btc: 0,
    eth: 0,
    usdt: 0,
  });

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchBalances = async () => {
    try {
      const [prices, rates] = await Promise.all([
        priceService.getCryptoPrices(),
        priceService.getExchangeRates(),
      ]);

      setCryptoPrices(prices);
      setExchangeRates(rates);

      const { data: usdData } = await supabase
        .from("usd_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: euroData } = await supabase
        .from("euro_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: cadData } = await supabase
        .from("cad_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: cryptoBalances } = await supabase
        .from("newcrypto_balances")
        .select("btc_balance, eth_balance, usdt_balance")
        .eq("user_id", userId)
        .maybeSingle();

      const usdBalance = Number(usdData?.balance || 0);
      const euroBalance = Number(euroData?.balance || 0);
      const cadBalance = Number(cadData?.balance || 0);

      const usdToEur = rates?.EUR || 0.92;
      const cadToEur = rates?.EUR && rates?.CAD ? rates.EUR / rates.CAD : 0.68;

      const usdInEur = usdBalance * usdToEur;
      const cadInEur = cadBalance * cadToEur;

      const totalFiatInEur = usdInEur + euroBalance + cadInEur;

      const btcBalance = Number(cryptoBalances?.btc_balance || 0);
      const ethBalance = Number(cryptoBalances?.eth_balance || 0);
      const usdtBalance = Number(cryptoBalances?.usdt_balance || 0);

      const btcPrice = prices?.bitcoin?.eur || 39750;
      const ethPrice = prices?.ethereum?.eur || 2440;
      const usdtPrice = prices?.tether?.eur || 0.92;

      const btcInEur = btcBalance * btcPrice;
      const ethInEur = ethBalance * ethPrice;
      const usdtInEur = usdtBalance * usdtPrice;

      const totalCryptoInEur = btcInEur + ethInEur + usdtInEur;

      setTotalFiat(totalFiatInEur);
      setTotalCrypto(totalCryptoInEur);

      setRawBalances({
        usd: usdBalance,
        euro: euroBalance,
        cad: cadBalance,
        btc: btcBalance,
        eth: ethBalance,
        usdt: usdtBalance,
      });

      setBalancesInEur({
        usd: usdInEur,
        euro: euroBalance,
        cad: cadInEur,
        btc: btcInEur,
        eth: ethInEur,
        usdt: usdtInEur,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching balances:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value.toFixed(0)}`;
  };

  const getChartData = (): ChartDataPoint[] => {
    if (viewMode === 'fiat') {
      return [
        { name: 'USD', value: balancesInEur.usd },
        { name: 'EUR', value: balancesInEur.euro },
        { name: 'CAD', value: balancesInEur.cad },
      ];
    } else if (viewMode === 'crypto') {
      return [
        { name: 'BTC', value: balancesInEur.btc },
        { name: 'ETH', value: balancesInEur.eth },
        { name: 'USDT', value: balancesInEur.usdt },
      ];
    } else {
      // For "All" view - show all 6 currencies
      return [
        { name: 'USD', value: balancesInEur.usd },
        { name: 'EUR', value: balancesInEur.euro },
        { name: 'CAD', value: balancesInEur.cad },
        { name: 'BTC', value: balancesInEur.btc },
        { name: 'ETH', value: balancesInEur.eth },
        { name: 'USDT', value: balancesInEur.usdt },
      ];
    }
  };

  const percentageFiat = totalFiat + totalCrypto > 0
    ? (totalFiat / (totalFiat + totalCrypto)) * 100
    : 0;
  const percentageCrypto = totalFiat + totalCrypto > 0
    ? (totalCrypto / (totalFiat + totalCrypto)) * 100
    : 0;

  // Helper to check if a currency has balance
  const hasBalance = {
    usd: balancesInEur.usd > 0,
    eur: balancesInEur.euro > 0,
    cad: balancesInEur.cad > 0,
    btc: balancesInEur.btc > 0,
    eth: balancesInEur.eth > 0,
    usdt: balancesInEur.usdt > 0,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.balanceComparison}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b91c1c]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = getChartData();
  const hasAnyBalance = totalFiat + totalCrypto > 0;

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t.statistics}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              className={viewMode === 'all' ? 'bg-[#b91c1c] hover:bg-[#991b1b] rounded-none' : 'rounded-none'}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'fiat' ? 'default' : 'outline'}
              onClick={() => setViewMode('fiat')}
              className={viewMode === 'fiat' ? 'bg-[#b91c1c] hover:bg-[#991b1b] rounded-none' : 'rounded-none'}
            >
              Fiat
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'crypto' ? 'default' : 'outline'}
              onClick={() => setViewMode('crypto')}
              className={viewMode === 'crypto' ? 'bg-[#b91c1c] hover:bg-[#991b1b] rounded-none' : 'rounded-none'}
            >
              Crypto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">{t.totalFiatBalance}</div>
            <div className="text-2xl font-bold mb-2 text-gray-900">{formatCurrency(totalFiat)}</div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>USD: {formatCurrency(balancesInEur.usd)}</div>
              <div>EUR: {formatCurrency(balancesInEur.euro)}</div>
              <div>CAD: {formatCurrency(balancesInEur.cad)}</div>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3" />
              {percentageFiat < 0.01 && percentageFiat > 0 ? '<0.01' : percentageFiat.toFixed(2)}% {t.ofTotal}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">{t.totalCryptoBalance}</div>
            <div className="text-2xl font-bold mb-2 text-gray-900">{formatCurrency(totalCrypto)}</div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>BTC: {formatCurrency(balancesInEur.btc)}</div>
              <div>ETH: {formatCurrency(balancesInEur.eth)}</div>
              <div>USDT: {formatCurrency(balancesInEur.usdt)}</div>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3" />
              {percentageCrypto > 99.99 ? '>99.99' : percentageCrypto.toFixed(2)}% {t.ofTotal}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">{t.combinedTotal}</div>
            <div className="text-2xl font-bold mb-2 text-gray-900">
              {formatCurrency(totalFiat + totalCrypto)}
            </div>
            <div className="text-xs text-gray-700">{t.allCurrenciesCombined}</div>
            <div className="text-xs text-gray-600 mt-2">
              {t.allBalancesConvertedToEur || "All balances converted to EUR"}
            </div>
          </div>
        </div>

        {hasAnyBalance ? (
          <div className="h-80 w-full bg-white border border-gray-200 p-4">
            <ResponsiveContainer width="100%" height="100%" key={viewMode}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorCAD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#991b1b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#991b1b" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorETH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorUSDT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  hide={false}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '11px' }}
                  tickFormatter={formatCompactCurrency}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#colorValue)"
                  name={
                    viewMode === 'all'
                      ? 'Total Balance'
                      : viewMode === 'fiat'
                        ? 'Fiat Balance'
                        : 'Crypto Balance'
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 w-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No balance data available yet</p>
              <p className="text-xs mt-1">Complete your first transaction to see the graph</p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50">
          <div className="text-sm text-gray-600 mb-3 font-medium">{t.balanceBreakdown}</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="text-gray-500 mb-1">USD</div>
              <div className="font-semibold text-[#b91c1c]">
                ${rawBalances.usd.toFixed(2)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                ≈ {formatCurrency(balancesInEur.usd)}
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="text-gray-500 mb-1">EUR</div>
              <div className="font-semibold text-[#b91c1c]">
                €{rawBalances.euro.toFixed(2)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Base currency
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="text-gray-500 mb-1">CAD</div>
              <div className="font-semibold text-[#b91c1c]">
                C${rawBalances.cad.toFixed(2)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                ≈ {formatCurrency(balancesInEur.cad)}
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="text-gray-500 mb-1">BTC</div>
              <div className="font-semibold text-blue-600">
                ₿{rawBalances.btc.toFixed(8)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                ≈ {formatCurrency(balancesInEur.btc)}
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="text-gray-500 mb-1">ETH</div>
              <div className="font-semibold text-blue-600">
                Ξ{rawBalances.eth.toFixed(8)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                ≈ {formatCurrency(balancesInEur.eth)}
              </div>
            </div>
            <div className="p-3 bg-white rounded border border-gray-200">
              <div className="text-gray-500 mb-1">USDT</div>
              <div className="font-semibold text-blue-600">
                ₮{rawBalances.usdt.toFixed(2)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                ≈ {formatCurrency(balancesInEur.usdt)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
