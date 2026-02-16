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
    const points = days;

    const baseUSD = currentBalances.usd || 10000;
    const baseEUR = currentBalances.euro || 8000;
    const baseCAD = currentBalances.cad || 6000;
    const baseBTC = (cryptoBalances.BTC || 0.1) * BTCPrice;
    const baseETH = (cryptoBalances.ETH || 1) * ETHPrice;
    const baseUSDT = cryptoBalances.USDT || 5000;

    const dataPoints = [];

    for (let i = 0; i < points; i++) {
      const date = new Date(Date.now() - (points - 1 - i) * 24 * 60 * 60 * 1000);
      const x = i / points;

      const steadyGrowth = x * 0.08;
      const randomVariation = Math.sin(i * 1.7) * 0.012;

      const usdWave =
        Math.sin(i * 0.38) * 0.022 +
        Math.cos(i * 0.16) * 0.015 +
        Math.sin(i * 0.52) * 0.018 +
        Math.cos(i * 0.24) * 0.012 +
        Math.sin(i * 0.67) * 0.014 +
        Math.cos(i * 0.33) * 0.010;

      const eurWave =
        Math.sin(i * 0.42) * 0.024 +
        Math.cos(i * 0.14) * 0.017 +
        Math.sin(i * 0.58) * 0.019 +
        Math.cos(i * 0.26) * 0.013 +
        Math.sin(i * 0.71) * 0.015 +
        Math.cos(i * 0.35) * 0.011;

      const cadWave =
        Math.sin(i * 0.36) * 0.026 +
        Math.cos(i * 0.18) * 0.019 +
        Math.sin(i * 0.48) * 0.021 +
        Math.cos(i * 0.22) * 0.014 +
        Math.sin(i * 0.63) * 0.016 +
        Math.cos(i * 0.31) * 0.012;

      const btcWave =
        Math.sin(i * 0.32) * 0.055 +
        Math.cos(i * 0.22) * 0.038 +
        Math.sin(i * 0.44) * 0.042 +
        Math.cos(i * 0.28) * 0.034 +
        Math.sin(i * 0.59) * 0.028 +
        Math.cos(i * 0.37) * 0.023;

      const ethWave =
        Math.sin(i * 0.40) * 0.048 +
        Math.cos(i * 0.19) * 0.035 +
        Math.sin(i * 0.54) * 0.039 +
        Math.cos(i * 0.25) * 0.031 +
        Math.sin(i * 0.69) * 0.025 +
        Math.cos(i * 0.34) * 0.021;

      const usdtWave =
        Math.sin(i * 0.45) * 0.012 +
        Math.cos(i * 0.25) * 0.008 +
        Math.sin(i * 0.61) * 0.009 +
        Math.cos(i * 0.29) * 0.007 +
        Math.sin(i * 0.74) * 0.006 +
        Math.cos(i * 0.38) * 0.005;

      const usdValue = baseUSD * (1 + steadyGrowth + usdWave + randomVariation * 0.4);
      const eurValue = baseEUR * (1 + steadyGrowth * 0.95 + eurWave + randomVariation * 0.45);
      const cadValue = baseCAD * (1 + steadyGrowth * 1.05 + cadWave + randomVariation * 0.5);

      const btcValue = baseBTC * (1 + steadyGrowth * 1.3 + btcWave + randomVariation * 1.2);
      const ethValue = baseETH * (1 + steadyGrowth * 1.25 + ethWave + randomVariation * 1.1);
      const usdtValue = baseUSDT * (1 + steadyGrowth * 0.02 + usdtWave + randomVariation * 0.1);

      dataPoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        USD: Math.round(usdValue),
        EUR: Math.round(eurValue),
        CAD: Math.round(cadValue),
        BTC: Math.round(btcValue),
        ETH: Math.round(ethValue),
        USDT: Math.round(usdtValue),
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
        <div className="bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4">
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
              <Activity className="h-6 w-6 text-[#b91c1c]" />
              Currency Portfolio Tracker
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Individual currency performance across fiat and crypto assets</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-white rounded-lg p-1 border">
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

            <div className="flex gap-1 bg-white rounded-lg p-1 border">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Fiat</div>
            <div className="text-2xl font-bold text-blue-700">
              ${(currentBalances.usd + currentBalances.euro + currentBalances.cad).toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-red-600 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Crypto</div>
            <div className="text-2xl font-bold text-red-700">
              ${((cryptoBalances.BTC * 50000) + (cryptoBalances.ETH * 3000) + cryptoBalances.USDT).toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow">
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

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center border">
            <div className="text-xs text-gray-600 mb-1">Peak Value</div>
            <div className="text-lg font-bold text-gray-900">${stats.high.toLocaleString()}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center border">
            <div className="text-xs text-gray-600 mb-1">Lowest Value</div>
            <div className="text-lg font-bold text-gray-900">${stats.low.toLocaleString()}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center border">
            <div className="text-xs text-gray-600 mb-1">Volatility</div>
            <div className="text-lg font-bold text-gray-900">
              ${((stats.high - stats.low) / 1000).toFixed(1)}k
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center border">
            <div className="text-xs text-gray-600 mb-1">Data Points</div>
            <div className="text-lg font-bold text-gray-900">{graphData.length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
