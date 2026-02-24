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
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { useLanguage } from "../../contexts/LanguageContext";
import { getTranslations } from "../../lib/translations";

interface Transaction {
  id: number;
  created_at: string | null;
  thType: string | null;
  thDetails: string | null;
  thPoi: string | null;
  thStatus: string | null;
  uuid: string | null;
  thEmail: string | null;
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
  metadata: Record<string, unknown>;
  balance_after: number | null;
  type: string | null;
  status: string | null;
}

type FilterStatus = "all" | "Successful" | "Pending" | "Processing" | "Failed" | "Cancelled";
type DateRange = "7" | "30" | "90" | "all";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
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
        .select("*")
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
          tx.reference?.toLowerCase().includes(query) ||
          tx.thDetails?.toLowerCase().includes(query) ||
          tx.counterparty_name?.toLowerCase().includes(query) ||
          tx.thType?.toLowerCase().includes(query) ||
          tx.thPoi?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((tx) => tx.thStatus === filterStatus);
    }

    if (dateRange !== "all") {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((tx) => new Date(tx.posted_at) >= cutoff);
    }

    return filtered;
  }, [transactions, searchQuery, filterStatus, dateRange]);

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

  const formatAmount = (amount: number, currency: string) => {
    const cryptoCurrencies = ["BTC", "ETH", "ADA", "DOT", "LINK", "XRP", "SOL", "AVAX", "MATIC", "ATOM", "USDT"];
    const trimmedCurrency = currency?.trim() || "EUR";
    if (cryptoCurrencies.includes(trimmedCurrency.toUpperCase())) {
      return `${amount.toFixed(8)} ${trimmedCurrency}`;
    }
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: trimmedCurrency,
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

  const getStatusBadge = (status: string | null) => {
    const statusLower = (status || "").toLowerCase();
    let icon = <AlertCircle className="w-3 h-3" />;
    let colorClass = "bg-gray-50 text-gray-700 border border-gray-200";

    if (statusLower === "successful" || statusLower === "completed" || statusLower === "approved") {
      icon = <CheckCircle className="w-3 h-3" />;
      colorClass = "bg-green-50 text-green-700 border border-green-200";
    } else if (statusLower === "pending") {
      icon = <Clock className="w-3 h-3" />;
      colorClass = "bg-yellow-50 text-yellow-700 border border-yellow-200";
    } else if (statusLower === "processing") {
      icon = <Clock className="w-3 h-3" />;
      colorClass = "bg-blue-50 text-blue-700 border border-blue-200";
    } else if (statusLower === "failed" || statusLower === "rejected" || statusLower === "cancelled") {
      icon = <XCircle className="w-3 h-3" />;
      colorClass = "bg-red-50 text-red-700 border border-red-200";
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
        {icon}
        {status || "Unknown"}
      </span>
    );
  };

  const getTransactionIcon = (tx: Transaction) => {
    const isDeposit = tx.amount > 0 || tx.thType?.toLowerCase().includes("deposit");
    if (isDeposit) {
      return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    }
    return <ArrowUpRight className="w-5 h-5 text-red-600" />;
  };

  const getTransactionTitle = (tx: Transaction) => {
    if (tx.counterparty_name) {
      return tx.counterparty_name;
    }
    return tx.thType || "Transaction";
  };

  const getTransactionSubtitle = (tx: Transaction) => {
    if (tx.thDetails) return tx.thDetails;
    if (tx.thPoi) return tx.thPoi;
    return tx.category || "";
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Reference",
      "Type",
      "Details",
      "Amount",
      "Currency",
      "Fee",
      "Status",
      "Counterparty",
      "Balance After",
    ];

    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.posted_at),
      tx.reference || "",
      tx.thType || "",
      tx.thDetails || "",
      tx.amount.toString(),
      tx.currency?.trim() || "",
      tx.fee_amount?.toString() || "0",
      tx.thStatus || "",
      tx.counterparty_name || "",
      tx.balance_after?.toString() || "",
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

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="p-4 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Transaction History
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
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

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="border-gray-300 focus:border-[#b91c1c] focus:ring-[#b91c1c]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Successful">Successful</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
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
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRightLeft className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Transaction History
              </h3>
              <p className="text-sm text-gray-600">
                Your transaction records will appear here once you make a transaction.
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
                    <div className="col-span-2">Date</div>
                    <div className="col-span-5">Details</div>
                    <div className="col-span-3 text-right">Amount</div>
                    <div className="col-span-2 text-right">Status</div>
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
                          {getTransactionIcon(tx)}
                          <span className="text-sm font-medium text-gray-900">
                            {getTransactionTitle(tx)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {getTransactionSubtitle(tx)}
                        </p>
                        {tx.reference && (
                          <p className="text-xs text-gray-500 font-mono">
                            {tx.reference}
                          </p>
                        )}
                      </div>

                      <div className="lg:col-span-3 flex items-center lg:justify-end">
                        <span className={`text-sm font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {tx.amount >= 0 ? "+" : ""}{formatAmount(tx.amount, tx.currency)}
                        </span>
                      </div>

                      <div className="lg:col-span-2 flex items-center lg:justify-end">
                        {getStatusBadge(tx.thStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none sm:rounded-none">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b-2 border-[#b91c1c]">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(selectedTransaction)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedTransaction.thType || "Transaction"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedTransaction.thDetails || getTransactionSubtitle(selectedTransaction)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(selectedTransaction.thStatus)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-center">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Amount</label>
                      <p className={`text-2xl font-bold mt-1 ${selectedTransaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {selectedTransaction.amount >= 0 ? "+" : ""}{formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>
                    {selectedTransaction.balance_after !== null && (
                      <p className="text-center text-sm text-gray-600 mt-3">
                        Balance After: {formatAmount(selectedTransaction.balance_after, selectedTransaction.currency)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTransaction.reference && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Reference
                        </label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">
                          {selectedTransaction.reference}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Posted At
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDateTime(selectedTransaction.posted_at)}
                      </p>
                    </div>

                    {selectedTransaction.value_date && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Value Date
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(selectedTransaction.value_date)}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.fee_amount > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Fee
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatAmount(selectedTransaction.fee_amount, selectedTransaction.currency)}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.thPoi && (
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Point of Interest
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedTransaction.thPoi}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.counterparty_name && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Counterparty
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedTransaction.counterparty_name}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.counterparty_account && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Account
                        </label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">
                          {selectedTransaction.counterparty_account}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.channel && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Channel
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedTransaction.channel}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.category && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Category
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedTransaction.category}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.end_to_end_id && (
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          End-to-End ID
                        </label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">
                          {selectedTransaction.end_to_end_id}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.external_id && (
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          External ID
                        </label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">
                          {selectedTransaction.external_id}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTransaction.status_reason && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Status Note
                      </h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedTransaction.status_reason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setSelectedTransaction(null)}
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
            <h2 className="text-lg font-semibold text-gray-900">Important Information About Your Transactions</h2>

            <div className="space-y-4 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-gray-900 mb-2">1. General Transaction Processing</h3>
                <p className="leading-relaxed">
                  All transactions displayed in this history are processed in accordance with applicable banking regulations, including the Payment Services Directive (PSD2) within the European Economic Area, and relevant local financial regulations. Transaction records are maintained for a minimum period of seven (7) years as required by anti-money laundering (AML) regulations and may be subject to regulatory review.
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

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">5. Transaction Disputes and Chargebacks</h3>
                <p className="leading-relaxed">
                  If you believe a transaction was made in error or without your authorization, you must notify us within sixty (60) days of the transaction date. Disputes must be submitted in writing through our secure messaging system or by contacting customer support. We will investigate all claims in accordance with Regulation E (Electronic Fund Transfers) and applicable consumer protection laws. Resolution timeframes vary based on transaction type and complexity, typically ranging from ten (10) to ninety (90) business days.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">6. Transaction Limits and Restrictions</h3>
                <p className="leading-relaxed">
                  Daily and monthly transaction limits apply to all accounts and may vary based on account type, verification level, and regulatory requirements. These limits are designed to protect against fraud and ensure compliance with anti-money laundering regulations. Requests to increase limits require additional verification and may be subject to enhanced due diligence procedures. We reserve the right to decline, delay, or reverse any transaction that we reasonably believe violates our terms of service or applicable laws.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">7. Fees and Charges</h3>
                <p className="leading-relaxed">
                  Transaction fees are disclosed at the time of transaction initiation and are deducted from the transferred amount or charged separately as indicated. Fee schedules are subject to change with thirty (30) days prior notice. Foreign exchange transactions may include a spread between the buy and sell rates in addition to any disclosed fees. Correspondent and intermediary banks may impose additional charges for international transfers that are beyond our control and will be deducted from the transferred amount.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">8. Regulatory Compliance</h3>
                <p className="leading-relaxed">
                  All transactions are subject to applicable laws and regulations, including but not limited to the Bank Secrecy Act (BSA), USA PATRIOT Act, EU Anti-Money Laundering Directives, and sanctions programs administered by OFAC, the European Union, and the United Nations. We are required to report certain transactions to regulatory authorities and may be prohibited from disclosing such reports to you. We may delay, block, or refuse to process any transaction that we reasonably believe may violate any law, regulation, or our internal compliance policies.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">9. Data Protection and Privacy</h3>
                <p className="leading-relaxed">
                  Transaction data is processed and stored in accordance with the General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other applicable data protection laws. Your transaction history may be shared with regulatory authorities, law enforcement agencies pursuant to valid legal process, and third-party service providers necessary to process your transactions. For complete details on how we collect, use, and protect your personal data, please refer to our Privacy Policy.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">10. Liability Limitations</h3>
                <p className="leading-relaxed">
                  We shall not be liable for any losses arising from: (a) your failure to maintain adequate account security; (b) errors in recipient information provided by you; (c) delays or failures caused by third-party payment networks, correspondent banks, or blockchain networks; (d) force majeure events including natural disasters, wars, government actions, or system failures beyond our reasonable control; (e) compliance with legal or regulatory requirements. Our maximum liability for any transaction error attributable to us shall not exceed the amount of the transaction plus any fees charged.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">11. Electronic Communications</h3>
                <p className="leading-relaxed">
                  By using our services, you consent to receive all transaction-related communications electronically, including transaction confirmations, statements, and regulatory disclosures. Electronic records shall have the same legal validity as paper documents. You are responsible for maintaining a valid email address and checking your account regularly for important communications. We recommend enabling transaction notifications to monitor account activity in real-time.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">12. Record Retention</h3>
                <p className="leading-relaxed">
                  We maintain transaction records for a minimum of seven (7) years from the date of the transaction, or longer if required by applicable law. You may request copies of historical transaction records through our customer support channels. Records older than the standard retention period may no longer be available. We recommend downloading and maintaining your own records of important transactions for personal reference.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">13. Governing Law and Jurisdiction</h3>
                <p className="leading-relaxed">
                  These terms and all transactions conducted through our platform are governed by the laws of the Republic of Estonia, without regard to conflict of law principles. Any disputes arising from or relating to your transactions shall be subject to the exclusive jurisdiction of the courts of Estonia, except where prohibited by applicable consumer protection laws that mandate dispute resolution in your country of residence.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-2">14. Amendments and Updates</h3>
                <p className="leading-relaxed">
                  We reserve the right to amend these terms and conditions at any time. Material changes will be communicated to you at least thirty (30) days before they take effect through email notification or prominent notice on our platform. Your continued use of our services after such changes constitutes acceptance of the amended terms. If you do not agree with any changes, you must discontinue use of our services before the effective date.
                </p>
              </section>
            </div>

            <p className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Last updated: February 2026. This information is provided for general guidance only and does not constitute legal or financial advice. Please consult the full Terms and Conditions governing your account for complete details. For questions regarding specific transactions or compliance matters, please contact our customer support team or your legal advisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
