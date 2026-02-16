'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Wallet, RefreshCw, Calendar } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BalanceSnapshot {
  id: string;
  user_id: string;
  usd_balance: number;
  eur_balance: number;
  gbp_balance: number;
  jpy_balance: number;
  chf_balance: number;
  cad_balance: number;
  aud_balance: number;
  total_value: number;
  created_at: string;
  recorded_at: string;
}

interface BalanceGraphHistoryProps {
  userId?: string;
}

export default function BalanceGraphHistory({ userId }: BalanceGraphHistoryProps) {
  const [balanceHistory, setBalanceHistory] = useState<BalanceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30');
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      let query = supabase
        .from('balance_history')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setBalanceHistory(data || []);
    } catch (err: any) {
      console.error('Error fetching balance history:', err);
      setError(err.message || 'Failed to fetch balance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceHistory();
  }, [timeRange, userId]);

  const chartData = useMemo(() => {
    if (balanceHistory.length === 0) {
      return [];
    }

    return balanceHistory.map(snapshot => {
      const date = new Date(snapshot.created_at);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        USD: Number(snapshot.usd_balance) || 0,
        EUR: Number(snapshot.eur_balance) || 0,
        GBP: Number(snapshot.gbp_balance) || 0,
        JPY: Number(snapshot.jpy_balance) / 100 || 0,
        CHF: Number(snapshot.chf_balance) || 0,
        CAD: Number(snapshot.cad_balance) || 0,
        AUD: Number(snapshot.aud_balance) || 0,
        Total: Number(snapshot.total_value) || 0
      };
    });
  }, [balanceHistory]);

  const stats = useMemo(() => {
    if (balanceHistory.length === 0) {
      return { current: 0, first: 0, change: 0, changePercent: 0 };
    }

    const current = Number(balanceHistory[balanceHistory.length - 1]?.total_value) || 0;
    const first = Number(balanceHistory[0]?.total_value) || 0;
    const change = current - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;

    return { current, first, change, changePercent };
  }, [balanceHistory]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-gray-300 shadow-xl p-4">
          <p className="font-bold text-gray-900 mb-3">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-6 mb-1">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
              <span className="font-bold text-gray-900">
                ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Wallet className="h-6 w-6 text-[#b91c1c]" />
              Balance History
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Track your balance changes over time</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBalanceHistory}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {balanceHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 border-l-4 border-blue-500 shadow">
              <div className="text-sm text-gray-600 mb-1">Current Balance</div>
              <div className="text-2xl font-bold text-gray-900">
                ${stats.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`bg-white p-4 border-l-4 ${stats.change >= 0 ? 'border-green-500' : 'border-red-500'} shadow`}>
              <div className="text-sm text-gray-600 mb-1">Change</div>
              <div className={`text-2xl font-bold ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.change >= 0 ? '+' : ''}${stats.change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`bg-white p-4 border-l-4 ${stats.changePercent >= 0 ? 'border-green-500' : 'border-red-500'} shadow`}>
              <div className="text-sm text-gray-600 mb-1">Percentage</div>
              <div className={`text-2xl font-bold ${stats.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-semibold">Error loading balance history</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && balanceHistory.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
            <p className="font-semibold">No balance history found</p>
            <p className="text-sm mt-1">Balance snapshots will appear here as they are recorded.</p>
          </div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <div className="bg-white border shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#b91c1c]" />
              Balance Trends
            </h3>
            <ResponsiveContainer width="100%" height={450}>
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorEUR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorGBP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorJPY" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCHF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorCAD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAUD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                <XAxis
                  dataKey="date"
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
                  dataKey="GBP"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fill="url(#colorGBP)"
                  name="GBP"
                />

                <Area
                  type="monotone"
                  dataKey="JPY"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#colorJPY)"
                  name="JPY"
                />

                <Area
                  type="monotone"
                  dataKey="CHF"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fill="url(#colorCHF)"
                  name="CHF"
                />

                <Area
                  type="monotone"
                  dataKey="CAD"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorCAD)"
                  name="CAD"
                />

                <Area
                  type="monotone"
                  dataKey="AUD"
                  stroke="#22c55e"
                  strokeWidth={3}
                  fill="url(#colorAUD)"
                  name="AUD"
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="mt-6 text-sm text-gray-600">
              <p>Showing {balanceHistory.length} snapshots over the last {timeRange} days</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}