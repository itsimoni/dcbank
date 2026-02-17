"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";

interface BalanceHistoryEntry {
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
}

export default function BalanceGraphHistory() {
  const [historyData, setHistoryData] = useState<BalanceHistoryEntry[]>([]);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceHistory();
  }, [timeRange]);

  const fetchBalanceHistory = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      const { data, error } = await supabase
        .from("balance_history")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching balance history:", error);
        setHistoryData([]);
      } else {
        setHistoryData(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      setHistoryData([]);
    }
  };

  const formatChartData = () => {
    return historyData.map((entry) => ({
      date: new Date(entry.created_at).toLocaleDateString(),
      USD: entry.usd_balance,
      EUR: entry.eur_balance,
      GBP: entry.gbp_balance,
      JPY: entry.jpy_balance / 100,
      CHF: entry.chf_balance,
      CAD: entry.cad_balance,
      AUD: entry.aud_balance,
      Total: entry.total_value,
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance History Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = formatChartData();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Balance History Chart
          </CardTitle>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            <div className="text-center">
              <p>No balance history data available</p>
              <p className="text-sm mt-2">
                Balance snapshots will appear here as your account activity occurs
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Total"
                stroke="#000000"
                strokeWidth={3}
                name="Total"
              />
              <Line
                type="monotone"
                dataKey="USD"
                stroke="#22c55e"
                strokeWidth={2}
                name="USD"
              />
              <Line
                type="monotone"
                dataKey="EUR"
                stroke="#3b82f6"
                strokeWidth={2}
                name="EUR"
              />
              <Line
                type="monotone"
                dataKey="GBP"
                stroke="#f59e0b"
                strokeWidth={2}
                name="GBP"
              />
              <Line
                type="monotone"
                dataKey="CAD"
                stroke="#ef4444"
                strokeWidth={2}
                name="CAD"
              />
              <Line
                type="monotone"
                dataKey="CHF"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="CHF"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
