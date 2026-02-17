"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface BalanceComparisonGraphProps {
  userId: string;
}

interface BalanceData {
  name: string;
  fiat: number;
  crypto: number;
  total: number;
}

export default function BalanceComparisonGraph({ userId }: BalanceComparisonGraphProps) {
  const { language } = useLanguage();
  const t = getTranslations(language);

  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiat, setTotalFiat] = useState(0);
  const [totalCrypto, setTotalCrypto] = useState(0);
  const [cryptoPrices, setCryptoPrices] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any>(null);
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

      const { data: usdData, error: usdError } = await supabase
        .from("usd_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: euroData, error: euroError } = await supabase
        .from("euro_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: cadData, error: cadError } = await supabase
        .from("cad_balances")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: cryptoBalances, error: cryptoError } = await supabase
        .from("newcrypto_balances")
        .select("btc_balance, eth_balance, usdt_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (usdError) console.error("USD balance error:", usdError);
      if (euroError) console.error("Euro balance error:", euroError);
      if (cadError) console.error("CAD balance error:", cadError);
      if (cryptoError) console.error("Crypto balance error:", cryptoError);

      const usdBalance = Number(usdData?.balance || 0);
      const euroBalance = Number(euroData?.balance || 0);
      const cadBalance = Number(cadData?.balance || 0);

      const usdToEur = rates?.EUR || 0.92;
      const cadToEur = rates?.EUR && rates?.CAD ? rates.EUR / rates.CAD : 0.68;

      const totalFiatInEur =
        (usdBalance * usdToEur) +
        euroBalance +
        (cadBalance * cadToEur);

      const btcBalance = Number(cryptoBalances?.btc_balance || 0);
      const ethBalance = Number(cryptoBalances?.eth_balance || 0);
      const usdtBalance = Number(cryptoBalances?.usdt_balance || 0);

      const btcPrice = prices?.bitcoin?.eur || 39750;
      const ethPrice = prices?.ethereum?.eur || 2440;
      const usdtPrice = prices?.tether?.eur || 0.92;

      const totalCryptoInEur =
        (btcBalance * btcPrice) +
        (ethBalance * ethPrice) +
        (usdtBalance * usdtPrice);

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

      const btcInEur = btcBalance * btcPrice;
      const ethInEur = ethBalance * ethPrice;
      const usdtInEur = usdtBalance * usdtPrice;

      const chartData: BalanceData[] = [
        {
          name: "USD",
          fiat: usdBalance * usdToEur,
          crypto: btcInEur,
          total: (usdBalance * usdToEur) + btcInEur,
        },
        {
          name: "EUR",
          fiat: euroBalance,
          crypto: ethInEur,
          total: euroBalance + ethInEur,
        },
        {
          name: "CAD",
          fiat: cadBalance * cadToEur,
          crypto: usdtInEur,
          total: (cadBalance * cadToEur) + usdtInEur,
        },
        {
          name: "Totals",
          fiat: totalFiatInEur,
          crypto: totalCryptoInEur,
          total: totalFiatInEur + totalCryptoInEur,
        },
      ];

      setBalanceData(chartData);
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const percentageFiat = totalFiat + totalCrypto > 0
    ? (totalFiat / (totalFiat + totalCrypto)) * 100
    : 0;
  const percentageCrypto = totalFiat + totalCrypto > 0
    ? (totalCrypto / (totalFiat + totalCrypto)) * 100
    : 0;

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t.statistics}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#b91c1c] to-[#991b1b] rounded-lg p-4 text-white">
            <div className="text-sm opacity-90 mb-1">{t.totalFiatBalance}</div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(totalFiat)}</div>
            <div className="text-xs opacity-80">
              USD: {formatCurrency(rawBalances.usd * (exchangeRates?.EUR || 0.92))} |
              EUR: €{rawBalances.euro.toFixed(2)} |
              CAD: {formatCurrency(rawBalances.cad * (exchangeRates?.EUR && exchangeRates?.CAD ? exchangeRates.EUR / exchangeRates.CAD : 0.68))}
            </div>
            <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {percentageFiat < 0.01 ? '<0.01' : percentageFiat.toFixed(2)}% {t.ofTotal}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90 mb-1">{t.totalCryptoBalance}</div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(totalCrypto)}</div>
            <div className="text-xs opacity-80">
              BTC: {formatCurrency(rawBalances.btc * (cryptoPrices?.bitcoin?.eur || 39750))} |
              ETH: {formatCurrency(rawBalances.eth * (cryptoPrices?.ethereum?.eur || 2440))} |
              USDT: {formatCurrency(rawBalances.usdt * (cryptoPrices?.tether?.eur || 0.92))}
            </div>
            <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {percentageCrypto > 99.99 ? '>99.99' : percentageCrypto.toFixed(2)}% {t.ofTotal}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90 mb-1">{t.combinedTotal}</div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(totalFiat + totalCrypto)}
            </div>
            <div className="text-xs opacity-80">{t.allCurrenciesCombined}</div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={balanceData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorFiat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '11px' }}
                tickFormatter={formatCompactCurrency}
                scale="log"
                domain={['auto', 'auto']}
                allowDataOverflow={false}
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
                dataKey="fiat"
                stroke="#b91c1c"
                strokeWidth={3}
                fill="url(#colorFiat)"
                name={t.fiat}
              />
              <Area
                type="monotone"
                dataKey="crypto"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#colorCrypto)"
                name={t.crypto}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2 font-medium">{t.balanceBreakdown}</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
            <div>
              <div className="text-gray-500">USD</div>
              <div className="font-semibold text-[#b91c1c]">
                ${rawBalances.usd.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">EUR</div>
              <div className="font-semibold text-[#b91c1c]">
                €{rawBalances.euro.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">CAD</div>
              <div className="font-semibold text-[#b91c1c]">
                C${rawBalances.cad.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">BTC</div>
              <div className="font-semibold text-blue-600">
                ₿{rawBalances.btc.toFixed(8)}
              </div>
              <div className="text-gray-400 mt-0.5">
                {formatCurrency(rawBalances.btc * (cryptoPrices?.bitcoin?.eur || 39750))}
              </div>
            </div>
            <div>
              <div className="text-gray-500">ETH</div>
              <div className="font-semibold text-blue-600">
                Ξ{rawBalances.eth.toFixed(8)}
              </div>
              <div className="text-gray-400 mt-0.5">
                {formatCurrency(rawBalances.eth * (cryptoPrices?.ethereum?.eur || 2440))}
              </div>
            </div>
            <div>
              <div className="text-gray-500">USDT</div>
              <div className="font-semibold text-blue-600">
                ₮{rawBalances.usdt.toFixed(2)}
              </div>
              <div className="text-gray-400 mt-0.5">
                {formatCurrency(rawBalances.usdt * (cryptoPrices?.tether?.eur || 0.92))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
