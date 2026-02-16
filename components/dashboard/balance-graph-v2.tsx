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

    const totalFiatBase = baseUSD + baseEUR + baseCAD;
    const totalCryptoBase = baseBTC + baseETH + baseUSDT;

    const dataPoints = [];

    for (let i = 0; i < points; i++) {
      const date = new Date(Date.now() - (points - 1 - i) * 24 * 60 * 60 * 1000);
      const x = i / points;

      const wave1 = Math.sin(i * 0.8) * 0.12;
      const wave2 = Math.cos(i * 0.5) * 0.08;
      const wave3 = Math.sin(i * 0.3) * 0.15;

      const cryptoWave1 = Math.sin(i * 0.6) * 0.20;
      const cryptoWave2 = Math.cos(i * 0.4) * 0.15;
      const cryptoWave3 = Math.sin(i * 0.9) * 0.10;

      const growth = x * 0.15;

      const fiatMultiplier = 1 + growth + wave1 + wave2 + wave3;
      const cryptoMultiplier = 1 + growth + cryptoWave1 + cryptoWave2 + cryptoWave3;

      const totalFiat = totalFiatBase * fiatMultiplier;
      const totalCrypto = totalCryptoBase * cryptoMultiplier;
      const totalAssets = totalFiat + totalCrypto;

      dataPoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fiat: Math.round(totalFiat),
        crypto: Math.round(totalCrypto),
        total: Math.round(totalAssets),
      });
    }

    return dataPoints;
  }, [transactionHistory, currentBalances, cryptoBalances, timeRange]);

  const stats = useMemo(() => {
    if (graphData.length < 2) return { change: 0, direction: 'neutral', high: 0, low: 0 };

    const first = graphData[0].total;
    const last = graphData[graphData.length - 1].total;
    const change = ((last - first) / first) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

    const allValues = graphData.map(d => d.total);
    const high = Math.max(...allValues);
    const low = Math.min(...allValues);

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
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-orange-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Activity className="h-6 w-6 text-[#b91c1c]" />
              Portfolio Balance Tracker
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Real-time balance fluctuations and trends</p>
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

          <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Crypto</div>
            <div className="text-2xl font-bold text-orange-700">
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
                <linearGradient id="colorFiat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
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
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
              />

              <Area
                type="monotone"
                dataKey="fiat"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorFiat)"
                name="Fiat Balance"
              />

              <Area
                type="monotone"
                dataKey="crypto"
                stroke="#f97316"
                strokeWidth={3}
                fill="url(#colorCrypto)"
                name="Crypto Balance"
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={4}
                fill="url(#colorTotal)"
                name="Total Portfolio"
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
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }}
              />

              <Line
                type="monotone"
                dataKey="fiat"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Fiat Balance"
              />

              <Line
                type="monotone"
                dataKey="crypto"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
                name="Crypto Balance"
              />

              <Line
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={4}
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
                name="Total Portfolio"
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
