"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { priceService } from "@/lib/price-service";
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

      const eurToUsd = rates?.EUR ? 1 / rates.EUR : 1.09;
      const cadToUsd = rates?.CAD ? 1 / rates.CAD : 0.74;

      const totalFiatInUsd =
        usdBalance +
        (euroBalance * eurToUsd) +
        (cadBalance * cadToUsd);

      const btcBalance = Number(cryptoBalances?.btc_balance || 0);
      const ethBalance = Number(cryptoBalances?.eth_balance || 0);
      const usdtBalance = Number(cryptoBalances?.usdt_balance || 0);

      const btcPrice = prices?.bitcoin?.usd || 43250;
      const ethPrice = prices?.ethereum?.usd || 2650;
      const usdtPrice = prices?.tether?.usd || 1;

      const totalCryptoInUsd =
        (btcBalance * btcPrice) +
        (ethBalance * ethPrice) +
        (usdtBalance * usdtPrice);

      setTotalFiat(totalFiatInUsd);
      setTotalCrypto(totalCryptoInUsd);

      setRawBalances({
        usd: usdBalance,
        euro: euroBalance,
        cad: cadBalance,
        btc: btcBalance,
        eth: ethBalance,
        usdt: usdtBalance,
      });

      const chartData: BalanceData[] = [
        {
          name: "USD",
          fiat: usdBalance,
          crypto: 0,
          total: usdBalance,
        },
        {
          name: "EUR",
          fiat: usdBalance + (euroBalance * eurToUsd),
          crypto: 0,
          total: usdBalance + (euroBalance * eurToUsd),
        },
        {
          name: "CAD",
          fiat: totalFiatInUsd,
          crypto: 0,
          total: totalFiatInUsd,
        },
        {
          name: "BTC",
          fiat: totalFiatInUsd,
          crypto: btcBalance * btcPrice,
          total: totalFiatInUsd + (btcBalance * btcPrice),
        },
        {
          name: "ETH",
          fiat: totalFiatInUsd,
          crypto: (btcBalance * btcPrice) + (ethBalance * ethPrice),
          total: totalFiatInUsd + (btcBalance * btcPrice) + (ethBalance * ethPrice),
        },
        {
          name: "USDT",
          fiat: totalFiatInUsd,
          crypto: totalCryptoInUsd,
          total: totalFiatInUsd + totalCryptoInUsd,
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
          <CardTitle>Balance Comparison</CardTitle>
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
          <DollarSign className="h-5 w-5 text-[#b91c1c]" />
          Fiat vs Crypto Balance Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#b91c1c] to-[#991b1b] rounded-lg p-4 text-white">
            <div className="text-sm opacity-90 mb-1">Total Fiat Balance</div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(totalFiat)}</div>
            <div className="text-xs opacity-80 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {percentageFiat.toFixed(1)}% of total
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90 mb-1">Total Crypto Balance</div>
            <div className="text-2xl font-bold mb-1">{formatCurrency(totalCrypto)}</div>
            <div className="text-xs opacity-80 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {percentageCrypto.toFixed(1)}% of total
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-white">
            <div className="text-sm opacity-90 mb-1">Combined Total</div>
            <div className="text-2xl font-bold mb-1">
              {formatCurrency(totalFiat + totalCrypto)}
            </div>
            <div className="text-xs opacity-80">All currencies combined</div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={balanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
                style={{ fontSize: '12px' }}
                tickFormatter={formatCurrency}
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
                stackId="1"
                stroke="#b91c1c"
                strokeWidth={2}
                fill="url(#colorFiat)"
                name="Fiat Balance"
              />
              <Area
                type="monotone"
                dataKey="crypto"
                stackId="1"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#colorCrypto)"
                name="Crypto Balance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2 font-medium">Balance Breakdown:</div>
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
                {formatCurrency(rawBalances.btc * (cryptoPrices?.bitcoin?.usd || 43250))}
              </div>
            </div>
            <div>
              <div className="text-gray-500">ETH</div>
              <div className="font-semibold text-blue-600">
                Ξ{rawBalances.eth.toFixed(8)}
              </div>
              <div className="text-gray-400 mt-0.5">
                {formatCurrency(rawBalances.eth * (cryptoPrices?.ethereum?.usd || 2650))}
              </div>
            </div>
            <div>
              <div className="text-gray-500">USDT</div>
              <div className="font-semibold text-blue-600">
                ₮{rawBalances.usdt.toFixed(2)}
              </div>
              <div className="text-gray-400 mt-0.5">
                {formatCurrency(rawBalances.usdt * (cryptoPrices?.tether?.usd || 1))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
