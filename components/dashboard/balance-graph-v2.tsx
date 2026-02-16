"use client";
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, Wallet, Activity } from "lucide-react";

interface TransactionHistory {
  id: number;
  created_at: string;
  thType: string;
  thDetails: string;
  thPoi: string;
  thStatus: string;
  uuid: string;
  thEmail: string | null;
}

interface BalanceGraphProps {
  transactionHistory: TransactionHistory[];
  currentBalances: {
    usd: number;
    euro: number;
    cad: number;
  };
  cryptoBalances: {
    BTC: number;
    ETH: number;
    USDT: number;
  };
}

export default function BalanceGraphV2({
  transactionHistory,
  currentBalances,
  cryptoBalances
}: BalanceGraphProps) {
  const BTCPrice = 50000;
  const ETHPrice = 3000;

  const balanceStats = useMemo(() => {
    const currencies = [
      {
        name: 'USD',
        symbol: '$',
        balance: currentBalances.usd || 0,
        value: currentBalances.usd || 0,
        color: '#3b82f6',
        type: 'Fiat'
      },
      {
        name: 'EUR',
        symbol: '€',
        balance: currentBalances.euro || 0,
        value: currentBalances.euro || 0,
        color: '#8b5cf6',
        type: 'Fiat'
      },
      {
        name: 'CAD',
        symbol: '$',
        balance: currentBalances.cad || 0,
        value: currentBalances.cad || 0,
        color: '#06b6d4',
        type: 'Fiat'
      },
      {
        name: 'BTC',
        symbol: '₿',
        balance: cryptoBalances.BTC || 0,
        value: (cryptoBalances.BTC || 0) * BTCPrice,
        color: '#f59e0b',
        type: 'Crypto'
      },
      {
        name: 'ETH',
        symbol: 'Ξ',
        balance: cryptoBalances.ETH || 0,
        value: (cryptoBalances.ETH || 0) * ETHPrice,
        color: '#10b981',
        type: 'Crypto'
      },
      {
        name: 'USDT',
        symbol: '₮',
        balance: cryptoBalances.USDT || 0,
        value: cryptoBalances.USDT || 0,
        color: '#22c55e',
        type: 'Crypto'
      }
    ];

    const totalValue = currencies.reduce((sum, curr) => sum + curr.value, 0);

    const currenciesWithPercentage = currencies.map(curr => ({
      ...curr,
      percentage: totalValue > 0 ? (curr.value / totalValue) * 100 : 0
    }));

    const waveData = [];
    for (let i = 0; i < 12; i++) {
      const point: any = {
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]
      };

      currencies.forEach(curr => {
        const variance = Math.sin(i * 0.5) * 0.1 + 1;
        point[curr.name] = Math.round(curr.value * variance);
      });

      waveData.push(point);
    }

    return {
      currencies: currenciesWithPercentage,
      totalValue,
      waveData,
      colors: currencies.map(c => ({ name: c.name, color: c.color }))
    };
  }, [currentBalances, cryptoBalances]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 shadow-xl p-4">
          <p className="font-bold text-gray-900 mb-3">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-6 mb-1">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
              <span className="font-bold text-gray-900">${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-green-50">
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Wallet className="h-6 w-6 text-[#b91c1c]" />
          Balance Statistics
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Detailed breakdown of your holdings across all currencies</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-4 border-l-4 border-[#b91c1c] shadow">
            <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Portfolio Value
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${balanceStats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white p-4 border-l-4 border-green-500 shadow">
            <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Currencies
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {balanceStats.currencies.filter(c => c.value > 0).length} / 6
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {balanceStats.currencies.map((currency) => (
            <div
              key={currency.name}
              className="bg-white border-2 shadow-md hover:shadow-lg transition-shadow p-5"
              style={{ borderLeftColor: currency.color, borderLeftWidth: '6px' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: currency.color }}
                  >
                    {currency.symbol}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{currency.name}</h3>
                    <p className="text-xs text-gray-500">{currency.type}</p>
                  </div>
                </div>
                <div className={`text-sm font-semibold ${currency.value > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {currency.percentage.toFixed(1)}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {currency.name === 'BTC' || currency.name === 'ETH' || currency.name === 'USDT'
                      ? currency.balance.toFixed(8)
                      : currency.balance.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">USD Value:</span>
                  <span className="text-xl font-bold" style={{ color: currency.color }}>
                    ${currency.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${currency.percentage}%`,
                      backgroundColor: currency.color
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border shadow-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#b91c1c]" />
            Balance Trends (Wave View)
          </h3>
          <ResponsiveContainer width="100%" height={450}>
            <AreaChart data={balanceStats.waveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCAD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorETH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorUSDT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                dataKey="month"
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 600 }}
              />

              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
              />

              <Area
                type="monotone"
                dataKey="USD"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorUSD)"
                name="USD"
              />

              <Area
                type="monotone"
                dataKey="EUR"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#colorEUR)"
                name="EUR"
              />

              <Area
                type="monotone"
                dataKey="CAD"
                stroke="#06b6d4"
                strokeWidth={3}
                fill="url(#colorCAD)"
                name="CAD"
              />

              <Area
                type="monotone"
                dataKey="BTC"
                stroke="#f59e0b"
                strokeWidth={3}
                fill="url(#colorBTC)"
                name="BTC"
              />

              <Area
                type="monotone"
                dataKey="ETH"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorETH)"
                name="ETH"
              />

              <Area
                type="monotone"
                dataKey="USDT"
                stroke="#22c55e"
                strokeWidth={3}
                fill="url(#colorUSDT)"
                name="USDT"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
