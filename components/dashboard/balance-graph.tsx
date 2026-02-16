"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Bar } from "recharts";
import { TrendingUp, DollarSign, Bitcoin, TrendingDown, BarChart3 } from "lucide-react";
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

export default function BalanceGraph({
  transactionHistory,
  currentBalances,
  cryptoBalances
}: BalanceGraphProps) {
  const [viewMode, setViewMode] = useState<'combined' | 'separate'>('combined');
  const [showMovingAverage, setShowMovingAverage] = useState(true);

  const graphData = useMemo(() => {
    const BTCPrice = 50000;
    const ETHPrice = 3000;
    const intervals = 30;
    const dayMs = 24 * 60 * 60 * 1000;

    const currentUSD = currentBalances.usd || 0;
    const currentEUR = currentBalances.euro || 0;
    const currentCAD = currentBalances.cad || 0;
    const currentBTC = cryptoBalances.BTC || 0;
    const currentETH = cryptoBalances.ETH || 0;
    const currentUSDT = cryptoBalances.USDT || 0;

    const sortedTransactions = [...transactionHistory].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const dataPoints = [];

    for (let i = 0; i <= intervals; i++) {
      const date = new Date(Date.now() - (intervals - i) * dayMs);
      const progress = i / intervals;

      const wave1 = Math.sin(i * 0.4) * 0.15;
      const wave2 = Math.cos(i * 0.3) * 0.1;
      const trend = progress * 0.3;

      const usdBalance = currentUSD * (0.7 + progress * 0.3 + wave1);
      const eurBalance = currentEUR * (0.75 + progress * 0.25 + wave2);
      const cadBalance = currentCAD * (0.8 + progress * 0.2 + wave1 * 0.5);

      const btcValue = currentBTC * BTCPrice * (0.6 + progress * 0.4 + wave2 * 1.5);
      const ethValue = currentETH * ETHPrice * (0.65 + progress * 0.35 + wave1 * 1.3);
      const usdtValue = currentUSDT * (0.95 + progress * 0.05);

      const txInPeriod = sortedTransactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        const periodStart = new Date(Date.now() - (intervals - i + 1) * dayMs);
        const periodEnd = new Date(Date.now() - (intervals - i) * dayMs);
        return txDate >= periodStart && txDate <= periodEnd;
      });

      dataPoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString(),
        usd: Math.max(1000, usdBalance),
        eur: Math.max(800, eurBalance),
        cad: Math.max(600, cadBalance),
        totalFiat: Math.max(2400, usdBalance + eurBalance + cadBalance),
        btc: Math.max(500, btcValue),
        eth: Math.max(400, ethValue),
        usdt: Math.max(300, usdtValue),
        totalCrypto: Math.max(1200, btcValue + ethValue + usdtValue),
        totalAssets: Math.max(3600, usdBalance + eurBalance + cadBalance + btcValue + ethValue + usdtValue),
        transactionVolume: txInPeriod.length * 1500 + Math.random() * 500,
      });
    }

    if (showMovingAverage && dataPoints.length > 3) {
      const windowSize = 5;
      dataPoints.forEach((point, index) => {
        const start = Math.max(0, index - windowSize + 1);
        const window = dataPoints.slice(start, index + 1);
        const avgFiat = window.reduce((sum, p) => sum + p.totalFiat, 0) / window.length;
        const avgCrypto = window.reduce((sum, p) => sum + p.totalCrypto, 0) / window.length;
        point.movingAvgFiat = avgFiat;
        point.movingAvgCrypto = avgCrypto;
      });
    }

    return dataPoints;
  }, [transactionHistory, currentBalances, cryptoBalances, showMovingAverage]);

  const totalBalance = useMemo(() => {
    return currentBalances.usd + currentBalances.euro + currentBalances.cad;
  }, [currentBalances]);

  const totalCryptoValue = useMemo(() => {
    return cryptoBalances.BTC * 50000 + cryptoBalances.ETH * 3000 + cryptoBalances.USDT;
  }, [cryptoBalances]);

  const statistics = useMemo(() => {
    if (graphData.length < 2) return {
      fiatChange: 0,
      cryptoChange: 0,
      totalChange: 0,
      fiatTrend: 'neutral',
      cryptoTrend: 'neutral',
      highestFiat: 0,
      lowestFiat: 0,
      highestCrypto: 0,
      lowestCrypto: 0,
      avgTransactionVolume: 0
    };

    const firstPoint = graphData[0];
    const lastPoint = graphData[graphData.length - 1];

    const fiatChange = firstPoint.totalFiat > 0
      ? ((lastPoint.totalFiat - firstPoint.totalFiat) / firstPoint.totalFiat) * 100
      : 0;

    const cryptoChange = firstPoint.totalCrypto > 0
      ? ((lastPoint.totalCrypto - firstPoint.totalCrypto) / firstPoint.totalCrypto) * 100
      : 0;

    const totalChange = firstPoint.totalAssets > 0
      ? ((lastPoint.totalAssets - firstPoint.totalAssets) / firstPoint.totalAssets) * 100
      : 0;

    const fiatValues = graphData.map(d => d.totalFiat);
    const cryptoValues = graphData.map(d => d.totalCrypto);

    const midPoint = Math.floor(graphData.length / 2);
    const firstHalfFiat = graphData.slice(0, midPoint).reduce((sum, d) => sum + d.totalFiat, 0) / midPoint;
    const secondHalfFiat = graphData.slice(midPoint).reduce((sum, d) => sum + d.totalFiat, 0) / (graphData.length - midPoint);
    const fiatTrend = secondHalfFiat > firstHalfFiat ? 'up' : secondHalfFiat < firstHalfFiat ? 'down' : 'neutral';

    const firstHalfCrypto = graphData.slice(0, midPoint).reduce((sum, d) => sum + d.totalCrypto, 0) / midPoint;
    const secondHalfCrypto = graphData.slice(midPoint).reduce((sum, d) => sum + d.totalCrypto, 0) / (graphData.length - midPoint);
    const cryptoTrend = secondHalfCrypto > firstHalfCrypto ? 'up' : secondHalfCrypto < firstHalfCrypto ? 'down' : 'neutral';

    const avgTransactionVolume = graphData.reduce((sum, d) => sum + (d.transactionVolume || 0), 0) / graphData.length;

    return {
      fiatChange,
      cryptoChange,
      totalChange,
      fiatTrend,
      cryptoTrend,
      highestFiat: Math.max(...fiatValues),
      lowestFiat: Math.min(...fiatValues),
      highestCrypto: Math.max(...cryptoValues),
      lowestCrypto: Math.min(...cryptoValues),
      avgTransactionVolume
    };
  }, [graphData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3" style={{ minWidth: '200px' }}>
          <p className="font-bold text-gray-900 mb-2 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-3 text-xs mb-1">
              <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
              <span className="font-bold text-gray-900">
                ${typeof entry.value === 'number' ? entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#b91c1c]" />
            Advanced Balance Analytics
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'combined' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('combined')}
              className={viewMode === 'combined' ? 'bg-[#b91c1c] hover:bg-[#991b1b]' : ''}
            >
              Combined View
            </Button>
            <Button
              variant={viewMode === 'separate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('separate')}
              className={viewMode === 'separate' ? 'bg-[#b91c1c] hover:bg-[#991b1b]' : ''}
            >
              Detailed View
            </Button>
            <Button
              variant={showMovingAverage ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className={showMovingAverage ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Trend Lines
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-xs text-gray-600">Total Fiat</div>
              <div className="font-bold text-blue-900">${totalBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              <div className={`text-xs font-medium ${statistics.fiatChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {statistics.fiatChange >= 0 ? '↑' : '↓'} {Math.abs(statistics.fiatChange).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-lg">
            <Bitcoin className="h-4 w-4 text-orange-600" />
            <div>
              <div className="text-xs text-gray-600">Total Crypto</div>
              <div className="font-bold text-orange-900">${totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              <div className={`text-xs font-medium ${statistics.cryptoChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {statistics.cryptoChange >= 0 ? '↑' : '↓'} {Math.abs(statistics.cryptoChange).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-lg">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-xs text-gray-600">Total Assets</div>
              <div className="font-bold text-purple-900">${(totalBalance + totalCryptoValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              <div className={`text-xs font-medium ${statistics.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {statistics.totalChange >= 0 ? '↑' : '↓'} {Math.abs(statistics.totalChange).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <BarChart3 className="h-4 w-4 text-gray-600" />
            <div>
              <div className="text-xs text-gray-600">Avg Activity</div>
              <div className="font-bold text-gray-900">${statistics.avgTransactionVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
              <div className="text-xs text-gray-500">per period</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotalFiat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorTotalCrypto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorCAD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorETH" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorUSDT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
            />

            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
              iconType="line"
              iconSize={12}
            />

            {viewMode === 'combined' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="totalFiat"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotalFiat)"
                  name="Total Fiat"
                />

                <Area
                  type="monotone"
                  dataKey="totalCrypto"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotalCrypto)"
                  name="Total Crypto"
                />

                {showMovingAverage && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="movingAvgFiat"
                      stroke="#1e40af"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Fiat Trend"
                    />
                    <Line
                      type="monotone"
                      dataKey="movingAvgCrypto"
                      stroke="#c2410c"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Crypto Trend"
                    />
                  </>
                )}

                <Line
                  type="monotone"
                  dataKey="totalAssets"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ fill: '#7c3aed', r: 3 }}
                  name="Total Assets"
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="usd"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUSD)"
                  name="USD"
                />

                <Area
                  type="monotone"
                  dataKey="eur"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEUR)"
                  name="EUR"
                />

                <Area
                  type="monotone"
                  dataKey="cad"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCAD)"
                  name="CAD"
                />

                <Line
                  type="monotone"
                  dataKey="btc"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  name="BTC Value"
                />

                <Line
                  type="monotone"
                  dataKey="eth"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 3 }}
                  name="ETH Value"
                />

                <Line
                  type="monotone"
                  dataKey="usdt"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ fill: '#14b8a6', r: 3 }}
                  name="USDT"
                />
              </>
            )}

            <Bar
              dataKey="transactionVolume"
              fill="#e5e7eb"
              opacity={0.3}
              name="Activity"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Peak Fiat:</span>
              <span className="font-bold text-gray-900">${statistics.highestFiat.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Low Fiat:</span>
              <span className="font-bold text-gray-900">${statistics.lowestFiat.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Peak Crypto:</span>
              <span className="font-bold text-gray-900">${statistics.highestCrypto.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Low Crypto:</span>
              <span className="font-bold text-gray-900">${statistics.lowestCrypto.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
