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
  ArrowRightLeft,
  Building2,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslations } from "../../lib/translations";

interface Transfer {
  id: string;
  user_id: string;
  client_id: string | null;
  reference_number: string | null;
  transfer_type: string;
  status: string;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  fee_amount: number | null;
  fee_currency: string | null;
  rate_source: string | null;
  rate_timestamp: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  account_number: string | null;
  routing_number: string | null;
  swift_code: string | null;
  iban: string | null;
  bank_address: string | null;
  recipient_address: string | null;
  purpose_of_transfer: string | null;
  beneficiary_country: string | null;
  beneficiary_bank_country: string | null;
  account_type: string | null;
  intermediary_bank_name: string | null;
  intermediary_swift: string | null;
  intermediary_iban: string | null;
  wallet_address: string | null;
  network: string | null;
  memo_tag: string | null;
  description: string | null;
  admin_notes: string | null;
  status_reason: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

type FilterType = "all" | "internal" | "bank_transfer" | "crypto_internal" | "crypto_external";
type FilterStatus = "all" | "completed" | "pending" | "processing" | "approved" | "rejected";
type DateRange = "7" | "30" | "90" | "all";

const transferTypeLabels: Record<string, string> = {
  internal: "Internal Exchange",
  bank_transfer: "Bank Transfer",
  crypto_internal: "Crypto Exchange",
  crypto_external: "Crypto Withdrawal",
};

export default function TransactionHistory() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

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
      fetchTransfers();

      const subscription = supabase
        .channel("user_transfers_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_transfers",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchTransfers();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_transfers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransfers(data || []);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      setMessage({ type: "error", text: t.failedToLoadTransactions });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransfers = useMemo(() => {
    let filtered = [...transfers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.reference_number?.toLowerCase().includes(query) ||
          tx.description?.toLowerCase().includes(query) ||
          tx.account_holder_name?.toLowerCase().includes(query) ||
          tx.bank_name?.toLowerCase().includes(query) ||
          tx.wallet_address?.toLowerCase().includes(query)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.transfer_type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((tx) => tx.status === filterStatus);
    }

    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((tx) => new Date(tx.created_at) >= cutoff);
    }

    return filtered;
  }, [transfers, searchQuery, filterType, filterStatus, dateRange]);

  const groupedTransfers = useMemo(() => {
    const groups: { [key: string]: Transfer[] } = {};

    filteredTransfers.forEach((tx) => {
      const date = new Date(tx.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    });

    return groups;
  }, [filteredTransfers]);

  const formatAmount = (amount: number, currency: string) => {
    const cryptoCurrencies = ["BTC", "ETH", "ADA", "DOT", "LINK", "XRP", "SOL", "AVAX", "MATIC", "ATOM", "USDT"];
    if (cryptoCurrencies.includes(currency?.toUpperCase())) {
      return `${amount.toFixed(8)} ${currency}`;
    }
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    let icon = <AlertCircle className="w-3 h-3" />;
    let colorClass = "bg-gray-50 text-gray-700 border border-gray-200";

    if (statusLower === "completed" || statusLower === "approved") {
      icon = <CheckCircle className="w-3 h-3" />;
      colorClass = "bg-green-50 text-green-700 border border-green-200";
    } else if (statusLower === "pending") {
      icon = <Clock className="w-3 h-3" />;
      colorClass = "bg-yellow-50 text-yellow-700 border border-yellow-200";
    } else if (statusLower === "processing") {
      icon = <Clock className="w-3 h-3" />;
      colorClass = "bg-blue-50 text-blue-700 border border-blue-200";
    } else if (statusLower === "rejected") {
      icon = <XCircle className="w-3 h-3" />;
      colorClass = "bg-red-50 text-red-700 border border-red-200";
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
        {icon}
        {status}
      </span>
    );
  };

  const getTransferIcon = (type: string) => {
    switch (type) {
      case "bank_transfer":
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case "crypto_external":
      case "crypto_internal":
        return <Wallet className="w-5 h-5 text-orange-600" />;
      default:
        return <ArrowRightLeft className="w-5 h-5 text-green-600" />;
    }
  };

  const getTransferTitle = (tx: Transfer) => {
    if (tx.transfer_type === "bank_transfer" && tx.account_holder_name) {
      return tx.account_holder_name;
    }
    if ((tx.transfer_type === "crypto_external" || tx.transfer_type === "crypto_internal") && tx.wallet_address) {
      return `${tx.wallet_address.slice(0, 8)}...${tx.wallet_address.slice(-6)}`;
    }
    return transferTypeLabels[tx.transfer_type] || tx.transfer_type;
  };

  const getTransferSubtitle = (tx: Transfer) => {
    if (tx.description) return tx.description;
    return `${tx.from_currency} to ${tx.to_currency}`;
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Reference",
      "Type",
      "From Currency",
      "From Amount",
      "To Currency",
      "To Amount",
      "Fee",
      "Exchange Rate",
      "Status",
      "Beneficiary",
    ];

    const rows = filteredTransfers.map((tx) => [
      formatDate(tx.created_at),
      tx.reference_number || "",
      transferTypeLabels[tx.transfer_type] || tx.transfer_type,
      tx.from_currency,
      tx.from_amount.toString(),
      tx.to_currency,
      tx.to_amount.toString(),
      tx.fee_amount?.toString() || "0",
      tx.exchange_rate.toString(),
      tx.status,
      tx.account_holder_name || tx.wallet_address || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transfers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Transfer History
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

        <div className="bg-white border-2 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search transfers..."
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
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal Exchange</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="crypto_internal">Crypto Exchange</SelectItem>
                <SelectItem value="crypto_external">Crypto Withdrawal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="border-gray-300 focus:border-[#b91c1c] focus:ring-[#b91c1c]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
              <SelectTrigger className="border-gray-300 focus:border-[#b91c1c] focus:ring-[#b91c1c]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#b91c1c] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transfers...</p>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRightLeft className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Transfer History
              </h3>
              <p className="text-sm text-gray-600">
                Your transfer records will appear here once you make a transfer.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransfers).map(([monthKey, txs]) => (
              <div key={monthKey} className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">
                  {formatMonthYear(monthKey)}
                </h2>

                <div className="bg-white border border-gray-200 divide-y divide-gray-200">
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-4">Details</div>
                    <div className="col-span-2 text-right">From</div>
                    <div className="col-span-2 text-right">To</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>

                  {txs.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransfer(tx)}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="lg:col-span-2 flex items-start lg:items-center">
                        <span className="text-sm text-gray-900 font-medium lg:font-normal">
                          {formatDate(tx.created_at)}
                        </span>
                      </div>

                      <div className="lg:col-span-4 space-y-1">
                        <div className="flex items-center gap-2">
                          {getTransferIcon(tx.transfer_type)}
                          <span className="text-sm font-medium text-gray-900">
                            {getTransferTitle(tx)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {getTransferSubtitle(tx)}
                        </p>
                        {tx.reference_number && (
                          <p className="text-xs text-gray-500 font-mono">
                            {tx.reference_number}
                          </p>
                        )}
                      </div>

                      <div className="lg:col-span-2 flex items-center lg:justify-end">
                        <span className="text-sm font-semibold text-red-600">
                          - {formatAmount(tx.from_amount, tx.from_currency)}
                        </span>
                      </div>

                      <div className="lg:col-span-2 flex items-center lg:justify-end">
                        <span className="text-sm font-semibold text-green-600">
                          + {formatAmount(tx.to_amount, tx.to_currency)}
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

        <Dialog open={!!selectedTransfer} onOpenChange={(open) => !open && setSelectedTransfer(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none sm:rounded-none">
            <DialogHeader>
              <DialogTitle>Transfer Details</DialogTitle>
            </DialogHeader>

            {selectedTransfer && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b-2 border-[#b91c1c]">
                    <div className="flex items-center gap-3">
                      {getTransferIcon(selectedTransfer.transfer_type)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transferTypeLabels[selectedTransfer.transfer_type] || selectedTransfer.transfer_type}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedTransfer.description || getTransferSubtitle(selectedTransfer)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(selectedTransfer.status)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
                        <p className="text-xl font-bold text-red-600 mt-1">
                          {formatAmount(selectedTransfer.from_amount, selectedTransfer.from_currency)}
                        </p>
                      </div>
                      <div className="text-center">
                        <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
                        <p className="text-xl font-bold text-green-600 mt-1">
                          {formatAmount(selectedTransfer.to_amount, selectedTransfer.to_currency)}
                        </p>
                      </div>
                    </div>
                    {selectedTransfer.exchange_rate !== 1 && (
                      <p className="text-center text-sm text-gray-600 mt-3">
                        Exchange Rate: 1 {selectedTransfer.from_currency} = {selectedTransfer.exchange_rate.toFixed(6)} {selectedTransfer.to_currency}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Reference Number
                      </label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {selectedTransfer.reference_number || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Created At
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDateTime(selectedTransfer.created_at)}
                      </p>
                    </div>

                    {selectedTransfer.fee_amount !== null && selectedTransfer.fee_amount > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Fee
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatAmount(selectedTransfer.fee_amount, selectedTransfer.fee_currency || selectedTransfer.from_currency)}
                        </p>
                      </div>
                    )}

                    {selectedTransfer.processed_at && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Processed At
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDateTime(selectedTransfer.processed_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTransfer.transfer_type === "bank_transfer" && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Bank Transfer Details
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedTransfer.bank_name && (
                          <div>
                            <label className="text-xs text-gray-500">Bank Name</label>
                            <p className="text-sm text-gray-900">{selectedTransfer.bank_name}</p>
                          </div>
                        )}
                        {selectedTransfer.account_holder_name && (
                          <div>
                            <label className="text-xs text-gray-500">Beneficiary Name</label>
                            <p className="text-sm text-gray-900">{selectedTransfer.account_holder_name}</p>
                          </div>
                        )}
                        {selectedTransfer.account_number && (
                          <div>
                            <label className="text-xs text-gray-500">Account Number</label>
                            <p className="text-sm text-gray-900 font-mono">****{selectedTransfer.account_number.slice(-4)}</p>
                          </div>
                        )}
                        {selectedTransfer.iban && (
                          <div>
                            <label className="text-xs text-gray-500">IBAN</label>
                            <p className="text-sm text-gray-900 font-mono">****{selectedTransfer.iban.slice(-4)}</p>
                          </div>
                        )}
                        {selectedTransfer.swift_code && (
                          <div>
                            <label className="text-xs text-gray-500">SWIFT/BIC</label>
                            <p className="text-sm text-gray-900 font-mono">{selectedTransfer.swift_code}</p>
                          </div>
                        )}
                        {selectedTransfer.beneficiary_country && (
                          <div>
                            <label className="text-xs text-gray-500">Beneficiary Country</label>
                            <p className="text-sm text-gray-900">{selectedTransfer.beneficiary_country}</p>
                          </div>
                        )}
                        {selectedTransfer.purpose_of_transfer && (
                          <div className="sm:col-span-2">
                            <label className="text-xs text-gray-500">Purpose</label>
                            <p className="text-sm text-gray-900">{selectedTransfer.purpose_of_transfer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(selectedTransfer.transfer_type === "crypto_external" || selectedTransfer.transfer_type === "crypto_internal") && selectedTransfer.wallet_address && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Cryptocurrency Details
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Wallet Address</label>
                          <p className="text-sm text-gray-900 font-mono break-all">{selectedTransfer.wallet_address}</p>
                        </div>
                        {selectedTransfer.network && (
                          <div>
                            <label className="text-xs text-gray-500">Network</label>
                            <p className="text-sm text-gray-900">{selectedTransfer.network}</p>
                          </div>
                        )}
                        {selectedTransfer.memo_tag && (
                          <div>
                            <label className="text-xs text-gray-500">Memo/Tag</label>
                            <p className="text-sm text-gray-900 font-mono">{selectedTransfer.memo_tag}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTransfer.status_reason && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Status Note
                      </h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedTransfer.status_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setSelectedTransfer(null)}
                    variant="outline"
                    className="border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="bg-gray-50 border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Important Information About Your Transfers</h2>

            <div className="space-y-4 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">1. General Transfer Processing</h3>
                <p className="leading-relaxed">
                  All transfers displayed in this history are processed in accordance with applicable banking regulations, including the Payment Services Directive (PSD2) within the European Economic Area, and relevant local financial regulations. Transfer records are maintained for a minimum period of seven (7) years as required by anti-money laundering (AML) regulations and may be subject to regulatory review.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">2. Internal Currency Exchange</h3>
                <p className="leading-relaxed">
                  Internal currency exchanges between your accounts are typically processed immediately and reflect in both accounts within seconds during standard operating hours. Exchange rates are determined at the time of transaction execution based on our prevailing mid-market rates plus applicable margin.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">3. Bank Wire Transfers</h3>
                <p className="leading-relaxed">
                  International wire transfers are processed through the SWIFT network and typically require two to five (2-5) business days, depending on the destination country, intermediary banks involved, and correspondent banking arrangements. All transfers are screened against sanctions lists and may be subject to additional compliance checks.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">4. Cryptocurrency Transfers</h3>
                <p className="leading-relaxed">
                  Digital asset transfers are processed on their respective blockchain networks and are subject to network confirmation times and fees. Cryptocurrency transactions are irreversible once confirmed on the blockchain. You are responsible for verifying recipient wallet addresses before initiating any transfer.
                </p>
              </section>
            </div>

            <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Last updated: February 2026. This information is provided for general guidance only. Please consult the full Terms and Conditions governing your account for complete details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
