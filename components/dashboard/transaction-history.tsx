"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Building,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  MapPin,
  Languages,
  Check,
  ChevronDown,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface Transaction {
  id: number;
  created_at: string;
  thType: string;
  thDetails: string;
  thPoi: string;
  thStatus: string;
  uuid: string;
  thEmail: string;
}

export default function ClientDepositsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { language, setLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(language);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
    { code: 'el', label: 'Ελληνικά' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Get the currently logged-in user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setMessage({
          type: "error",
          text: t.mustBeLoggedIn,
        });
        setLoading(false);
        return;
      }

      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
    };

    getUser();
  }, [t]);

  // ✅ Fetch transactions when we have the user's UUID
  useEffect(() => {
    if (userId) {
      fetchTransactions();

      // Real-time subscription for TransactionHistory
      const subscription = supabase
        .channel("client_transaction_history_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "TransactionHistory",
            filter: `uuid=eq.${userId}`,
          },
          (payload) => {
            console.log("Transaction update detected:", payload);
            fetchTransactions();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  // ✅ Fetch from TransactionHistory
  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("TransactionHistory")
        .select(
          `
          id,
          created_at,
          "thType",
          "thDetails",
          "thPoi",
          "thStatus",
          uuid,
          "thEmail"
        `
        )
        .eq("uuid", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setMessage({ type: "error", text: t.failedToLoadTransactions });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to translate transaction types
  const getTranslatedType = (type: string): string => {
    const typeLower = type.toLowerCase();
    if (typeLower === "external deposit") return t.externalDeposit;
    if (typeLower === "deposit") return t.deposit;
    if (typeLower === "withdrawal") return t.withdrawal;
    return type;
  };

  // ✅ Utility: Icons & colors
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
      case "completed":
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
      case "processing":
      case "under review":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "failed":
      case "rejected":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
      case "completed":
      case "approved":
        return "text-green-600 bg-green-50 border-green-200 hover:bg-green-100";
      case "pending":
      case "processing":
      case "under review":
        return "text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      case "failed":
      case "rejected":
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200 hover:bg-red-100";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "external deposit":
      case "deposit":
        return <Download className="w-4 h-4 text-blue-600" />;
      case "withdrawal":
        return <Building className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // ✅ Loading State
  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // ✅ Render
  return (
    <div className="flex-1 overflow-y-auto max-h-screen">
      <div className="p-4 pt-20 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">{t.transactionHistory}</h2>

          {/* Language Selector */}
          <div ref={dropdownRef} className="relative inline-block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#F26623] focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent cursor-pointer transition-all shadow-sm hover:shadow-md min-w-[160px]"
            >
              <Languages className="w-4 h-4 text-gray-600" />
              <span className="flex-1 text-left">
                {languages.find(lang => lang.code === language)?.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                      language === lang.code
                        ? 'bg-orange-50 text-[#F26623] font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <Check className="w-4 h-4 text-[#F26623]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {message && (
          <Alert
            className={
              message.type === "error"
                ? "border-red-500 bg-red-50"
                : "border-green-500 bg-green-50"
            }
          >
            <AlertDescription
              className={`text-sm ${
                message.type === "error" ? "text-red-700" : "text-green-700"
              }`}
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t.recentActivity}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="rounded-full bg-gray-100 p-6 mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t.noTransactionHistory}
                </h3>
                <p className="text-sm text-gray-600 text-center max-w-md">
                  {t.transactionRecordsWillAppear}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border rounded-lg p-4 space-y-4 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.thType)}
                          <h3 className="font-bold text-lg sm:text-xl">
                            {getTranslatedType(tx.thType)}
                          </h3>
                        </div>
                        <p className="text-gray-500 text-sm">
                          {t.processed}{" "}
                          {new Date(tx.created_at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <Badge
                        className={`text-xs sm:text-sm w-fit ${getStatusColor(
                          tx.thStatus
                        )}`}
                      >
                        {getStatusIcon(tx.thStatus)}
                        <span className="ml-2">{tx.thStatus}</span>
                      </Badge>
                    </div>

                    <div className="bg-[#F26623] border border-orange-200 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2 flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-2" />
                        {t.transactionDetails}
                      </h4>
                      <p className="text-white text-sm">{tx.thDetails}</p>

                      {tx.thPoi && (
                        <p className="text-white text-xs mt-2 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {tx.thPoi}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
