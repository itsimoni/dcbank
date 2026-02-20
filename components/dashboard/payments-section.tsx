"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import { Checkbox } from "../ui/checkbox";
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
  Car,
  Home,
  GraduationCap,
  HeartPulse,
  Receipt,
  Lightbulb,
  CreditCard,
  ArrowLeft,
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

type CryptoPaymentType = "bitcoin" | "ethereum" | "usdt_erc20" | "usdt_trc20";

const STATIC_WALLETS: Record<CryptoPaymentType, { name: string; address: string; network: string }> = {
  bitcoin: {
    name: "Bitcoin (BTC)",
    address: "bc1q0wzmnuw8tuds9gyf92dw0sevqa98rsdzg4x3en",
    network: "Bitcoin Network",
  },
  ethereum: {
    name: "Ethereum",
    address: "0xf9f1d73bcf0d449782c305d6d797cc712c7d7a17",
    network: "Ethereum Mainnet",
  },
  usdt_erc20: {
    name: "USDT ERC-20",
    address: "0xf9f1d73bcf0d449782c305d6d797cc712c7d7a17",
    network: "Ethereum (ERC-20)",
  },
  usdt_trc20: {
    name: "USDT TRC-20",
    address: "TBkD7uWiEimA9GhVh91oXqiNdPi25DVswn",
    network: "Tron (TRC-20)",
  },
};

const PAYMENT_CATEGORIES = [
  { id: "utilities", name: "Utilities & Bills", description: "Electricity, Water, Gas, Internet", icon: Lightbulb },
  { id: "taxes", name: "Taxes & Government", description: "Income Tax, Property Tax, Fees", icon: Building },
  { id: "car", name: "Car Payments", description: "Auto Loans, Insurance, Registration", icon: Car },
  { id: "mortgage", name: "Mortgage & Rent", description: "Home Loans, Rental Payments", icon: Home },
  { id: "education", name: "Education", description: "Tuition, Student Loans, Courses", icon: GraduationCap },
  { id: "healthcare", name: "Healthcare", description: "Medical Bills, Insurance Premiums", icon: HeartPulse },
  { id: "invoices", name: "Invoices", description: "Business Invoices, Subscriptions", icon: Receipt },
  { id: "credit_cards", name: "Credit Cards", description: "Credit Card Payments, Debt", icon: CreditCard },
];

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

  const [selectedPaymentCategory, setSelectedPaymentCategory] = useState<string | null>(null);
  const [selectedCryptoPayment, setSelectedCryptoPayment] = useState<CryptoPaymentType>("bitcoin");
  const [cryptoPaymentForm, setCryptoPaymentForm] = useState({
    name: "",
    email: "",
    amount: "",
    termsAccepted: false,
    blockchainAware: false,
  });

  const [selectedBankCategory, setSelectedBankCategory] = useState<string | null>(null);
  const [bankPaymentForm, setBankPaymentForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    amount: "",
    currency: "EUR",
    reference: "",
    description: "",
    beneficiaryName: "",
    beneficiaryIban: "",
    beneficiaryBic: "",
    beneficiaryBank: "",
    beneficiaryAddress: "",
    beneficiaryCountry: "",
    termsAccepted: false,
  });

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

        {paymentMethod === "crypto" && !selectedPaymentCategory && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Payment Category</h3>
              <p className="text-sm text-gray-600 mb-4">Choose a category to pay with cryptocurrency</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {PAYMENT_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedPaymentCategory(category.id)}
                  className="cursor-pointer bg-white border-2 border-gray-200 hover:border-gray-400 p-6"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <category.icon className="w-7 h-7 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentMethod === "crypto" && selectedPaymentCategory && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedPaymentCategory(null);
                setCryptoPaymentForm({ name: "", email: "", amount: "", termsAccepted: false, blockchainAware: false });
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to categories</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#f8f9fa] p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Please fill out the fields below</h3>
                <div className="space-y-5">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Your Name</Label>
                    <Input
                      value={cryptoPaymentForm.name}
                      onChange={(e) => setCryptoPaymentForm({ ...cryptoPaymentForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="mt-1.5 bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input
                      type="email"
                      value={cryptoPaymentForm.email}
                      onChange={(e) => setCryptoPaymentForm({ ...cryptoPaymentForm, email: e.target.value })}
                      placeholder="john@mail.com"
                      className="mt-1.5 bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cryptoPaymentForm.amount}
                      onChange={(e) => setCryptoPaymentForm({ ...cryptoPaymentForm, amount: e.target.value })}
                      placeholder="EUR"
                      className="mt-1.5 bg-white border-gray-300"
                    />
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="terms"
                        checked={cryptoPaymentForm.termsAccepted}
                        onCheckedChange={(checked) => setCryptoPaymentForm({ ...cryptoPaymentForm, termsAccepted: checked === true })}
                        className="mt-0.5"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                        I am 18 years of age or older and agree to the{" "}
                        <span className="text-[#b91c1c] underline">Terms and Conditions</span>.
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="blockchain"
                        checked={cryptoPaymentForm.blockchainAware}
                        onCheckedChange={(checked) => setCryptoPaymentForm({ ...cryptoPaymentForm, blockchainAware: checked === true })}
                        className="mt-0.5"
                      />
                      <label htmlFor="blockchain" className="text-sm text-gray-600 cursor-pointer">
                        I am aware that transactions on the blockchain can not be reversed, and I am responsible for using the correct information.
                      </label>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (!cryptoPaymentForm.name || !cryptoPaymentForm.email || !cryptoPaymentForm.amount) {
                        toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
                        return;
                      }
                      if (!cryptoPaymentForm.termsAccepted || !cryptoPaymentForm.blockchainAware) {
                        toast({ title: "Error", description: "Please accept both terms to continue", variant: "destructive" });
                        return;
                      }
                      toast({ title: "Payment Initiated", description: "Please send the cryptocurrency to the wallet address shown" });
                    }}
                    className="w-auto px-8 bg-[#b91c1c] hover:bg-[#991b1b] text-white"
                  >
                    Continue
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-8">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setSelectedCryptoPayment("bitcoin")}
                    className={`py-3 px-4 font-medium ${
                      selectedCryptoPayment === "bitcoin"
                        ? "bg-[#b91c1c] text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    Bitcoin
                  </button>
                  <button
                    onClick={() => setSelectedCryptoPayment("ethereum")}
                    className={`py-3 px-4 font-medium ${
                      selectedCryptoPayment === "ethereum"
                        ? "bg-[#b91c1c] text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    Ethereum
                  </button>
                  <button
                    onClick={() => setSelectedCryptoPayment("usdt_erc20")}
                    className={`py-3 px-4 font-medium ${
                      selectedCryptoPayment === "usdt_erc20"
                        ? "bg-[#b91c1c] text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    USDT ERC-20
                  </button>
                  <button
                    onClick={() => setSelectedCryptoPayment("usdt_trc20")}
                    className={`py-3 px-4 font-medium ${
                      selectedCryptoPayment === "usdt_trc20"
                        ? "bg-[#b91c1c] text-white"
                        : "bg-white border border-gray-300 text-gray-700"
                    }`}
                  >
                    USDT TRC-20
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 border border-gray-200 mb-4">
                    <QRCodeSVG
                      value={STATIC_WALLETS[selectedCryptoPayment].address}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{STATIC_WALLETS[selectedCryptoPayment].name}</p>
                  <div className="w-full bg-gray-50 border border-gray-200 p-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-gray-700 truncate flex-1">
                      {STATIC_WALLETS[selectedCryptoPayment].address}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(STATIC_WALLETS[selectedCryptoPayment].address);
                        toast({ title: "Copied", description: "Wallet address copied to clipboard" });
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <span className="bg-[#b91c1c] text-white text-sm font-medium px-4 py-1.5">Amount</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {cryptoPaymentForm.amount ? `${cryptoPaymentForm.amount} EUR` : "0 EUR"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {paymentMethod === "bank" && viewMode === "new" && !showReviewStep && !selectedBankCategory && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Payment Category</h3>
              <p className="text-sm text-gray-600 mb-4">Choose a category to make a bank transfer payment</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {PAYMENT_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedBankCategory(category.id)}
                  className="cursor-pointer bg-white border-2 border-gray-200 hover:border-gray-400 p-6"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <category.icon className="w-7 h-7 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentMethod === "bank" && viewMode === "new" && !showReviewStep && selectedBankCategory && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setSelectedBankCategory(null);
                setBankPaymentForm({
                  fullName: "",
                  email: "",
                  phone: "",
                  address: "",
                  city: "",
                  postalCode: "",
                  country: "",
                  amount: "",
                  currency: "EUR",
                  reference: "",
                  description: "",
                  beneficiaryName: "",
                  beneficiaryIban: "",
                  beneficiaryBic: "",
                  beneficiaryBank: "",
                  beneficiaryAddress: "",
                  beneficiaryCountry: "",
                  termsAccepted: false,
                });
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to categories</span>
            </button>

            <div className="bg-white border border-gray-200">
              <div className="bg-[#b91c1c] px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Bank Transfer Payment</h3>
                <p className="text-sm text-red-100 mt-1">
                  {PAYMENT_CATEGORIES.find(c => c.id === selectedBankCategory)?.name} - Secure SEPA/SWIFT Transfer
                </p>
              </div>

              <div className="p-6 space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#b91c1c] text-white flex items-center justify-center text-sm font-medium">1</div>
                    <h4 className="text-base font-semibold text-gray-900">Payer Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Full Name *</Label>
                      <Input
                        value={bankPaymentForm.fullName}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, fullName: e.target.value })}
                        placeholder="Enter your full legal name"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email Address *</Label>
                      <Input
                        type="email"
                        value={bankPaymentForm.email}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, email: e.target.value })}
                        placeholder="your.email@example.com"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <Input
                        type="tel"
                        value={bankPaymentForm.phone}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Country *</Label>
                      <Input
                        value={bankPaymentForm.country}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, country: e.target.value })}
                        placeholder="Country of residence"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Address</Label>
                      <Input
                        value={bankPaymentForm.address}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, address: e.target.value })}
                        placeholder="Street address"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        value={bankPaymentForm.city}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, city: e.target.value })}
                        placeholder="City"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Postal Code</Label>
                      <Input
                        value={bankPaymentForm.postalCode}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, postalCode: e.target.value })}
                        placeholder="Postal / ZIP code"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#b91c1c] text-white flex items-center justify-center text-sm font-medium">2</div>
                    <h4 className="text-base font-semibold text-gray-900">Beneficiary Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Beneficiary Name *</Label>
                      <Input
                        value={bankPaymentForm.beneficiaryName}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, beneficiaryName: e.target.value })}
                        placeholder="Full name of recipient"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">IBAN / Account Number *</Label>
                      <Input
                        value={bankPaymentForm.beneficiaryIban}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, beneficiaryIban: e.target.value })}
                        placeholder="e.g., DE89 3704 0044 0532 0130 00"
                        className="mt-1.5 border-gray-300 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">BIC / SWIFT Code</Label>
                      <Input
                        value={bankPaymentForm.beneficiaryBic}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, beneficiaryBic: e.target.value })}
                        placeholder="e.g., COBADEFFXXX"
                        className="mt-1.5 border-gray-300 font-mono text-sm uppercase"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Bank Name *</Label>
                      <Input
                        value={bankPaymentForm.beneficiaryBank}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, beneficiaryBank: e.target.value })}
                        placeholder="Name of beneficiary bank"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Bank Address</Label>
                      <Input
                        value={bankPaymentForm.beneficiaryAddress}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, beneficiaryAddress: e.target.value })}
                        placeholder="Bank branch address"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Bank Country *</Label>
                      <Input
                        value={bankPaymentForm.beneficiaryCountry}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, beneficiaryCountry: e.target.value })}
                        placeholder="Country of beneficiary bank"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#b91c1c] text-white flex items-center justify-center text-sm font-medium">3</div>
                    <h4 className="text-base font-semibold text-gray-900">Payment Details</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={bankPaymentForm.amount}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, amount: e.target.value })}
                        placeholder="0.00"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Currency *</Label>
                      <Select
                        value={bankPaymentForm.currency}
                        onValueChange={(value) => setBankPaymentForm({ ...bankPaymentForm, currency: value })}
                      >
                        <SelectTrigger className="mt-1.5 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Payment Reference</Label>
                      <Input
                        value={bankPaymentForm.reference}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, reference: e.target.value })}
                        placeholder="Invoice or reference number"
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-sm font-medium text-gray-700">Payment Description</Label>
                      <Textarea
                        value={bankPaymentForm.description}
                        onChange={(e) => setBankPaymentForm({ ...bankPaymentForm, description: e.target.value })}
                        placeholder="Purpose of payment (e.g., Invoice #12345, Monthly rent payment, etc.)"
                        rows={3}
                        className="mt-1.5 border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="bankTerms"
                        checked={bankPaymentForm.termsAccepted}
                        onCheckedChange={(checked) => setBankPaymentForm({ ...bankPaymentForm, termsAccepted: checked === true })}
                        className="mt-0.5"
                      />
                      <label htmlFor="bankTerms" className="text-sm text-gray-600 cursor-pointer">
                        I confirm that all the information provided is accurate and complete. I understand that incorrect details may result in payment delays or rejection. I agree to the{" "}
                        <Link href="/terms-and-conditions" target="_blank" className="text-[#b91c1c] underline hover:text-[#991b1b]">Terms and Conditions</Link> and{" "}
                        <Link href="/privacy-policy" target="_blank" className="text-[#b91c1c] underline hover:text-[#991b1b]">Privacy Policy</Link>.
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <p>Estimated processing time: 1-3 business days</p>
                      <p className="mt-1">Transfer fee: Determined by your bank</p>
                    </div>
                    <Button
                      onClick={() => {
                        if (!bankPaymentForm.fullName || !bankPaymentForm.email || !bankPaymentForm.beneficiaryName ||
                            !bankPaymentForm.beneficiaryIban || !bankPaymentForm.beneficiaryBank || !bankPaymentForm.amount ||
                            !bankPaymentForm.beneficiaryCountry || !bankPaymentForm.country) {
                          toast({ title: "Missing Information", description: "Please fill in all required fields marked with *", variant: "destructive" });
                          return;
                        }
                        setFormData({
                          ...formData,
                          payment_type: PAYMENT_CATEGORIES.find(c => c.id === selectedBankCategory)?.name || "",
                          beneficiary_name: bankPaymentForm.beneficiaryName,
                          beneficiary_account: bankPaymentForm.beneficiaryIban,
                          beneficiary_bank_name: bankPaymentForm.beneficiaryBank,
                          beneficiary_country: bankPaymentForm.beneficiaryCountry,
                          amount: bankPaymentForm.amount,
                          currency: bankPaymentForm.currency,
                          description: bankPaymentForm.description,
                        });
                        setShowReviewStep(true);
                      }}
                      disabled={!bankPaymentForm.termsAccepted}
                      className="px-8 bg-[#b91c1c] hover:bg-[#991b1b] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Review Payment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
