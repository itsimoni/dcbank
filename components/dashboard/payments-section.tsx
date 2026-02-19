"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Building,
  FileText,
  AlertTriangle,
  ArrowUpDown,
  Languages,
  Check,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  X,
  Bitcoin,
  Wallet,
  Building2,
  Send,
  ArrowDownLeft,
  History,
  ExternalLink,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../hooks/use-toast";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface PaymentsSectionProps {
  userProfile: UserProfile;
}

interface CryptoWallet {
  id: string;
  user_id: string;
  crypto_type: string;
  wallet_address: string;
  label: string;
  symbol: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CryptoBalances {
  id: string;
  user_id: string;
  btc_balance: number;
  eth_balance: number;
  usdt_balance: number;
  created_at: string;
  updated_at: string;
}

interface CryptoTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  crypto_type: string;
  amount: number;
  amount_usd: number | null;
  network: string;
  from_address: string | null;
  to_address: string | null;
  tx_hash: string | null;
  confirmations: number;
  required_confirmations: number;
  status: string;
  fee_crypto: number;
  fee_usd: number | null;
  reference: string | null;
  description: string | null;
  recipient_name: string | null;
  exchange_rate: number | null;
  priority: string;
  estimated_completion: string | null;
  completed_at: string | null;
  failed_reason: string | null;
  created_at: string;
  updated_at: string;
}

type PaymentMethod = "crypto" | "bank";
type CryptoTab = "wallet" | "send" | "receive" | "history";

interface Payment {
  id: string;
  user_id: string;
  payment_type: string;
  amount: number;
  currency: string;
  description: string | null;
  recipient: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  scheduled_for: string | null;
  executed_at: string | null;
  posted_at: string | null;
  reference: string | null;
  method: string | null;
  channel: string | null;
  beneficiary_name: string | null;
  beneficiary_account: string | null;
  beneficiary_bank_name: string | null;
  beneficiary_bank_bic: string | null;
  beneficiary_country: string | null;
  fee_amount: number;
  total_debit_amount: number | null;
  end_to_end_id: string | null;
  external_id: string | null;
  status_reason: string | null;
  metadata: any;
}

type ViewMode = "new" | "pending" | "history";

export default function PaymentsSection({ userProfile }: PaymentsSectionProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("new");
  const [showReviewStep, setShowReviewStep] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("crypto");
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [cryptoBalances, setCryptoBalances] = useState<CryptoBalances | null>(null);
  const [cryptoTab, setCryptoTab] = useState<CryptoTab>("wallet");
  const [cryptoTransactions, setCryptoTransactions] = useState<CryptoTransaction[]>([]);
  const [showCryptoReview, setShowCryptoReview] = useState(false);
  const [sendingCrypto, setSendingCrypto] = useState(false);

  const [cryptoSendForm, setCryptoSendForm] = useState({
    crypto_type: "BTC",
    amount: "",
    to_address: "",
    recipient_name: "",
    network: "Mainnet",
    description: "",
    priority: "medium",
  });

  const [formData, setFormData] = useState({
    payment_type: "",
    amount: "",
    currency: "EUR",
    description: "",
    beneficiary_name: "",
    beneficiary_account: "",
    beneficiary_bank_name: "",
    beneficiary_bank_bic: "",
    beneficiary_country: "",
    scheduled_for: new Date().toISOString().split('T')[0],
    method: "SEPA Transfer",
  });

  const { language, setLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    if (userProfile?.id) {
      fetchPayments();
      fetchCryptoWallets();
      fetchCryptoBalances();
      fetchCryptoTransactions();
    }
  }, [userProfile?.id]);

  const fetchCryptoTransactions = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("crypto_transactions")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setCryptoTransactions(data || []);
    } catch (error) {
      console.error("Error fetching crypto transactions:", error);
    }
  };

  const fetchCryptoBalances = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("newcrypto_balances")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      setCryptoBalances(data);
    } catch (error) {
      console.error("Error fetching crypto balances:", error);
    }
  };

  const fetchCryptoWallets = async () => {
    try {
      setLoadingWallets(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setLoadingWallets(false);
        return;
      }

      const { data, error } = await supabase
        .from("crypto_wallets")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .order("crypto_type", { ascending: true });

      if (error) throw error;
      setCryptoWallets(data || []);
      if (data && data.length > 0) {
        const displaySymbol = cryptoTypeMap[data[0].crypto_type] || data[0].symbol;
        setSelectedCrypto(displaySymbol);
      }
    } catch (error) {
      console.error("Error fetching crypto wallets:", error);
    } finally {
      setLoadingWallets(false);
    }
  };

  const fetchPayments = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPayment = () => {
    if (!formData.payment_type || !formData.amount || !formData.beneficiary_name) {
      toast({
        title: t.error,
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    setShowReviewStep(true);
  };

  const handleConfirmPayment = async () => {
    if (!userProfile?.id) return;

    try {
      const feeAmount = 0;
      const totalDebitAmount = Number.parseFloat(formData.amount) + feeAmount;
      const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const { error } = await supabase.from("payments").insert({
        user_id: userProfile.id,
        payment_type: formData.payment_type,
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description || null,
        beneficiary_name: formData.beneficiary_name,
        beneficiary_account: formData.beneficiary_account || null,
        beneficiary_bank_name: formData.beneficiary_bank_name || null,
        beneficiary_bank_bic: formData.beneficiary_bank_bic || null,
        beneficiary_country: formData.beneficiary_country || null,
        scheduled_for: formData.scheduled_for,
        method: formData.method,
        channel: "Web",
        reference: reference,
        status: "Pending",
        fee_amount: feeAmount,
        total_debit_amount: totalDebitAmount,
      });

      if (error) throw error;

      toast({
        title: t.paymentSubmittedSuccess,
        description: `${t.reference}: ${reference}`,
      });

      setFormData({
        payment_type: "",
        amount: "",
        currency: "EUR",
        description: "",
        beneficiary_name: "",
        beneficiary_account: "",
        beneficiary_bank_name: "",
        beneficiary_bank_bic: "",
        beneficiary_country: "",
        scheduled_for: new Date().toISOString().split('T')[0],
        method: "SEPA Transfer",
      });
      setShowReviewStep(false);
      setViewMode("pending");
      fetchPayments();
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: "Cancelled", status_reason: "Cancelled by user" })
        .eq("id", paymentId)
        .eq("user_id", userProfile.id);

      if (error) throw error;

      toast({
        title: t.paymentCancelled,
      });

      setShowDetailsDrawer(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyReference = (reference: string) => {
    navigator.clipboard.writeText(reference);
    toast({
      title: t.referenceCopied,
    });
  };

  const handleCopyWalletAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Wallet address copied",
      description: "The wallet address has been copied to your clipboard",
    });
  };

  const handleCryptoSendReview = () => {
    const amount = parseFloat(cryptoSendForm.amount);
    const balance = getBalanceForCrypto(cryptoSendForm.crypto_type);

    if (!cryptoSendForm.amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to send",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${cryptoSendForm.crypto_type} to complete this transaction`,
        variant: "destructive",
      });
      return;
    }

    if (!cryptoSendForm.to_address) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid recipient wallet address",
        variant: "destructive",
      });
      return;
    }

    setShowCryptoReview(true);
  };

  const handleConfirmCryptoSend = async () => {
    if (!userProfile?.id) return;

    setSendingCrypto(true);
    try {
      const amount = parseFloat(cryptoSendForm.amount);
      const feePercentage = cryptoSendForm.priority === "urgent" ? 0.002 : cryptoSendForm.priority === "high" ? 0.001 : 0.0005;
      const fee = amount * feePercentage;

      const { error } = await supabase.from("crypto_transactions").insert({
        user_id: userProfile.id,
        transaction_type: "payment",
        crypto_type: cryptoSendForm.crypto_type,
        amount: amount,
        network: cryptoSendForm.network,
        to_address: cryptoSendForm.to_address,
        recipient_name: cryptoSendForm.recipient_name || null,
        description: cryptoSendForm.description || null,
        priority: cryptoSendForm.priority,
        fee_crypto: fee,
        status: "pending",
        required_confirmations: cryptoSendForm.crypto_type === "BTC" ? 3 : 12,
      });

      if (error) throw error;

      toast({
        title: "Transaction Submitted",
        description: `Your ${cryptoSendForm.crypto_type} transaction has been submitted for processing`,
      });

      setCryptoSendForm({
        crypto_type: "BTC",
        amount: "",
        to_address: "",
        recipient_name: "",
        network: "Mainnet",
        description: "",
        priority: "medium",
      });
      setShowCryptoReview(false);
      setCryptoTab("history");
      fetchCryptoTransactions();
    } catch (error: any) {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingCrypto(false);
    }
  };

  const getCryptoNetworks = (cryptoType: string): string[] => {
    switch (cryptoType) {
      case "BTC":
        return ["Bitcoin Mainnet", "Lightning Network"];
      case "ETH":
        return ["Ethereum Mainnet", "Arbitrum", "Optimism", "Base"];
      case "USDT":
        return ["ERC20 (Ethereum)", "TRC20 (Tron)", "BEP20 (BSC)"];
      default:
        return ["Mainnet"];
    }
  };

  const getTransactionStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; icon: any }> = {
      pending: { color: "text-yellow-600", bgColor: "bg-yellow-50", icon: Clock },
      processing: { color: "text-blue-600", bgColor: "bg-blue-50", icon: Zap },
      confirming: { color: "text-blue-600", bgColor: "bg-blue-50", icon: Shield },
      confirmed: { color: "text-emerald-600", bgColor: "bg-emerald-50", icon: CheckCircle2 },
      completed: { color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle2 },
      failed: { color: "text-red-600", bgColor: "bg-red-50", icon: XCircle },
      cancelled: { color: "text-gray-600", bgColor: "bg-gray-50", icon: X },
    };
    return configs[status] || configs.pending;
  };

  const cryptoTypeMap: Record<string, string> = {
    bitcoin: "BTC",
    ethereum: "ETH",
    usdt_erc20: "USDT",
    usdt_trc20: "USDT",
  };

  const reverseCryptoTypeMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "usdt_erc20",
  };

  const cryptoConfig: Record<string, { name: string; color: string; bgColor: string; icon: string; network?: string }> = {
    BTC: { name: "Bitcoin", color: "#F7931A", bgColor: "bg-orange-50", icon: "BTC", network: "Bitcoin Mainnet" },
    ETH: { name: "Ethereum", color: "#627EEA", bgColor: "bg-blue-50", icon: "ETH", network: "Ethereum Mainnet" },
    USDT: { name: "Tether", color: "#26A17B", bgColor: "bg-emerald-50", icon: "USDT", network: "ERC20/TRC20" },
    bitcoin: { name: "Bitcoin", color: "#F7931A", bgColor: "bg-orange-50", icon: "BTC", network: "Bitcoin Mainnet" },
    ethereum: { name: "Ethereum", color: "#627EEA", bgColor: "bg-blue-50", icon: "ETH", network: "Ethereum Mainnet" },
    usdt_erc20: { name: "Tether (ERC20)", color: "#26A17B", bgColor: "bg-emerald-50", icon: "USDT", network: "ERC20 (Ethereum)" },
    usdt_trc20: { name: "Tether (TRC20)", color: "#26A17B", bgColor: "bg-teal-50", icon: "USDT", network: "TRC20 (Tron)" },
  };

  const getSelectedWallet = () => {
    const dbCryptoType = reverseCryptoTypeMap[selectedCrypto];
    if (selectedCrypto === "USDT") {
      return cryptoWallets.find(w => w.crypto_type === "usdt_erc20" || w.crypto_type === "usdt_trc20");
    }
    return cryptoWallets.find(w => w.crypto_type === dbCryptoType || cryptoTypeMap[w.crypto_type] === selectedCrypto);
  };

  const getWalletNetwork = (wallet: CryptoWallet): string => {
    return cryptoConfig[wallet.crypto_type]?.network || wallet.crypto_type;
  };

  const getBalanceForCrypto = (cryptoType: string): number => {
    if (!cryptoBalances) return 0;
    switch (cryptoType) {
      case "BTC":
        return Number(cryptoBalances.btc_balance) || 0;
      case "ETH":
        return Number(cryptoBalances.eth_balance) || 0;
      case "USDT":
        return Number(cryptoBalances.usdt_balance) || 0;
      default:
        return 0;
    }
  };

  const formatCryptoBalance = (balance: number, cryptoType: string): string => {
    if (cryptoType === "USDT") {
      return balance.toFixed(2);
    }
    return balance.toFixed(8);
  };

  const availableCryptos = ["BTC", "ETH", "USDT"];

  const paymentTypes = [
    {
      id: "gov",
      name: t.taxesGovernment,
      icon: Building,
      description: t.taxesGovernmentDesc,
    },
    {
      id: "bills",
      name: t.billsInvoices,
      icon: FileText,
      description: t.billsInvoicesDesc,
    },
    {
      id: "fines",
      name: t.finesPenalties,
      icon: AlertTriangle,
      description: t.finesPenaltiesDesc,
    },
    {
      id: "transfers",
      name: t.transfersFees,
      icon: ArrowUpDown,
      description: t.transfersFeesDesc,
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      Pending: { color: "text-yellow-600 bg-yellow-50", icon: Clock },
      Processing: { color: "text-blue-600 bg-blue-50", icon: AlertCircle },
      Completed: { color: "text-green-600 bg-green-50", icon: CheckCircle2 },
      Rejected: { color: "text-red-600 bg-red-50", icon: XCircle },
      Cancelled: { color: "text-gray-600 bg-gray-50", icon: X },
      Returned: { color: "text-orange-600 bg-orange-50", icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {t[status.toLowerCase() as keyof typeof t] || status}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString(language, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const pendingPayments = payments.filter(
    (p) => p.status === "Pending" || p.status === "Processing"
  );

  const scheduledPayments = pendingPayments.filter((p) => {
    if (!p.scheduled_for) return false;
    const scheduledDate = new Date(p.scheduled_for);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scheduledDate > today;
  });

  const pendingReviewPayments = pendingPayments.filter((p) => {
    if (!p.scheduled_for) return true;
    const scheduledDate = new Date(p.scheduled_for);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scheduledDate <= today;
  });

  const historyPayments = payments.filter(
    (p) => p.status === "Completed" || p.status === "Rejected" || p.status === "Cancelled" || p.status === "Returned"
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6 pt-4 pt-xs-16 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">{t.payments}</h2>

          <div className="flex items-center gap-3">
            <div ref={dropdownRef} className="relative inline-block">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-white border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent cursor-pointer transition-all shadow-sm hover:shadow-md min-w-[160px]"
              >
                <Languages className="w-4 h-4 text-gray-600" />
                <span className="flex-1 text-left">
                  {languages.find(lang => lang.code === language)?.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full bg-white border-2 border-gray-200 shadow-lg overflow-hidden z-10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                        language === lang.code
                          ? 'bg-red-50 text-[#b91c1c] font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-[#b91c1c]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setPaymentMethod("crypto")}
            className={`flex items-center gap-2 px-5 py-3 font-medium transition-all border-2 ${
              paymentMethod === "crypto"
                ? "bg-[#b91c1c] text-white border-[#b91c1c] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#b91c1c] hover:shadow-sm"
            }`}
          >
            <Bitcoin className="w-5 h-5" />
            Crypto Payment
          </button>
          <button
            onClick={() => setPaymentMethod("bank")}
            className={`flex items-center gap-2 px-5 py-3 font-medium transition-all border-2 ${
              paymentMethod === "bank"
                ? "bg-[#b91c1c] text-white border-[#b91c1c] shadow-md"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#b91c1c] hover:shadow-sm"
            }`}
          >
            <Building2 className="w-5 h-5" />
            Bank Transfer
          </button>
        </div>

        {paymentMethod === "bank" && (
          <div className="flex gap-2 bg-white p-1">
            <button
              onClick={() => setViewMode("new")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                viewMode === "new"
                  ? "bg-[#b91c1c] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t.newPayment}
            </button>
            <button
              onClick={() => setViewMode("pending")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                viewMode === "pending"
                  ? "bg-[#b91c1c] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t.pendingScheduled}
              {pendingPayments.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center">
                  {pendingPayments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                viewMode === "history"
                  ? "bg-[#b91c1c] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t.history}
            </button>
          </div>
        )}

        {paymentMethod === "crypto" && (
          <div className="space-y-6">
            <div className="flex gap-1 bg-white p-1 border border-gray-200">
              <button
                onClick={() => { setCryptoTab("wallet"); setShowCryptoReview(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  cryptoTab === "wallet"
                    ? "bg-[#b91c1c] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Wallet className="w-4 h-4" />
                Wallet
              </button>
              <button
                onClick={() => { setCryptoTab("send"); setShowCryptoReview(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  cryptoTab === "send"
                    ? "bg-[#b91c1c] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                onClick={() => { setCryptoTab("receive"); setShowCryptoReview(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  cryptoTab === "receive"
                    ? "bg-[#b91c1c] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Receive
              </button>
              <button
                onClick={() => { setCryptoTab("history"); setShowCryptoReview(false); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                  cryptoTab === "history"
                    ? "bg-[#b91c1c] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <History className="w-4 h-4" />
                History
                {cryptoTransactions.filter(t => t.status === "pending" || t.status === "processing").length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cryptoTransactions.filter(t => t.status === "pending" || t.status === "processing").length}
                  </span>
                )}
              </button>
            </div>

            {cryptoTab === "wallet" && (
              <Card className="bg-white border-t-4 border-t-[#b91c1c]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#b91c1c]" />
                    Portfolio Overview
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Your cryptocurrency holdings and balances
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingWallets ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#b91c1c] rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableCryptos.map((cryptoType) => {
                        const config = cryptoConfig[cryptoType];
                        const balance = getBalanceForCrypto(cryptoType);
                        const dbType = reverseCryptoTypeMap[cryptoType];
                        const wallet = cryptoType === "USDT"
                          ? cryptoWallets.find(w => w.crypto_type === "usdt_erc20" || w.crypto_type === "usdt_trc20")
                          : cryptoWallets.find(w => w.crypto_type === dbType || cryptoTypeMap[w.crypto_type] === cryptoType);
                        return (
                          <div
                            key={cryptoType}
                            className={`p-4 border-2 border-gray-100 hover:border-gray-200 transition-all ${config.bgColor}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: config.color }}
                                >
                                  {config.icon}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{config.name}</p>
                                  <p className="text-sm text-gray-500">{cryptoType}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold" style={{ color: config.color }}>
                                  {formatCryptoBalance(balance, cryptoType)} {cryptoType}
                                </p>
                                {wallet && (
                                  <p className="text-xs text-green-600 flex items-center justify-end gap-1 mt-1">
                                    <Shield className="w-3 h-3" />
                                    Wallet Active
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                onClick={() => { setSelectedCrypto(cryptoType); setCryptoSendForm({...cryptoSendForm, crypto_type: cryptoType}); setCryptoTab("send"); }}
                                className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b]"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Send
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setSelectedCrypto(cryptoType); setCryptoTab("receive"); }}
                                className="flex-1"
                              >
                                <ArrowDownLeft className="w-4 h-4 mr-1" />
                                Receive
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {cryptoTab === "send" && !showCryptoReview && (
              <Card className="bg-white border-t-4 border-t-[#b91c1c]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#b91c1c]" />
                    Send Cryptocurrency
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Transfer crypto to another wallet address
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Select Cryptocurrency *</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {availableCryptos.map((cryptoType) => {
                            const config = cryptoConfig[cryptoType];
                            const balance = getBalanceForCrypto(cryptoType);
                            return (
                              <button
                                key={cryptoType}
                                onClick={() => setCryptoSendForm({...cryptoSendForm, crypto_type: cryptoType, network: getCryptoNetworks(cryptoType)[0]})}
                                className={`p-3 border-2 transition-all ${
                                  cryptoSendForm.crypto_type === cryptoType
                                    ? "border-[#b91c1c] bg-red-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mx-auto mb-1"
                                  style={{ backgroundColor: config.color }}
                                >
                                  {config.icon}
                                </div>
                                <p className="text-xs font-medium text-center">{cryptoType}</p>
                                <p className="text-xs text-gray-500 text-center truncate">{formatCryptoBalance(balance, cryptoType)}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Network *</Label>
                        <Select
                          value={cryptoSendForm.network}
                          onValueChange={(value) => setCryptoSendForm({...cryptoSendForm, network: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCryptoNetworks(cryptoSendForm.crypto_type).map((network) => (
                              <SelectItem key={network} value={network}>{network}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Amount *</Label>
                        <div className="relative mt-1">
                          <Input
                            type="number"
                            step="0.00000001"
                            value={cryptoSendForm.amount}
                            onChange={(e) => setCryptoSendForm({...cryptoSendForm, amount: e.target.value})}
                            placeholder="0.00000000"
                            className="pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                            {cryptoSendForm.crypto_type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {formatCryptoBalance(getBalanceForCrypto(cryptoSendForm.crypto_type), cryptoSendForm.crypto_type)} {cryptoSendForm.crypto_type}
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-[#b91c1c] p-0 h-auto text-xs"
                          onClick={() => setCryptoSendForm({...cryptoSendForm, amount: getBalanceForCrypto(cryptoSendForm.crypto_type).toString()})}
                        >
                          Send Max
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Recipient Wallet Address *</Label>
                        <Input
                          value={cryptoSendForm.to_address}
                          onChange={(e) => setCryptoSendForm({...cryptoSendForm, to_address: e.target.value})}
                          placeholder="Enter wallet address"
                          className="mt-1 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Recipient Name (Optional)</Label>
                        <Input
                          value={cryptoSendForm.recipient_name}
                          onChange={(e) => setCryptoSendForm({...cryptoSendForm, recipient_name: e.target.value})}
                          placeholder="Enter recipient name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Transaction Priority</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {[
                            { value: "low", label: "Low", desc: "~30 min", fee: "0.05%" },
                            { value: "medium", label: "Medium", desc: "~10 min", fee: "0.1%" },
                            { value: "high", label: "High", desc: "~2 min", fee: "0.2%" },
                          ].map((priority) => (
                            <button
                              key={priority.value}
                              onClick={() => setCryptoSendForm({...cryptoSendForm, priority: priority.value})}
                              className={`p-3 border-2 text-left transition-all ${
                                cryptoSendForm.priority === priority.value
                                  ? "border-[#b91c1c] bg-red-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <p className="text-sm font-medium">{priority.label}</p>
                              <p className="text-xs text-gray-500">{priority.desc}</p>
                              <p className="text-xs text-gray-400">Fee: {priority.fee}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Note (Optional)</Label>
                        <Textarea
                          value={cryptoSendForm.description}
                          onChange={(e) => setCryptoSendForm({...cryptoSendForm, description: e.target.value})}
                          placeholder="Add a note for this transaction"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleCryptoSendReview}
                      className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b]"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Review Transaction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {cryptoTab === "send" && showCryptoReview && (
              <Card className="bg-white border-t-4 border-t-[#b91c1c]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#b91c1c]" />
                    Confirm Transaction
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Please review the details before confirming
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-50 p-6 space-y-4 border-l-4 border-l-[#b91c1c]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cryptocurrency</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: cryptoConfig[cryptoSendForm.crypto_type]?.color }}
                        >
                          {cryptoSendForm.crypto_type.slice(0, 1)}
                        </div>
                        <span className="font-medium">{cryptoConfig[cryptoSendForm.crypto_type]?.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount</span>
                      <span className="text-lg font-bold" style={{ color: cryptoConfig[cryptoSendForm.crypto_type]?.color }}>
                        {cryptoSendForm.amount} {cryptoSendForm.crypto_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Network</span>
                      <span className="font-medium">{cryptoSendForm.network}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-600">To Address</span>
                      <span className="font-mono text-sm text-right max-w-[250px] break-all">{cryptoSendForm.to_address}</span>
                    </div>
                    {cryptoSendForm.recipient_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Recipient</span>
                        <span className="font-medium">{cryptoSendForm.recipient_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Priority</span>
                      <span className="font-medium capitalize">{cryptoSendForm.priority}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="text-sm text-gray-600">Estimated Fee</span>
                      <span className="font-medium">
                        {(parseFloat(cryptoSendForm.amount || "0") * (cryptoSendForm.priority === "high" ? 0.002 : cryptoSendForm.priority === "medium" ? 0.001 : 0.0005)).toFixed(8)} {cryptoSendForm.crypto_type}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800">Please verify carefully</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Cryptocurrency transactions are irreversible. Make sure the recipient address and network are correct.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCryptoReview(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleConfirmCryptoSend}
                      disabled={sendingCrypto}
                      className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b]"
                    >
                      {sendingCrypto ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Confirm & Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {cryptoTab === "receive" && (
              <Card className="bg-white border-t-4 border-t-[#b91c1c]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownLeft className="w-5 h-5 text-[#b91c1c]" />
                    Receive Cryptocurrency
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Share your wallet address to receive crypto payments
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    {availableCryptos.map((cryptoType) => {
                      const config = cryptoConfig[cryptoType];
                      return (
                        <button
                          key={cryptoType}
                          onClick={() => setSelectedCrypto(cryptoType)}
                          className={`flex-1 p-3 border-2 transition-all ${
                            selectedCrypto === cryptoType
                              ? "border-[#b91c1c] bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs mx-auto mb-1"
                            style={{ backgroundColor: config.color }}
                          >
                            {config.icon}
                          </div>
                          <p className="text-sm font-medium text-center">{cryptoType}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="bg-gray-50 p-6 flex flex-col items-center justify-center">
                      {getSelectedWallet() ? (
                        <>
                          <div className="bg-white p-4 shadow-lg mb-4">
                            <QRCodeSVG
                              value={getSelectedWallet()!.wallet_address}
                              size={200}
                              level="H"
                              includeMargin={true}
                              fgColor={cryptoConfig[selectedCrypto]?.color || "#000000"}
                            />
                          </div>
                          <p className="text-sm text-gray-500 text-center">
                            Scan to receive {selectedCrypto}
                          </p>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No wallet address available</p>
                          <p className="text-sm text-gray-400 mt-2">Contact support to set up your {selectedCrypto} wallet</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: cryptoConfig[selectedCrypto]?.color || "#6B7280" }}
                        >
                          {selectedCrypto}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{cryptoConfig[selectedCrypto]?.name}</p>
                          <p className="text-sm text-gray-500">{selectedCrypto}</p>
                        </div>
                      </div>

                      {getSelectedWallet() && (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Network</Label>
                            <p className="font-medium text-gray-900 mt-1">{getWalletNetwork(getSelectedWallet()!)}</p>
                          </div>

                          <div>
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Deposit Address</Label>
                            <div className="mt-1 bg-gray-100 p-3 border border-gray-200">
                              <p className="font-mono text-sm text-gray-900 break-all">
                                {getSelectedWallet()!.wallet_address}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleCopyWalletAddress(getSelectedWallet()!.wallet_address)}
                              className="w-full mt-3 bg-[#b91c1c] hover:bg-[#991b1b]"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Address
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {getSelectedWallet() && (
                    <div className="bg-amber-50 border border-amber-200 p-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Important Notice</p>
                          <ul className="text-sm text-amber-700 mt-2 space-y-1">
                            <li>Only send {selectedCrypto} to this address on the {getWalletNetwork(getSelectedWallet()!)} network.</li>
                            <li>Sending any other cryptocurrency may result in permanent loss.</li>
                            <li>Minimum deposit and network fees may apply.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {cryptoTab === "history" && (
              <Card className="bg-white border-t-4 border-t-[#b91c1c]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-[#b91c1c]" />
                    Transaction History
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Your recent cryptocurrency transactions
                  </p>
                </CardHeader>
                <CardContent>
                  {cryptoTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions yet</p>
                      <p className="text-sm text-gray-400 mt-2">Your crypto transaction history will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cryptoTransactions.map((tx) => {
                        const config = cryptoConfig[tx.crypto_type] || { color: "#6B7280", name: tx.crypto_type, icon: tx.crypto_type };
                        const statusConfig = getTransactionStatusConfig(tx.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <div
                            key={tx.id}
                            className="p-4 border border-gray-200 hover:border-gray-300 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: config.color }}
                                >
                                  {config.icon}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900 capitalize">{tx.transaction_type}</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
                                      <StatusIcon className="w-3 h-3" />
                                      {tx.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">{tx.network}</p>
                                  {tx.to_address && (
                                    <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                                      To: {tx.to_address.slice(0, 10)}...{tx.to_address.slice(-8)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold" style={{ color: config.color }}>
                                  {tx.transaction_type === "deposit" ? "+" : "-"}{formatCryptoBalance(tx.amount, tx.crypto_type)} {tx.crypto_type}
                                </p>
                                <p className="text-xs text-gray-500">{formatDateTime(tx.created_at)}</p>
                                {tx.reference && (
                                  <p className="text-xs text-gray-400 font-mono">{tx.reference}</p>
                                )}
                              </div>
                            </div>
                            {tx.status === "confirming" && (
                              <div className="mt-3 bg-blue-50 p-2 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-blue-700">
                                  {tx.confirmations}/{tx.required_confirmations} confirmations
                                </span>
                              </div>
                            )}
                            {tx.tx_hash && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">TX:</span>
                                <span className="text-xs font-mono text-gray-600 truncate flex-1">{tx.tx_hash}</span>
                                <button
                                  onClick={() => handleCopyWalletAddress(tx.tx_hash!)}
                                  className="text-[#b91c1c] hover:text-[#991b1b]"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {paymentMethod === "bank" && viewMode === "new" && !showReviewStep && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paymentTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setFormData({ ...formData, payment_type: type.name })}
                  className={`cursor-pointer transition-all bg-white border-l-4 p-4 ${
                    formData.payment_type === type.name
                      ? "border-l-[#b91c1c] shadow-md border border-gray-200"
                      : "border-l-gray-300 border border-gray-200 hover:shadow-md hover:border-l-[#b91c1c]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <type.icon className={`w-6 h-6 mt-1 flex-shrink-0 ${
                      formData.payment_type === type.name ? "text-[#b91c1c]" : "text-gray-400"
                    }`} />
                    <div className="min-w-0">
                      <h3 className="font-medium">{type.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Card className="bg-white border-t-4 border-t-[#b91c1c]">
              <CardHeader>
                <CardTitle>{t.paymentDetails}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t.beneficiaryName} *</Label>
                    <Input
                      value={formData.beneficiary_name}
                      onChange={(e) =>
                        setFormData({ ...formData, beneficiary_name: e.target.value })
                      }
                      placeholder={t.enterRecipientName}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.beneficiaryAccount}</Label>
                    <Input
                      value={formData.beneficiary_account}
                      onChange={(e) =>
                        setFormData({ ...formData, beneficiary_account: e.target.value })
                      }
                      placeholder="IBAN or Account Number"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t.beneficiaryBank}</Label>
                    <Input
                      value={formData.beneficiary_bank_name}
                      onChange={(e) =>
                        setFormData({ ...formData, beneficiary_bank_name: e.target.value })
                      }
                      placeholder={t.enterBankName}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.beneficiaryCountry}</Label>
                    <Input
                      value={formData.beneficiary_country}
                      onChange={(e) =>
                        setFormData({ ...formData, beneficiary_country: e.target.value })
                      }
                      placeholder={t.enterCountry}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t.amount} *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.currency}</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t.executionDate}</Label>
                    <Input
                      type="date"
                      value={formData.scheduled_for}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduled_for: e.target.value })
                      }
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t.paymentMethod}</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) =>
                      setFormData({ ...formData, method: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEPA Transfer">{t.sepaTransfer}</SelectItem>
                      <SelectItem value="Internal Transfer">{t.internalTransfer}</SelectItem>
                      <SelectItem value="Bank Transfer">{t.bankTransfer}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t.description}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t.enterPaymentDescription}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleReviewPayment}
                    className="bg-[#b91c1c] hover:bg-[#991b1b]"
                  >
                    {t.reviewPayment}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {paymentMethod === "bank" && viewMode === "new" && showReviewStep && (
          <div className="space-y-6">
            <Card className="bg-white border-t-4 border-t-[#b91c1c]">
              <CardHeader>
                <CardTitle>{t.reviewPayment}</CardTitle>
                <p className="text-sm text-gray-600">
                  Please review the payment details before confirming
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 space-y-3 border-l-4 border-l-[#b91c1c]">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t.paymentType}</span>
                    <span className="text-sm font-medium">{formData.payment_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t.beneficiaryName}</span>
                    <span className="text-sm font-medium">{formData.beneficiary_name}</span>
                  </div>
                  {formData.beneficiary_account && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t.beneficiaryAccount}</span>
                      <span className="text-sm font-medium">{formData.beneficiary_account}</span>
                    </div>
                  )}
                  {formData.beneficiary_bank_name && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t.beneficiaryBank}</span>
                      <span className="text-sm font-medium">{formData.beneficiary_bank_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t.amount}</span>
                    <span className="text-sm font-medium">
                      {formatAmount(Number.parseFloat(formData.amount), formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t.feeAmount}</span>
                    <span className="text-sm font-medium">
                      {formatAmount(0, formData.currency)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-sm font-medium">{t.totalDebitAmount}</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatAmount(Number.parseFloat(formData.amount), formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t.paymentMethod}</span>
                    <span className="text-sm font-medium">{formData.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t.executionDate}</span>
                    <span className="text-sm font-medium">{formatDate(formData.scheduled_for)}</span>
                  </div>
                  {formData.description && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t.description}</span>
                      <span className="text-sm font-medium">{formData.description}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmPayment}
                    className="bg-[#b91c1c] hover:bg-[#991b1b]"
                  >
                    {t.confirmPayment}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewStep(false)}
                  >
                    {t.back}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {paymentMethod === "bank" && viewMode === "pending" && (
          <div className="space-y-6">
            {scheduledPayments.length > 0 && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    {t.scheduledPayments}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scheduledPayments.map((payment) => (
                      <div
                        key={payment.id}
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailsDrawer(true);
                        }}
                        className="flex justify-between items-center p-4 bg-white border-l-4 border-l-blue-500 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {payment.beneficiary_name || payment.recipient}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.reference || payment.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t.scheduledFor}: {formatDate(payment.scheduled_for)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatAmount(payment.amount, payment.currency)}
                          </p>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingReviewPayments.length > 0 && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    {t.pendingReview}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingReviewPayments.map((payment) => (
                      <div
                        key={payment.id}
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailsDrawer(true);
                        }}
                        className="flex justify-between items-center p-4 bg-white border-l-4 border-l-yellow-500 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {payment.beneficiary_name || payment.recipient}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.reference || payment.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t.scheduledFor}: {formatDate(payment.scheduled_for)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {formatAmount(payment.amount, payment.currency)}
                          </p>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {pendingPayments.length === 0 && (
              <Card className="bg-white">
                <CardContent className="p-12 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t.noPendingPayments}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {paymentMethod === "bank" && viewMode === "history" && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>{t.history}</CardTitle>
            </CardHeader>
            <CardContent>
              {historyPayments.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t.noPaymentsYet}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyPayments.map((payment) => (
                    <div
                      key={payment.id}
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowDetailsDrawer(true);
                      }}
                      className={`flex justify-between items-center p-4 bg-white border-l-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                        payment.status === "Completed"
                          ? "border-l-green-500"
                          : payment.status === "Rejected"
                          ? "border-l-red-500"
                          : "border-l-gray-400"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {payment.beneficiary_name || payment.recipient}
                        </p>
                        <p className="text-sm text-gray-600">
                          {payment.reference || payment.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.posted_at
                            ? formatDateTime(payment.posted_at)
                            : formatDateTime(payment.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={showDetailsDrawer} onOpenChange={setShowDetailsDrawer}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedPayment && (
            <>
              <SheetHeader>
                <SheetTitle>{t.paymentDetails}</SheetTitle>
                <SheetDescription>
                  {selectedPayment.status === "Pending" && t.thisPaymentIsPending}
                  {selectedPayment.status === "Processing" && t.thisPaymentIsPending}
                  {selectedPayment.status === "Completed" && t.paymentCompleted}
                  {selectedPayment.status === "Rejected" && t.paymentRejected}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t.paymentId}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono">{selectedPayment.id.slice(0, 8)}...</p>
                      <button
                        onClick={() => handleCopyReference(selectedPayment.id)}
                        className="text-[#b91c1c] hover:text-[#991b1b]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t.status}</p>
                    {getStatusBadge(selectedPayment.status)}
                  </div>

                  {selectedPayment.status_reason && (
                    <div className="bg-red-50 border-l-4 border-l-red-500 border border-red-200 p-3">
                      <p className="text-xs text-gray-500 mb-1">{t.statusReason}</p>
                      <p className="text-sm text-red-900">{selectedPayment.status_reason}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm text-gray-900">{t.beneficiaryDetails}</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">{t.beneficiaryName}</p>
                      <p className="text-sm">{selectedPayment.beneficiary_name || selectedPayment.recipient || "-"}</p>
                    </div>
                    {selectedPayment.beneficiary_account && (
                      <div>
                        <p className="text-xs text-gray-500">{t.beneficiaryAccount}</p>
                        <p className="text-sm font-mono">{selectedPayment.beneficiary_account}</p>
                      </div>
                    )}
                    {selectedPayment.beneficiary_bank_name && (
                      <div>
                        <p className="text-xs text-gray-500">{t.beneficiaryBank}</p>
                        <p className="text-sm">{selectedPayment.beneficiary_bank_name}</p>
                      </div>
                    )}
                    {selectedPayment.beneficiary_country && (
                      <div>
                        <p className="text-xs text-gray-500">{t.beneficiaryCountry}</p>
                        <p className="text-sm">{selectedPayment.beneficiary_country}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm text-gray-900">{t.paymentDetails}</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">{t.amount}</p>
                      <p className="text-lg font-medium">{formatAmount(selectedPayment.amount, selectedPayment.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t.feeAmount}</p>
                      <p className="text-sm">{formatAmount(selectedPayment.fee_amount, selectedPayment.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t.totalDebitAmount}</p>
                      <p className="text-sm font-medium">{formatAmount(selectedPayment.total_debit_amount || selectedPayment.amount, selectedPayment.currency)}</p>
                    </div>
                    {selectedPayment.reference && (
                      <div>
                        <p className="text-xs text-gray-500">{t.reference}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono">{selectedPayment.reference}</p>
                          <button
                            onClick={() => handleCopyReference(selectedPayment.reference!)}
                            className="text-[#b91c1c] hover:text-[#991b1b]"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedPayment.method && (
                      <div>
                        <p className="text-xs text-gray-500">{t.paymentMethod}</p>
                        <p className="text-sm">{selectedPayment.method}</p>
                      </div>
                    )}
                    {selectedPayment.description && (
                      <div>
                        <p className="text-xs text-gray-500">{t.description}</p>
                        <p className="text-sm">{selectedPayment.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">{t.instructionSubmitted}</p>
                    <p className="text-sm">{formatDateTime(selectedPayment.created_at)}</p>
                  </div>
                  {selectedPayment.scheduled_for && (
                    <div>
                      <p className="text-xs text-gray-500">{t.executionDate}</p>
                      <p className="text-sm">{formatDate(selectedPayment.scheduled_for)}</p>
                    </div>
                  )}
                  {selectedPayment.executed_at && (
                    <div>
                      <p className="text-xs text-gray-500">{t.executedOn}</p>
                      <p className="text-sm">{formatDateTime(selectedPayment.executed_at)}</p>
                    </div>
                  )}
                  {selectedPayment.posted_at && (
                    <div>
                      <p className="text-xs text-gray-500">{t.postedDate}</p>
                      <p className="text-sm">{formatDateTime(selectedPayment.posted_at)}</p>
                    </div>
                  )}
                </div>

                {selectedPayment.status === "Pending" && (
                  <div className="border-t pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelPayment(selectedPayment.id)}
                      className="w-full"
                    >
                      {t.cancelPayment}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
