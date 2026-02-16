"use client";
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

    const barChartData = currenciesWithPercentage
      .filter(c => c.value > 0)
      .map(curr => ({
        name: curr.name,
        value: curr.value,
        fill: curr.color
      }));

    const pieChartData = currenciesWithPercentage
      .filter(c => c.value > 0)
      .map(curr => ({
        name: curr.name,
        value: curr.value
      }));

    return {
      currencies: currenciesWithPercentage,
      totalValue,
      barChartData,
      pieChartData,
      colors: currenciesWithPercentage.filter(c => c.value > 0).map(c => c.color)
    };
  }, [currentBalances, cryptoBalances]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 shadow-xl p-4">
          <p className="font-bold text-gray-900 mb-2">{payload[0].name}</p>
          <p className="text-lg font-bold text-gray-900">${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 border">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#b91c1c]" />
              Balance Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceStats.barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: 600 }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 p-6 border">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Portfolio Composition
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={balanceStats.pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {balanceStats.pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={balanceStats.colors[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
