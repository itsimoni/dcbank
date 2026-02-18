"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Calculator,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  Receipt,
  ChevronRight,
  Pause,
  PlusCircle,
  Languages,
  ChevronDown,
} from "lucide-react";

interface TaxRecord {
  id: string;
  user_id: string;
  taxes: number;
  on_hold: number;
  paid: number;
  created_at: string;
  updated_at: string;
}

interface TaxStats {
  pending: { count: number; amount: number };
  on_hold: { count: number; amount: number };
  paid: { count: number; amount: number };
}

interface TaxCardProps {
  userProfile: {
    id: string;
    client_id: string;
    full_name: string | null;
    email: string | null;
  };
  setActiveTab: (tab: string) => void;
}

export default function TaxCard({ userProfile, setActiveTab }: TaxCardProps) {
  const [taxRecord, setTaxRecord] = useState<TaxRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [taxStats, setTaxStats] = useState<TaxStats>({
    pending: { count: 0, amount: 0 },
    on_hold: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
  });
  // Add language state
  const { language, setLanguage } = useLanguage();
  // Add language dropdown state
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Get translations
  const t = useMemo(() => getTranslations(language), [language]);

  // Language names for the dropdown
  const languageNames: Record<Language, string> = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
    el: "Ελληνικά",
  };

  useEffect(() => {
    fetchTaxes();
    setupTaxSubscription();
  }, [userProfile]);

  const fetchTaxes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Query the user's tax record
      const { data, error } = await supabase
        .from("taxes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no record exists, create one
        if (error.code === "PGRST116") {
          const { data: newRecord, error: insertError } = await supabase
            .from("taxes")
            .insert({
              user_id: user.id,
              taxes: 0,
              on_hold: 0,
              paid: 0,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating tax record:", insertError);
            return;
          }

          setTaxRecord(newRecord);
          setTaxStats({
            pending: { count: 0, amount: 0 },
            on_hold: { count: 0, amount: 0 },
            paid: { count: 0, amount: 0 },
          });
        } else {
          console.error("Error fetching taxes:", error);
          return;
        }
      } else {
        setTaxRecord(data);

        // Calculate statistics from the aggregate data
        setTaxStats({
          pending: {
            count: data.taxes > 0 ? 1 : 0,
            amount: Number(data.taxes),
          },
          on_hold: {
            count: data.on_hold > 0 ? 1 : 0,
            amount: Number(data.on_hold),
          },
          paid: {
            count: data.paid > 0 ? 1 : 0,
            amount: Number(data.paid),
          },
        });
      }
    } catch (error) {
      console.error("Error fetching taxes:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupTaxSubscription = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Set up real-time subscription for taxes table
    const subscription = supabase
      .channel(`taxes_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "taxes",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Tax change detected:", payload);
          fetchTaxes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTotalTaxes = () => {
    if (!taxRecord) return 0;
    return (
      Number(taxRecord.taxes) +
      Number(taxRecord.on_hold) +
      Number(taxRecord.paid)
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-0 shadow-lg">
      <CardHeader className="bg-[#b91c1c] text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>{t.taxManagement}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-white/20 text-white rounded-none">
              {new Date().getFullYear()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <Calculator className="h-4 w-4" />
              <span>{t.overview}</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>{t.history}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="bg-white p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xl font-bold text-black mt-1">
                    {t.taxManagement}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 border border-[#b91c1c]">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-yellow-700">
                      {t.pending}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-yellow-800">
                    {formatCurrency(taxStats.pending.amount)}
                  </p>
                </div>

                <div className="bg-white p-3 border border-[#b91c1c]">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      {t.onHold}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-blue-800">
                    {formatCurrency(taxStats.on_hold.amount)}
                  </p>
                </div>

                <div className="bg-white p-3 border border-[#b91c1c]">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-green-700">
                      {t.paid}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(taxStats.paid.amount)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-6">
            <div className="bg-white p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t.taxRecordHistory}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.lastUpdated}{" "}
                    {taxRecord ? formatDate(taxRecord.updated_at) : t.never}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
              </div>

              {taxRecord ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">
                      {t.recordCreated}
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(taxRecord.created_at)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">{t.noTaxRecords}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
