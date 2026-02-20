"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Wallet,
  Network,
  Coins,
  Languages,
  ChevronDown,
  Bell,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Check,
  Save,
  AlertTriangle,
  Shield,
  Info,
  FileText,
  Calendar,
  RefreshCw,
  Plus,
  BookOpen,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

function formatCryptoAmount(value: number, decimals = 8) {
  if (!value || isNaN(value)) return "0";
  if (value < 1) return value.toFixed(4).replace(/\.?0+$/, "");
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface CryptoSectionProps {
  userProfile: UserProfile;
}

interface CryptoTransaction {
  id: string;
  user_id: string;
  crypto_type: string;
  transaction_type: string;
  amount: number;
  price_per_unit: number;
  total_value: number;
  wallet_address: string;
  network: string;
  transaction_hash: string;
  gas_fee: number;
  status: string;
  created_at: string;
}

interface CryptoBalances {
  btc_balance: number;
  eth_balance: number;
  usdt_balance: number;
}

interface SavedBeneficiary {
  id: string;
  label: string;
  address: string;
  crypto_type: string;
  network: string;
}

type TransferStep = "form" | "review" | "receipt";
type FeeSpeed = "standard" | "fast" | "priority";

export default function RealCryptoTransferSection({
  userProfile,
}: CryptoSectionProps) {
  const [cryptoTransactions, setCryptoTransactions] = useState<CryptoTransaction[]>([]);
  const [cryptoBalances, setCryptoBalances] = useState<CryptoBalances>({
    btc_balance: 0,
    eth_balance: 0,
    usdt_balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferStep, setTransferStep] = useState<TransferStep>("form");
  const [submitting, setSubmitting] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string>("");
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<SavedBeneficiary[]>([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCoin, setFilterCoin] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterNetwork, setFilterNetwork] = useState("all");
  const [copiedField, setCopiedField] = useState<string>("");

  const t = useMemo(() => getTranslations(language), [language]);

  const languageNames: Record<Language, string> = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
    el: "Ελληνικά",
  };

  const [formData, setFormData] = useState({
    recipient_address: "",
    crypto_type: "",
    network: "",
    amount: "",
    fee_speed: "standard" as FeeSpeed,
    gas_fee: "",
    label: "",
    save_beneficiary: false,
    beneficiary_name: "",
    confirm_irreversible: false,
  });

  const cryptocurrencies = [
    {
      value: "BTC",
      label: t.bitcoin,
      symbol: "₿",
      iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg",
      decimals: 8,
      networks: [
        {
          value: "bitcoin",
          label: "Bitcoin Network",
          fees: { standard: "0.0001", fast: "0.00015", priority: "0.0002" },
          estimatedTime: { standard: "30-60 min", fast: "15-30 min", priority: "10-15 min" },
        },
        {
          value: "lightning",
          label: "Lightning Network",
          fees: { standard: "0.000001", fast: "0.000002", priority: "0.000003" },
          estimatedTime: { standard: "< 1 min", fast: "< 1 min", priority: "< 1 min" },
        },
      ],
    },
    {
      value: "ETH",
      label: t.ethereum,
      symbol: "Ξ",
      iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg",
      decimals: 8,
      networks: [
        {
          value: "ethereum",
          label: "Ethereum Mainnet",
          fees: { standard: "0.002", fast: "0.003", priority: "0.005" },
          estimatedTime: { standard: "2-5 min", fast: "1-2 min", priority: "< 1 min" },
        },
        {
          value: "polygon",
          label: "Polygon (MATIC)",
          fees: { standard: "0.001", fast: "0.0015", priority: "0.002" },
          estimatedTime: { standard: "2-3 min", fast: "1-2 min", priority: "< 1 min" },
        },
        {
          value: "arbitrum",
          label: "Arbitrum One",
          fees: { standard: "0.0005", fast: "0.0008", priority: "0.001" },
          estimatedTime: { standard: "2-5 min", fast: "1-2 min", priority: "< 1 min" },
        },
        {
          value: "optimism",
          label: "Optimism",
          fees: { standard: "0.0005", fast: "0.0008", priority: "0.001" },
          estimatedTime: { standard: "2-5 min", fast: "1-2 min", priority: "< 1 min" },
        },
      ],
    },
    {
      value: "USDT",
      label: t.tetherUsd,
      symbol: "$",
      iconUrl: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdt.svg",
      decimals: 6,
      networks: [
        {
          value: "ethereum",
          label: "Ethereum (ERC-20)",
          fees: { standard: "0.002", fast: "0.003", priority: "0.005" },
          estimatedTime: { standard: "2-5 min", fast: "1-2 min", priority: "< 1 min" },
        },
        {
          value: "tron",
          label: "Tron (TRC-20)",
          fees: { standard: "1.0", fast: "1.5", priority: "2.0" },
          estimatedTime: { standard: "1-3 min", fast: "< 1 min", priority: "< 1 min" },
        },
        {
          value: "bsc",
          label: "BSC (BEP-20)",
          fees: { standard: "0.0005", fast: "0.001", priority: "0.002" },
          estimatedTime: { standard: "1-3 min", fast: "< 1 min", priority: "< 1 min" },
        },
        {
          value: "polygon",
          label: "Polygon (MATIC)",
          fees: { standard: "0.001", fast: "0.0015", priority: "0.002" },
          estimatedTime: { standard: "2-3 min", fast: "1-2 min", priority: "< 1 min" },
        },
      ],
    },
  ];

  useEffect(() => {
    if (userProfile?.id) {
      fetchCryptoTransactions();
      fetchCryptoBalances();
      setupRealtimeSubscription();
      loadSavedBeneficiaries();
    }
  }, [userProfile?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationCenter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCryptoBalances = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("newcrypto_balances")
        .select("btc_balance, eth_balance, usdt_balance")
        .eq("user_id", userProfile.id)
        .maybeSingle();

      if (error && error.code === "PGRST116") {
        await supabase.from("newcrypto_balances").insert({
          user_id: userProfile.id,
          btc_balance: 0,
          eth_balance: 0,
          usdt_balance: 0,
        });
        setCryptoBalances({ btc_balance: 0, eth_balance: 0, usdt_balance: 0 });
        return;
      }

      if (error) return;

      setCryptoBalances({
        btc_balance: Number(data?.btc_balance) || 0,
        eth_balance: Number(data?.eth_balance) || 0,
        usdt_balance: Number(data?.usdt_balance) || 0,
      });
    } catch (error) {
      console.error("Error fetching crypto balances:", error);
    }
  };

  const fetchCryptoTransactions = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("crypto_transactions")
        .select("*")
        .eq("user_id", userProfile.id)
        .eq("transaction_type", "Transfer")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCryptoTransactions(data || []);
    } catch (error) {
      console.error("Error fetching crypto transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userProfile?.id) return;

    const transactionSubscription = supabase
      .channel("crypto_transaction_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crypto_transactions",
          filter: `user_id=eq.${userProfile.id}`,
        },
        () => {
          fetchCryptoTransactions();
        }
      )
      .subscribe();

    const balanceSubscription = supabase
      .channel("crypto_balance_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "newcrypto_balances",
          filter: `user_id=eq.${userProfile.id}`,
        },
        () => {
          fetchCryptoBalances();
        }
      )
      .subscribe();

    return () => {
      transactionSubscription.unsubscribe();
      balanceSubscription.unsubscribe();
    };
  };

  const loadSavedBeneficiaries = () => {
    const saved = localStorage.getItem(`beneficiaries_${userProfile.id}`);
    if (saved) {
      setSavedBeneficiaries(JSON.parse(saved));
    }
  };

  const saveBeneficiary = () => {
    if (!formData.beneficiary_name || !formData.recipient_address) return;

    const newBeneficiary: SavedBeneficiary = {
      id: Date.now().toString(),
      label: formData.beneficiary_name,
      address: formData.recipient_address,
      crypto_type: formData.crypto_type,
      network: formData.network,
    };

    const updated = [...savedBeneficiaries, newBeneficiary];
    setSavedBeneficiaries(updated);
    localStorage.setItem(`beneficiaries_${userProfile.id}`, JSON.stringify(updated));
  };

  const loadBeneficiary = (beneficiary: SavedBeneficiary) => {
    setFormData({
      ...formData,
      recipient_address: beneficiary.address,
      crypto_type: beneficiary.crypto_type,
      network: beneficiary.network,
    });
    setShowAddressBook(false);
  };

  const handleCryptoTypeChange = (cryptoType: string) => {
    setFormData({
      ...formData,
      crypto_type: cryptoType,
      network: "",
      gas_fee: "",
      fee_speed: "standard",
    });
  };

  const handleNetworkChange = (network: string) => {
    const selectedCrypto = cryptocurrencies.find((c) => c.value === formData.crypto_type);
    const selectedNetwork = selectedCrypto?.networks.find((n) => n.value === network);
    const fee = selectedNetwork?.fees[formData.fee_speed] || "";

    setFormData({
      ...formData,
      network: network,
      gas_fee: fee,
    });
  };

  const handleFeeSpeedChange = (speed: FeeSpeed) => {
    const selectedCrypto = cryptocurrencies.find((c) => c.value === formData.crypto_type);
    const selectedNetwork = selectedCrypto?.networks.find((n) => n.value === formData.network);
    const fee = selectedNetwork?.fees[speed] || "";

    setFormData({
      ...formData,
      fee_speed: speed,
      gas_fee: fee,
    });
  };

  const goToReviewStep = () => {
    if (!formData.confirm_irreversible) {
      alert(t.confirmAddressCorrect + " " + t.transfersAreIrreversible);
      return;
    }
    setTransferStep("review");
  };

  const submitTransfer = async () => {
    if (!userProfile?.id) return;

    try {
      setSubmitting(true);

      const amount = Number.parseFloat(formData.amount);
      const gasFee = Number.parseFloat(formData.gas_fee);
      const totalAmount = amount + gasFee;

      const currentBalance =
        cryptoBalances[
          `${formData.crypto_type.toLowerCase()}_balance` as keyof CryptoBalances
        ];

      if (totalAmount > currentBalance) {
        alert(`${t.insufficientBalanceFor} ${formData.crypto_type}`);
        return;
      }

      if (formData.save_beneficiary && formData.beneficiary_name) {
        saveBeneficiary();
      }

      const { data: txId, error } = await supabase.rpc("process_real_crypto_transfer", {
        p_user_id: userProfile.id,
        p_crypto_type: formData.crypto_type,
        p_network: formData.network,
        p_amount: amount,
        p_gas_fee: gasFee,
        p_total_amount: totalAmount,
        p_wallet_address: formData.recipient_address,
        p_current_balance: currentBalance,
      });

      if (error) {
        console.error("Transfer processing error:", error);
        alert(`${t.errorProcessingTransfer} ${error.message}`);
        return;
      }

      setLastTransactionId(txId);

      setCryptoBalances((prev) => ({
        ...prev,
        [`${formData.crypto_type.toLowerCase()}_balance`]: currentBalance - totalAmount,
      }));

      await supabase.from("transactions").insert({
        user_id: userProfile.id,
        transaction_type: "Crypto Transfer",
        amount: totalAmount,
        currency: formData.crypto_type,
        description: `Transfer ${amount} ${formData.crypto_type} to ${formData.recipient_address.substring(0, 10)}...${formData.label ? ` - ${formData.label}` : ""}`,
        platform: `${formData.crypto_type} Network`,
        status: "Pending",
      });

      setTransferStep("receipt");
      fetchCryptoTransactions();
      fetchCryptoBalances();
    } catch (error: any) {
      console.error("Submit transfer error:", error);
      alert(`${t.errorLabel} ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      recipient_address: "",
      crypto_type: "",
      network: "",
      amount: "",
      fee_speed: "standard",
      gas_fee: "",
      label: "",
      save_beneficiary: false,
      beneficiary_name: "",
      confirm_irreversible: false,
    });
    setTransferStep("form");
    setShowTransferForm(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const getExplorerUrl = (network: string, hash: string) => {
    const explorers: Record<string, string> = {
      bitcoin: `https://blockchair.com/bitcoin/transaction/${hash}`,
      ethereum: `https://etherscan.io/tx/${hash}`,
      polygon: `https://polygonscan.com/tx/${hash}`,
      arbitrum: `https://arbiscan.io/tx/${hash}`,
      optimism: `https://optimistic.etherscan.io/tx/${hash}`,
      tron: `https://tronscan.org/#/transaction/${hash}`,
      bsc: `https://bscscan.com/tx/${hash}`,
    };
    return explorers[network] || "#";
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4 text-[#b91c1c]" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
      case "rejected":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return t.underReview;
      case "completed":
        return t.completed;
      case "failed":
        return t.failed;
      case "rejected":
        return t.rejected;
      default:
        return status;
    }
  };

  const selectedCrypto = cryptocurrencies.find((c) => c.value === formData.crypto_type);
  const selectedNetwork = selectedCrypto?.networks.find((n) => n.value === formData.network);

  const amount = Number.parseFloat(formData.amount) || 0;
  const gasFee = Number.parseFloat(formData.gas_fee) || 0;
  const totalAmount = amount + gasFee;

  const currentBalance = formData.crypto_type
    ? cryptoBalances[`${formData.crypto_type.toLowerCase()}_balance` as keyof CryptoBalances]
    : 0;

  const balanceAfterTransfer = currentBalance - totalAmount;

  const filteredTransactions = cryptoTransactions.filter((tx) => {
    const matchesSearch =
      searchQuery === "" ||
      tx.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.transaction_hash.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCoin = filterCoin === "all" || tx.crypto_type === filterCoin;
    const matchesStatus = filterStatus === "all" || tx.status.toLowerCase() === filterStatus;
    const matchesNetwork = filterNetwork === "all" || tx.network === filterNetwork;

    return matchesSearch && matchesCoin && matchesStatus && matchesNetwork;
  });

  const pendingCount = cryptoTransactions.filter((tx) => tx.status.toLowerCase() === "pending").length;

  const isNewAddress = formData.recipient_address && !savedBeneficiaries.some((b) => b.address === formData.recipient_address);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-6 pt-4 pt-xs-16 space-y-6 relative min-h-full max-w-7xl mx-auto">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-gray-900">{t.cryptocurrency}</h2>
              <p className="text-gray-600">{t.manageCrypto}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="outline"
                  onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                  className="relative bg-white border-2 border-gray-200 hover:border-[#b91c1c]"
                >
                  <Bell className="w-4 h-4" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#b91c1c] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Button>

                {showNotificationCenter && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-gray-200 shadow-lg z-50">
                    <div className="p-4 border-b-2 border-gray-200">
                      <h3 className="font-semibold text-gray-900">{t.activityAlerts}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {cryptoTransactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(tx.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {tx.status.toLowerCase() === "pending"
                                  ? t.transferSubmitted
                                  : `${t.transferTo} ${getStatusBadge(tx.status)}`}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {formatCryptoAmount(Number(tx.amount), cryptocurrencies.find((c) => c.value === tx.crypto_type)?.decimals || 8)} {tx.crypto_type}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(tx.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {cryptoTransactions.length === 0 && (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">{t.noNotifications}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="flex items-center space-x-2 bg-white border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#b91c1c] focus:outline-none transition-all"
                >
                  <Languages className="h-4 w-4 text-[#b91c1c]" />
                  <span>{languageNames[language]}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isLanguageDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isLanguageDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsLanguageDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-200 shadow-lg z-20">
                      {Object.entries(languageNames).map(([code, name]) => (
                        <button
                          key={code}
                          onClick={() => {
                            setLanguage(code as Language);
                            setIsLanguageDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            language === code ? "bg-[#b91c1c] text-white font-medium" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={() => {
                  setShowTransferForm(true);
                  setTransferStep("form");
                }}
                className="bg-[#b91c1c] hover:bg-[#991b1b] text-white px-6 py-2 h-auto"
                disabled={
                  cryptoBalances.btc_balance + cryptoBalances.eth_balance + cryptoBalances.usdt_balance <= 0
                }
              >
                <Send className="w-4 h-4 mr-2" />
                {t.newCryptoTransfer}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cryptocurrencies.map((crypto) => {
              const balance =
                cryptoBalances[`${crypto.value.toLowerCase()}_balance` as keyof CryptoBalances];
              const onHold = cryptoTransactions
                .filter((tx) => tx.crypto_type === crypto.value && tx.status.toLowerCase() === "pending")
                .reduce((sum, tx) => sum + Number(tx.amount) + Number(tx.gas_fee), 0);

              return (
                <Card key={crypto.value} className="bg-white border-l-4 border-l-[#b91c1c] border-y-0 border-r-0">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={crypto.iconUrl || "/placeholder.svg"} alt={crypto.label} className="w-10 h-10" />
                        <div>
                          <p className="font-semibold text-gray-900">{crypto.label}</p>
                          <p className="text-sm text-gray-500">{crypto.value}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{t.available}</span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCryptoAmount(balance, crypto.decimals)}
                          </span>
                        </div>
                        {onHold > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{t.onHold}</span>
                            <span className="text-sm font-medium text-[#b91c1c]">
                              {formatCryptoAmount(onHold, crypto.decimals)}
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                          <span>{t.lastRefreshed}</span>
                          <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {showTransferForm && (
          <Card className="bg-white border-l-4 border-l-[#b91c1c] border-y-0 border-r-0 animate-in slide-in-from-top duration-300">
            {transferStep === "form" && (
              <>
                <CardHeader className="pb-4 border-b-2 border-gray-100">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Send className="w-6 h-6 text-[#b91c1c]" />
                    {t.newCryptoTransferForm}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{t.completeFormBelow}</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Alert className="bg-yellow-50 border-2 border-yellow-200">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm text-yellow-800">
                      <strong>{t.securityChecksMayApply}</strong> {t.transfersCanBeHeld}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6 border-2 border-gray-100 p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-[#b91c1c]" />
                      {t.assetAndNetwork}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t.cryptocurrencyLabel}</Label>
                        <Select value={formData.crypto_type} onValueChange={handleCryptoTypeChange}>
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder={t.selectCryptocurrency} />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptocurrencies.map((crypto) => {
                              const balance =
                                cryptoBalances[`${crypto.value.toLowerCase()}_balance` as keyof CryptoBalances];
                              return (
                                <SelectItem key={crypto.value} value={crypto.value}>
                                  <div className="flex items-center gap-3">
                                    <img src={crypto.iconUrl || "/placeholder.svg"} alt={crypto.label} className="w-8 h-8" />
                                    <div className="flex-1">
                                      <span className="font-medium">{crypto.label}</span>
                                      <span className="text-gray-500 ml-2">({crypto.value})</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {formatCryptoAmount(balance, crypto.decimals)}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedCrypto && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Network className="w-4 h-4" />
                            {t.networkLabel}
                          </Label>
                          <Select value={formData.network} onValueChange={handleNetworkChange}>
                            <SelectTrigger className="h-12 bg-white">
                              <SelectValue placeholder={t.selectNetwork} />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedCrypto.networks.map((network) => (
                                <SelectItem key={network.value} value={network.value}>
                                  {network.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedNetwork && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              {t.estimatedTimeColon} {selectedNetwork.estimatedTime[formData.fee_speed]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 border-2 border-gray-100 p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[#b91c1c]" />
                        {t.recipient}
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressBook(!showAddressBook)}
                        className="text-sm border-2 border-gray-200 hover:border-[#b91c1c]"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t.addressBook}
                      </Button>
                    </div>

                    {showAddressBook && (
                      <div className="bg-white border-2 border-gray-200 p-4 space-y-2">
                        <h4 className="font-medium text-sm text-gray-900">{t.savedBeneficiaries}</h4>
                        {savedBeneficiaries.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">{t.noSavedBeneficiaries}</p>
                        ) : (
                          <div className="space-y-2">
                            {savedBeneficiaries.map((beneficiary) => (
                              <button
                                key={beneficiary.id}
                                onClick={() => loadBeneficiary(beneficiary)}
                                className="w-full text-left p-3 border-2 border-gray-200 hover:border-[#b91c1c] transition-colors"
                              >
                                <p className="font-medium text-sm text-gray-900">{beneficiary.label}</p>
                                <p className="text-xs text-gray-600 font-mono">{beneficiary.address.substring(0, 20)}...</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {beneficiary.crypto_type} - {beneficiary.network}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t.cryptoRecipientAddress}</Label>
                      <Input
                        value={formData.recipient_address}
                        onChange={(e) =>
                          setFormData({ ...formData, recipient_address: e.target.value })
                        }
                        placeholder={t.enterWalletAddress}
                        className="font-mono text-sm h-12 bg-white"
                      />
                      <p className="text-xs text-gray-500">
                        {t.ensureAddressFormat}
                      </p>
                    </div>

                    {isNewAddress && formData.recipient_address.length > 10 && (
                      <Alert className="bg-yellow-50 border-2 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-sm text-yellow-800">
                          <strong>{t.newBeneficiary}</strong> — {t.mayRequireVerification}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center space-x-2 p-3 bg-white border-2 border-gray-200">
                      <Checkbox
                        id="save-beneficiary"
                        checked={formData.save_beneficiary}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, save_beneficiary: checked as boolean })
                        }
                      />
                      <Label htmlFor="save-beneficiary" className="text-sm cursor-pointer">
                        {t.saveAsBeneficiary}
                      </Label>
                    </div>

                    {formData.save_beneficiary && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t.beneficiaryNameRequired}</Label>
                        <Input
                          value={formData.beneficiary_name}
                          onChange={(e) =>
                            setFormData({ ...formData, beneficiary_name: e.target.value })
                          }
                          placeholder={t.enterBeneficiaryLabel}
                          className="h-12 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 border-2 border-gray-100 p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-[#b91c1c]" />
                      {t.amountAndFees}
                    </h3>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t.amountLabel}</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step={selectedCrypto ? `0.${"0".repeat(selectedCrypto.decimals - 1)}1` : "0.00000001"}
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder={selectedCrypto ? `0.${"0".repeat(selectedCrypto.decimals)}` : "0.00000000"}
                          className="h-12 pr-20 bg-white"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-700">
                          {formData.crypto_type || "CRYPTO"}
                        </div>
                      </div>
                      {formData.crypto_type && (
                        <p className="text-xs text-gray-600">
                          {t.availableLabel} <span className="font-medium">{formatCryptoAmount(currentBalance, selectedCrypto?.decimals || 8)}</span> {formData.crypto_type}
                        </p>
                      )}
                    </div>

                    {selectedNetwork && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">{t.networkFeeSpeed}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["standard", "fast", "priority"] as FeeSpeed[]).map((speed) => (
                            <button
                              key={speed}
                              onClick={() => handleFeeSpeedChange(speed)}
                              className={`p-3 border-2 transition-all ${
                                formData.fee_speed === speed
                                  ? "border-[#b91c1c] bg-red-50"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <p className="text-sm font-medium capitalize">{t[speed]}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {selectedNetwork.fees[speed]} {formData.crypto_type}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {selectedNetwork.estimatedTime[speed]}
                              </p>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          {t.feeEstimatedMayChange}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.noteOptional}</Label>
                    <Textarea
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder={t.addNoteForRecords}
                      rows={3}
                      className="resize-none bg-white"
                    />
                  </div>

                  {selectedNetwork && (
                    <div className="bg-blue-50 border-2 border-blue-200 p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="space-y-1 text-sm text-blue-900">
                          <p><strong>{t.dailyCryptoLimit}</strong> 10.0 {formData.crypto_type}</p>
                          <p><strong>{t.remainingToday}</strong> 10.0 {formData.crypto_type}</p>
                          <p><strong>{t.estimatedProcessingTime}</strong> {selectedNetwork.estimatedTime[formData.fee_speed]}</p>
                          <p className="text-xs mt-2 text-blue-700">
                            {t.transfersMayBeDelayed}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 p-4 bg-white border-2 border-gray-200">
                    <Checkbox
                      id="confirm-irreversible"
                      checked={formData.confirm_irreversible}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, confirm_irreversible: checked as boolean })
                      }
                    />
                    <Label htmlFor="confirm-irreversible" className="text-sm cursor-pointer leading-relaxed">
                      {t.confirmAddressCorrect} <strong>{t.transfersAreIrreversible}</strong>
                    </Label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={goToReviewStep}
                      className="bg-[#b91c1c] hover:bg-[#991b1b] text-white h-12 px-8"
                      disabled={
                        !formData.recipient_address ||
                        !formData.crypto_type ||
                        !formData.network ||
                        !formData.amount ||
                        !formData.confirm_irreversible ||
                        totalAmount > currentBalance ||
                        (formData.save_beneficiary && !formData.beneficiary_name)
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t.reviewTransfer}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="h-12 px-6 border-2 border-gray-200"
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {transferStep === "review" && selectedCrypto && selectedNetwork && (
              <>
                <CardHeader className="pb-4 border-b-2 border-gray-100">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#b91c1c]" />
                    {t.reviewTransferTitle}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{t.verifyDetailsBeforeConfirming}</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Alert className="bg-yellow-50 border-2 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm text-yellow-800">
                      <strong>{t.importantCryptoWarning}</strong> {t.cryptoCannotBeReversed}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4 bg-gray-50 border-2 border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 border-b-2 border-gray-200 pb-2">{t.transferDetails}</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">{t.asset}</span>
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                          <img src={selectedCrypto.iconUrl} alt={selectedCrypto.label} className="w-5 h-5" />
                          {selectedCrypto.label} ({formData.crypto_type})
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">{t.network}</span>
                        <span className="font-medium text-gray-900">{selectedNetwork.label}</span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-600">{t.recipientAddress}</span>
                        <span className="font-mono text-sm text-gray-900 text-right break-all max-w-xs">
                          {formData.recipient_address}
                        </span>
                      </div>

                      {formData.label && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-gray-600">{t.note}</span>
                          <span className="text-sm text-gray-900 text-right max-w-xs">{formData.label}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 bg-white border-2 border-[#b91c1c] p-6">
                    <h3 className="font-semibold text-gray-900 border-b-2 border-gray-200 pb-2">{t.paymentSummary}</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t.youWillSend}</span>
                        <span className="font-medium text-gray-900">
                          {formatCryptoAmount(amount, selectedCrypto.decimals)} {formData.crypto_type}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t.networkFeeWithSpeed} ({t[formData.fee_speed]})</span>
                        <span className="font-medium text-gray-900">
                          {formatCryptoAmount(gasFee, selectedCrypto.decimals)} {formData.crypto_type}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{t.estimatedTime}</span>
                        <span className="text-sm text-gray-900">{selectedNetwork.estimatedTime[formData.fee_speed]}</span>
                      </div>

                      <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">{t.totalDeducted}</span>
                        <span className="text-xl font-bold text-[#b91c1c]">
                          {formatCryptoAmount(totalAmount, selectedCrypto.decimals)} {formData.crypto_type}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm text-gray-600">{t.balanceAfterTransfer}</span>
                        <span className="font-medium text-gray-900">
                          {formatCryptoAmount(balanceAfterTransfer, selectedCrypto.decimals)} {formData.crypto_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900">
                        <strong>{t.recipientWillReceive}</strong> {t.exactAmountDependsOnNetwork}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={submitTransfer}
                      className="bg-[#b91c1c] hover:bg-[#991b1b] text-white h-12 px-8"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t.processingTransfer}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {t.confirmAndSubmit}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setTransferStep("form")}
                      disabled={submitting}
                      className="h-12 px-6 border-2 border-gray-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t.backToEdit}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {transferStep === "receipt" && selectedCrypto && selectedNetwork && (
              <>
                <CardHeader className="pb-2 sm:pb-4 border-b border-gray-100 px-3 sm:px-6 pt-3 sm:pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-xl font-bold text-gray-900">{t.transferRequested}</CardTitle>
                      <p className="text-xs text-gray-600 mt-0.5">{t.transferSubmittedSuccessfully}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  <Alert className="bg-yellow-50 border border-yellow-200 py-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                    <AlertDescription className="text-xs text-yellow-800">
                      <strong>{t.statusUnderReview}</strong> — {t.transferBeingProcessed}
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 border border-gray-200 p-2 sm:p-4 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-1.5 mb-2 text-xs sm:text-sm">{t.transactionReceipt}</h3>
                    <div className="space-y-1.5 sm:space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t.referenceId}</span>
                        <span className="font-mono font-medium text-gray-900">
                          {lastTransactionId ? lastTransactionId.slice(0, 8).toUpperCase() : "..."}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t.status}</span>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs py-0 h-5">
                          {t.pending}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t.amountSent}</span>
                        <span className="font-medium text-gray-900">
                          {formatCryptoAmount(amount, selectedCrypto.decimals)} {formData.crypto_type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t.totalDeducted}</span>
                        <span className="font-bold text-[#b91c1c]">
                          {formatCryptoAmount(totalAmount, selectedCrypto.decimals)} {formData.crypto_type}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-gray-200">
                        <span className="text-gray-600 block mb-1">{t.recipient}</span>
                        <span className="font-mono text-xs text-gray-900 break-all block">
                          {formData.recipient_address}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-2 sm:p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-900 min-w-0">
                        <strong>{t.estimatedCompletion}</strong> {selectedNetwork.estimatedTime[formData.fee_speed]}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={resetForm}
                    className="bg-[#b91c1c] hover:bg-[#991b1b] text-white h-9 sm:h-10 w-full text-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t.done}
                  </Button>
                </CardContent>
              </>
            )}
          </Card>
        )}

        <Card className="bg-white border-l-4 border-l-[#b91c1c] border-y-0 border-r-0">
          <CardHeader className="border-b-2 border-gray-100">
            <CardTitle className="text-xl font-bold">{t.transferHistory}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchByAddressOrHash}
                    className="pl-10 h-10 bg-white"
                  />
                </div>
                <Button
                  variant="outline"
                  className="border-2 border-gray-200 hover:border-[#b91c1c] h-10 px-4"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {t.filters}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Select value={filterCoin} onValueChange={setFilterCoin}>
                  <SelectTrigger className="h-10 bg-white border-2">
                    <SelectValue placeholder={t.allCoins} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCoins}</SelectItem>
                    <SelectItem value="BTC">{t.bitcoin}</SelectItem>
                    <SelectItem value="ETH">{t.ethereum}</SelectItem>
                    <SelectItem value="USDT">{t.tetherUsd}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 bg-white border-2">
                    <SelectValue placeholder={t.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    <SelectItem value="pending">{t.underReview}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="failed">{t.failed}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterNetwork} onValueChange={setFilterNetwork}>
                  <SelectTrigger className="h-10 bg-white border-2">
                    <SelectValue placeholder={t.allNetworks} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allNetworks}</SelectItem>
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="tron">Tron</SelectItem>
                    <SelectItem value="bsc">BSC</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="30">
                  <SelectTrigger className="h-10 bg-white border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">{t.last7Days}</SelectItem>
                    <SelectItem value="30">{t.last30Days}</SelectItem>
                    <SelectItem value="90">{t.last90Days}</SelectItem>
                    <SelectItem value="custom">{t.customRange}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{searchQuery || filterCoin !== "all" || filterStatus !== "all" || filterNetwork !== "all" ? t.noMatchingTransfers : t.noCryptoTransfers}</p>
                <p className="text-gray-400 text-sm">{searchQuery || filterCoin !== "all" || filterStatus !== "all" || filterNetwork !== "all" ? t.tryAdjustingFilters : t.cryptoTransferHistoryAppear}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const crypto = cryptocurrencies.find((c) => c.value === transaction.crypto_type);
                  const txId = `${transaction.id.substring(0, 8)}`;

                  return (
                    <div
                      key={transaction.id}
                      className="p-4 border-2 border-gray-200 bg-white hover:border-gray-300 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            {getStatusIcon(transaction.status)}
                            <p className="font-medium text-gray-900">
                              {transaction.crypto_type} {t.transferTo}
                            </p>
                            <Badge variant="outline" className="border-[#b91c1c] text-[#b91c1c]">
                              {getStatusBadge(transaction.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">{t.amount}: </span>
                              <span className="font-medium text-gray-900">
                                {formatCryptoAmount(Number(transaction.amount), crypto?.decimals || 8)} {transaction.crypto_type}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">{t.fee}: </span>
                              <span className="font-medium text-gray-900">
                                {formatCryptoAmount(Number(transaction.gas_fee), crypto?.decimals || 8)} {transaction.crypto_type}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">{t.network}: </span>
                              <span className="font-medium text-gray-900">{transaction.network}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">{t.ref}: </span>
                              <span className="font-mono text-xs font-medium text-gray-900">{txId}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{t.submittedColon} {new Date(transaction.created_at).toLocaleString()}</span>
                          </div>

                          {transaction.transaction_hash && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600">{t.hashColon}</span>
                              <span className="font-mono text-gray-900">{transaction.transaction_hash.substring(0, 16)}...</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(transaction.wallet_address, `address-${transaction.id}`)}
                            className="border-2 border-gray-200 hover:border-[#b91c1c]"
                          >
                            {copiedField === `address-${transaction.id}` ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>

                          {transaction.transaction_hash && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(transaction.transaction_hash, `hash-${transaction.id}`)}
                                className="border-2 border-gray-200 hover:border-[#b91c1c]"
                              >
                                {copiedField === `hash-${transaction.id}` ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Hash
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(getExplorerUrl(transaction.network, transaction.transaction_hash), "_blank")}
                                className="border-2 border-gray-200 hover:border-[#b91c1c]"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                {t.explorer}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
