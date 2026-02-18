"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Search,
  X,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslations } from "../../lib/translations";

interface Transaction {
  id: number;
  posted_at: string;
  value_date: string | null;
  amount: number;
  currency: string;
  fee_amount: number;
  counterparty_name: string | null;
  counterparty_account: string | null;
  reference: string | null;
  end_to_end_id: string | null;
  external_id: string | null;
  channel: string | null;
  status_reason: string | null;
  category: string | null;
  balance_after: number | null;
  type: string | null;
  status: string | null;
  thDetails: string;
  thPoi: string | null;
}

type FilterType = "all" | "deposit" | "withdrawal" | "transfer" | "fee";
type FilterStatus = "all" | "completed" | "pending" | "processing" | "rejected" | "cancelled" | "failed";
type DateRange = "7" | "30" | "90" | "all";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30");

  const { language } = useLanguage();
  const t = getTranslations(language);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        setMessage({ type: "error", text: t.mustBeLoggedIn });
        setLoading(false);
        return;
      }

      setUserId(user.id);
    };

    getUser();
  }, [t]);

  useEffect(() => {
    if (userId) {
      fetchTransactions();

      const subscription = supabase
        .channel("transaction_history_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "TransactionHistory",
            filter: `uuid=eq.${userId}`,
          },
          () => {
            fetchTransactions();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("TransactionHistory")
        .select(
          `
          id,
          posted_at,
          value_date,
          amount,
          currency,
          fee_amount,
          counterparty_name,
          counterparty_account,
          reference,
          end_to_end_id,
          external_id,
          channel,
          status_reason,
          category,
          balance_after,
          type,
          status,
          "thDetails",
          "thPoi"
        `
        )
        .eq("uuid", userId)
        .order("posted_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setMessage({ type: "error", text: t.failedToLoadTransactions });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.counterparty_name?.toLowerCase().includes(query) ||
          tx.thDetails?.toLowerCase().includes(query) ||
          tx.reference?.toLowerCase().includes(query) ||
          tx.thPoi?.toLowerCase().includes(query)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type?.toLowerCase() === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((tx) => tx.status?.toLowerCase() === filterStatus);
    }

    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((tx) => new Date(tx.posted_at) >= cutoff);
    }

    return filtered;
  }, [transactions, searchQuery, filterType, filterStatus, dateRange]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.posted_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  const formatAmount = (amount: number, currency: string, type: string | null) => {
    const isNegative = type === "withdrawal" || type === "fee" || type === "chargeback";
    const sign = isNegative ? "−" : "+";
    const absAmount = Math.abs(amount);

    const formatted = new Intl.NumberFormat(language, {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);

    return `${sign} ${formatted}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatMonthYear = (key: string) => {
    const [year, month] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat(language, {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    const statusLower = status.toLowerCase();
    let icon = <AlertCircle className="w-3 h-3" />;
    let colorClass = "bg-gray-50 text-gray-700 border border-gray-200";

    if (statusLower === "completed" || statusLower === "successful") {
      icon = <CheckCircle className="w-3 h-3" />;
      colorClass = "bg-green-50 text-green-700 border border-green-200";
    } else if (statusLower === "pending") {
      icon = <Clock className="w-3 h-3" />;
      colorClass = "bg-yellow-50 text-yellow-700 border border-yellow-200";
    } else if (statusLower === "processing") {
      icon = <Clock className="w-3 h-3" />;
      colorClass = "bg-blue-50 text-blue-700 border border-blue-200";
    } else if (statusLower === "rejected" || statusLower === "failed" || statusLower === "cancelled") {
      icon = <XCircle className="w-3 h-3" />;
      colorClass = "bg-red-50 text-red-700 border border-red-200";
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${colorClass}`}>
        {icon}
        {status}
      </span>
    );
  };

  const getTransactionTitle = (tx: Transaction) => {
    return tx.counterparty_name || tx.thPoi || t.noCounterparty;
  };

  const getTransactionSubtitle = (tx: Transaction) => {
    if (tx.thDetails) return tx.thDetails;
    if (tx.category) return tx.category;
    if (tx.channel) return tx.channel;
    return tx.type || "";
  };

  const exportToCSV = () => {
    const headers = [
      t.date,
      t.description,
      t.counterpartyName,
      t.reference,
      t.amount,
      t.currency,
      t.status,
      t.transactionType,
    ];

    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.posted_at),
      tx.thDetails || "",
      tx.counterparty_name || "",
      tx.reference || "",
      tx.amount.toString(),
      tx.currency,
      tx.status || "",
      tx.type || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-4 pt-20 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="p-4 pt-20 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t.transactionHistory}
          </h1>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.exportCSV}
          </Button>
        </div>

        {message && (
          <Alert className={message.type === "error" ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}>
            <AlertDescription className={`text-sm ${message.type === "error" ? "text-red-700" : "text-green-700"}`}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white border-2 border-[#b91c1c] p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t.searchTransactions}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-gray-300 focus:border-[#b91c1c] focus:ring-[#b91c1c]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
              <SelectTrigger className="border-gray-300 focus:border-[#b91c1c] focus:ring-[#b91c1c]">
                <SelectValue placeholder={t.filterByType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                <SelectItem value="deposit">{t.deposit}</SelectItem>
                <SelectItem value="withdrawal">{t.withdrawal}</SelectItem>
                <SelectItem value="transfer">{t.transfer}</SelectItem>
                <SelectItem value="fee">{t.fee}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="border-gray-300 focus:border-[#b91c1c] focus:ring-[#b91c1c]">
                <SelectValue placeholder={t.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="processing">{t.processing}</SelectItem>
                <SelectItem value="rejected">{t.rejected}</SelectItem>
                <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                <SelectItem value="failed">{t.failed}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger className="border-gray-300 focus:border-[#b91c1c] focus:ring-[#b91c1c]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t.last7Days}</SelectItem>
                <SelectItem value="30">{t.last30Days}</SelectItem>
                <SelectItem value="90">{t.last90Days}</SelectItem>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.noTransactionHistory}
              </h3>
              <p className="text-sm text-gray-600">
                {t.transactionRecordsWillAppear}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([monthKey, txs]) => (
              <div key={monthKey} className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">
                  {formatMonthYear(monthKey)}
                </h2>

                <div className="bg-white border border-gray-200 divide-y divide-gray-200">
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="col-span-2">{t.date}</div>
                    <div className="col-span-5">{t.description}</div>
                    <div className="col-span-3 text-right">{t.amount}</div>
                    <div className="col-span-2 text-right">{t.status}</div>
                  </div>

                  {txs.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="lg:col-span-2 flex items-start lg:items-center">
                        <span className="text-sm text-gray-900 font-medium lg:font-normal">
                          {formatDate(tx.posted_at)}
                        </span>
                      </div>

                      <div className="lg:col-span-5 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {getTransactionTitle(tx)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {getTransactionSubtitle(tx)}
                        </p>
                        {tx.reference && (
                          <p className="text-xs text-gray-500">
                            {t.reference}: {tx.reference}
                          </p>
                        )}
                      </div>

                      <div className="lg:col-span-3 flex items-center lg:justify-end">
                        <span className={`text-sm lg:text-base font-semibold ${
                          tx.type === "withdrawal" || tx.type === "fee"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}>
                          {formatAmount(tx.amount, tx.currency, tx.type)}
                        </span>
                      </div>

                      <div className="lg:col-span-2 flex items-center lg:justify-end">
                        {getStatusBadge(tx.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.transactionDetails}</DialogTitle>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b-2 border-[#b91c1c]">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getTransactionTitle(selectedTransaction)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {getTransactionSubtitle(selectedTransaction)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        selectedTransaction.type === "withdrawal" || selectedTransaction.type === "fee"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}>
                        {formatAmount(selectedTransaction.amount, selectedTransaction.currency, selectedTransaction.type)}
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(selectedTransaction.status)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.postedDate}
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(selectedTransaction.posted_at)}
                      </p>
                    </div>

                    {selectedTransaction.value_date && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {t.valueDate}
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(selectedTransaction.value_date)}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t.transactionAmount}
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatAmount(selectedTransaction.amount, selectedTransaction.currency, selectedTransaction.type)}
                      </p>
                    </div>

                    {selectedTransaction.fee_amount > 0 && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t.feeAmount}
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {formatAmount(selectedTransaction.fee_amount, selectedTransaction.currency, "fee")}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t.netAmount}
                          </label>
                          <p className="text-sm text-gray-900 mt-1">
                            {formatAmount(
                              selectedTransaction.amount + selectedTransaction.fee_amount,
                              selectedTransaction.currency,
                              selectedTransaction.type
                            )}
                          </p>
                        </div>
                      </>
                    )}

                    {selectedTransaction.balance_after && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {t.balanceAfter}
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Intl.NumberFormat(language, {
                            style: "currency",
                            currency: selectedTransaction.currency || "EUR",
                          }).format(selectedTransaction.balance_after)}
                        </p>
                      </div>
                    )}
                  </div>

                  {(selectedTransaction.counterparty_name || selectedTransaction.counterparty_account) && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        {t.counterparty}
                      </h4>
                      <div className="space-y-2">
                        {selectedTransaction.counterparty_name && (
                          <div>
                            <label className="text-xs text-gray-500">{t.counterpartyName}</label>
                            <p className="text-sm text-gray-900">{selectedTransaction.counterparty_name}</p>
                          </div>
                        )}
                        {selectedTransaction.counterparty_account && (
                          <div>
                            <label className="text-xs text-gray-500">{t.counterpartyAccount}</label>
                            <p className="text-sm text-gray-900 font-mono">{selectedTransaction.counterparty_account}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(selectedTransaction.reference || selectedTransaction.end_to_end_id || selectedTransaction.external_id) && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        {t.references}
                      </h4>
                      <div className="space-y-2">
                        {selectedTransaction.reference && (
                          <div>
                            <label className="text-xs text-gray-500">{t.reference}</label>
                            <p className="text-sm text-gray-900 font-mono">{selectedTransaction.reference}</p>
                          </div>
                        )}
                        {selectedTransaction.end_to_end_id && (
                          <div>
                            <label className="text-xs text-gray-500">{t.endToEndId}</label>
                            <p className="text-sm text-gray-900 font-mono">{selectedTransaction.end_to_end_id}</p>
                          </div>
                        )}
                        {selectedTransaction.external_id && (
                          <div>
                            <label className="text-xs text-gray-500">{t.externalId}</label>
                            <p className="text-sm text-gray-900 font-mono">{selectedTransaction.external_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {t.additionalInformation}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTransaction.type && (
                        <div>
                          <label className="text-xs text-gray-500">{t.transactionType}</label>
                          <p className="text-sm text-gray-900 capitalize">{selectedTransaction.type}</p>
                        </div>
                      )}
                      {selectedTransaction.category && (
                        <div>
                          <label className="text-xs text-gray-500">{t.category}</label>
                          <p className="text-sm text-gray-900">{selectedTransaction.category}</p>
                        </div>
                      )}
                      {selectedTransaction.channel && (
                        <div>
                          <label className="text-xs text-gray-500">{t.channel}</label>
                          <p className="text-sm text-gray-900">{selectedTransaction.channel}</p>
                        </div>
                      )}
                      {selectedTransaction.status_reason && (
                        <div>
                          <label className="text-xs text-gray-500">{t.statusReason}</label>
                          <p className="text-sm text-gray-900">{selectedTransaction.status_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setSelectedTransaction(null)}
                    variant="outline"
                    className="border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
                  >
                    {t.closeDetails}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
