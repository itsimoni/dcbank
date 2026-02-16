"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '60d'>('30d');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  const graphData = useMemo(() => {
    const BTCPrice = 50000;
    const ETHPrice = 3000;

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 60;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const relevantTransactions = transactionHistory
      .filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate >= startDate && txDate <= endDate;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const balances = {
      USD: currentBalances.usd || 0,
      EUR: currentBalances.euro || 0,
      CAD: currentBalances.cad || 0,
      BTC: (cryptoBalances.BTC || 0) * BTCPrice,
      ETH: (cryptoBalances.ETH || 0) * ETHPrice,
      USDT: cryptoBalances.USDT || 0,
    };

    const dataPoints = [];
    const dailyBalances = new Map<string, typeof balances>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyBalances.set(dateStr, { ...balances });
    }

    relevantTransactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const dateStr = txDate.toISOString().split('T')[0];

      try {
        const details = JSON.parse(tx.thDetails);
        const amount = parseFloat(details.amount || 0);
        const currency = details.currency?.toUpperCase() || 'USD';

        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const currentDateStr = date.toISOString().split('T')[0];

          if (currentDateStr < dateStr) {
            const currentBalances = dailyBalances.get(currentDateStr);
            if (currentBalances && currentBalances[currency as keyof typeof balances] !== undefined) {
              currentBalances[currency as keyof typeof balances] -= amount;
            }
          }
        }
      } catch (e) {
      }
    });

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayBalances = dailyBalances.get(dateStr) || balances;

      dataPoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        USD: Math.max(0, Math.round(dayBalances.USD)),
        EUR: Math.max(0, Math.round(dayBalances.EUR)),
        CAD: Math.max(0, Math.round(dayBalances.CAD)),
        BTC: Math.max(0, Math.round(dayBalances.BTC)),
        ETH: Math.max(0, Math.round(dayBalances.ETH)),
        USDT: Math.max(0, Math.round(dayBalances.USDT)),
      });
    }

    return dataPoints;
  }, [transactionHistory, currentBalances, cryptoBalances, timeRange]);

  const stats = useMemo(() => {
    if (graphData.length < 2) return { change: 0, direction: 'neutral', high: 0, low: 0 };

    const firstTotal = graphData[0].USD + graphData[0].EUR + graphData[0].CAD + graphData[0].BTC + graphData[0].ETH + graphData[0].USDT;
    const lastTotal = graphData[graphData.length - 1].USD + graphData[graphData.length - 1].EUR + graphData[graphData.length - 1].CAD +
                      graphData[graphData.length - 1].BTC + graphData[graphData.length - 1].ETH + graphData[graphData.length - 1].USDT;
    const change = ((lastTotal - firstTotal) / firstTotal) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

    const allTotals = graphData.map(d => d.USD + d.EUR + d.CAD + d.BTC + d.ETH + d.USDT);
    const high = Math.max(...allTotals);
    const low = Math.min(...allTotals);

    return { change, direction, high, low };
  }, [graphData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 rounded-none shadow-xl p-4">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 mb-1">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
              <span className="font-bold text-gray-900">${entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-red-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              Statistics
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Individual currency performance across fiat and crypto assets</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-white rounded-none p-1 border">
              <Button
                variant={timeRange === '7d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('7d')}
                className={timeRange === '7d' ? 'bg-[#b91c1c] hover:bg-[#991b1b]' : ''}
              >
                7D
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('30d')}
                className={timeRange === '30d' ? 'bg-[#b91c1c] hover:bg-[#991b1b]' : ''}
              >
                30D
              </Button>
              <Button
                variant={timeRange === '60d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('60d')}
                className={timeRange === '60d' ? 'bg-[#b91c1c] hover:bg-[#991b1b]' : ''}
              >
                60D
              </Button>
            </div>

            <div className="flex gap-1 bg-white rounded-none p-1 border">
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('area')}
                className={chartType === 'area' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Area
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className={chartType === 'line' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Line
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
          <div className="bg-white rounded-none p-4 border-l-4 border-green-500 shadow">
            <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              Performance
              {stats.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className={`text-2xl font-bold ${stats.change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={450}>
          {chartType === 'area' ? (
            <AreaChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorCAD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorETH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorUSDT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />

              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }}
              />

              <Area
                type="monotone"
                dataKey="USD"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#colorUSD)"
                name="USD"
              />

              <Area
                type="monotone"
                dataKey="EUR"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#colorEUR)"
                name="EUR"
              />

              <Area
                type="monotone"
                dataKey="CAD"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#colorCAD)"
                name="CAD"
              />

              <Area
                type="monotone"
                dataKey="BTC"
                stroke="#b91c1c"
                strokeWidth={2.5}
                fill="url(#colorBTC)"
                name="BTC"
              />

              <Area
                type="monotone"
                dataKey="ETH"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#colorETH)"
                name="ETH"
              />

              <Area
                type="monotone"
                dataKey="USDT"
                stroke="#22c55e"
                strokeWidth={2.5}
                fill="url(#colorUSDT)"
                name="USDT"
              />
            </AreaChart>
          ) : (
            <LineChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />

              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }}
              />

              <Line
                type="monotone"
                dataKey="USD"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
                name="USD"
              />

              <Line
                type="monotone"
                dataKey="EUR"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ fill: '#8b5cf6', r: 3 }}
                activeDot={{ r: 5 }}
                name="EUR"
              />

              <Line
                type="monotone"
                dataKey="CAD"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ fill: '#06b6d4', r: 3 }}
                activeDot={{ r: 5 }}
                name="CAD"
              />

              <Line
                type="monotone"
                dataKey="BTC"
                stroke="#b91c1c"
                strokeWidth={2.5}
                dot={{ fill: '#b91c1c', r: 3 }}
                activeDot={{ r: 5 }}
                name="BTC"
              />

              <Line
                type="monotone"
                dataKey="ETH"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
                name="ETH"
              />

              <Line
                type="monotone"
                dataKey="USDT"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 3 }}
                activeDot={{ r: 5 }}
                name="USDT"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
