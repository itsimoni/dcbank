"use client";
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

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
  const graphData = useMemo(() => {
    const sortedTransactions = [...transactionHistory].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningBalance = currentBalances.usd + currentBalances.euro + currentBalances.cad;

    sortedTransactions.forEach((tx) => {
      const amount = parseFloat(tx.thPoi.replace(/[^0-9.-]/g, '')) || 0;
      if (tx.thType.toLowerCase().includes('deposit') ||
          tx.thType.toLowerCase().includes('received') ||
          tx.thType.toLowerCase().includes('incoming')) {
        runningBalance -= amount;
      } else if (tx.thType.toLowerCase().includes('transfer') ||
                 tx.thType.toLowerCase().includes('sent') ||
                 tx.thType.toLowerCase().includes('withdraw')) {
        runningBalance += amount;
      }
    });

    const startingBalance = runningBalance > 0 ? runningBalance : 0;

    const dataPoints = [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: startingBalance,
        crypto: (cryptoBalances.BTC * 50000 + cryptoBalances.ETH * 3000 + cryptoBalances.USDT) * 0.8,
      }
    ];

    let balance = startingBalance;
    let cryptoValue = cryptoBalances.BTC * 50000 + cryptoBalances.ETH * 3000 + cryptoBalances.USDT;

    sortedTransactions.forEach((tx, index) => {
      const amount = parseFloat(tx.thPoi.replace(/[^0-9.-]/g, '')) || 0;

      if (tx.thType.toLowerCase().includes('deposit') ||
          tx.thType.toLowerCase().includes('received') ||
          tx.thType.toLowerCase().includes('incoming')) {
        balance += amount;
      } else if (tx.thType.toLowerCase().includes('transfer') ||
                 tx.thType.toLowerCase().includes('sent') ||
                 tx.thType.toLowerCase().includes('withdraw')) {
        balance -= amount;
      }

      const cryptoVariation = (Math.sin(index) * 0.1 + 1) * cryptoValue;

      dataPoints.push({
        date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: Math.max(0, balance),
        crypto: Math.max(0, cryptoVariation),
      });
    });

    if (dataPoints.length === 1) {
      const intervals = 7;
      const dayMs = 24 * 60 * 60 * 1000;
      const baseBalance = currentBalances.usd + currentBalances.euro + currentBalances.cad;
      const baseCrypto = cryptoBalances.BTC * 50000 + cryptoBalances.ETH * 3000 + cryptoBalances.USDT;

      for (let i = intervals - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * dayMs);
        const variation = Math.sin(i * 0.5) * 0.15;

        dataPoints.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          balance: Math.max(0, baseBalance * (1 + variation)),
          crypto: Math.max(0, baseCrypto * (1 + variation * 1.5)),
        });
      }
    }

    return dataPoints;
  }, [transactionHistory, currentBalances, cryptoBalances]);

  const totalBalance = useMemo(() => {
    return currentBalances.usd + currentBalances.euro + currentBalances.cad;
  }, [currentBalances]);

  const totalCryptoValue = useMemo(() => {
    return cryptoBalances.BTC * 50000 + cryptoBalances.ETH * 3000 + cryptoBalances.USDT;
  }, [cryptoBalances]);

  const balanceChange = useMemo(() => {
    if (graphData.length < 2) return 0;
    const firstBalance = graphData[0].balance;
    const lastBalance = graphData[graphData.length - 1].balance;
    return firstBalance > 0 ? ((lastBalance - firstBalance) / firstBalance) * 100 : 0;
  }, [graphData]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#b91c1c]" />
            Account Balance Overview
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">Fiat: </span>
              <span className="font-bold">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-gray-600">Crypto: </span>
              <span className="font-bold">${totalCryptoValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardTitle>
        {balanceChange !== 0 && (
          <div className={`text-sm ${balanceChange > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
            {balanceChange > 0 ? '↑' : '↓'} {Math.abs(balanceChange).toFixed(2)}% from starting period
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
              labelStyle={{ color: '#111827', fontWeight: 'bold' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBalance)"
              name="Fiat Balance"
            />
            <Area
              type="monotone"
              dataKey="crypto"
              stroke="#f97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCrypto)"
              name="Crypto Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
