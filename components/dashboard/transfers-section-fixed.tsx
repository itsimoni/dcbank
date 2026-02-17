"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useRealtimeData } from "../../hooks/use-realtime-data";
import { ExchangeRateService } from "../../lib/exchange-rates";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  ArrowLeftRight,
  Building2,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Languages,
  Check,
  Copy,
  FileText,
  Search,
  Filter,
  AlertCircle,
  Info,
} from "lucide-react";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface TransfersSectionProps {
  userProfile: UserProfile;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  type: "fiat" | "crypto";
}

interface BankDetails {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  iban: string;
  bank_address: string;
  recipient_address: string;
  purpose_of_transfer: string;
  beneficiary_country: string;
  beneficiary_bank_country: string;
  account_type: string;
  intermediary_bank_name: string;
  intermediary_swift: string;
  intermediary_iban: string;
}

interface BankTransferRecord {
  id: string;
  transfer_id: number;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  iban: string;
  bank_address: string;
  recipient_address: string;
  purpose_of_transfer: string;
  beneficiary_country: string;
  beneficiary_bank_country: string;
  account_type: string;
  intermediary_bank_name: string;
  intermediary_swift: string;
  intermediary_iban: string;
  created_at: string;
  updated_at: string;
}

interface Transfer {
  id: number;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  status: string;
  transfer_type: string;
  description: string;
  reference_number: string;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  status_reason: string | null;
  fee_amount: number;
  fee_currency: string | null;
  rate_source: string | null;
  rate_timestamp: string | null;
  bank_transfer?: BankTransferRecord | null;
}

type TransferStatus = "pending" | "processing" | "approved" | "completed" | "rejected";
type TransferType = "internal" | "bank_transfer" | "all";

interface ConfirmationData {
  reference_number: string;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  fee_amount: number;
  total_debit: number;
  exchange_rate: number;
  status: string;
  transfer_type: string;
  created_at: string;
}

export default function TransfersSection({
  userProfile,
}: TransfersSectionProps) {
  const { balances, loading, error } = useRealtimeData();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRateService] = useState(() =>
    ExchangeRateService.getInstance()
  );
  const [liveRates, setLiveRates] = useState({
    fiat: {},
    crypto: {},
    lastUpdated: 0,
  });

  const { language, setLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(language);

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "es", label: "Español" },
    { code: "it", label: "Italiano" },
    { code: "el", label: "Ελληνικά" },
  ];

  const [internalFormData, setInternalFormData] = useState({
    from_currency: "",
    to_currency: "",
    amount: "",
  });

  const [bankFormData, setBankFormData] = useState({
    from_currency: "",
    to_currency: "",
    amount: "",
  });

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    routing_number: "",
    swift_code: "",
    iban: "",
    bank_address: "",
    recipient_address: "",
    purpose_of_transfer: "",
    beneficiary_country: "",
    beneficiary_bank_country: "",
    account_type: "",
    intermediary_bank_name: "",
    intermediary_swift: "",
    intermediary_iban: "",
  });

  const [activeTab, setActiveTab] = useState("internal");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [transferFee, setTransferFee] = useState<number>(0);
  const [showHistoryOnMobile, setShowHistoryOnMobile] = useState(false);

  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  const [filterStatus, setFilterStatus] = useState<TransferStatus | "all">("all");
  const [filterType, setFilterType] = useState<TransferType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [copiedField, setCopiedField] = useState<string>("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (userProfile?.id) {
      fetchTransfers();
      initializeCurrencies();
      initializeExchangeRates();
    }
    return () => {
      exchangeRateService.cleanup();
    };
  }, [userProfile?.id]);

  useEffect(() => {
    applyFilters();
  }, [transfers, filterStatus, filterType, searchQuery]);

  const applyFilters = () => {
    let filtered = [...transfers];

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (t) => t.status.toLowerCase() === filterStatus
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.transfer_type === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.reference_number?.toLowerCase().includes(query) ||
          t.from_currency.toLowerCase().includes(query) ||
          t.to_currency.toLowerCase().includes(query)
      );
    }

    setFilteredTransfers(filtered);
  };

  const initializeExchangeRates = async () => {
    await exchangeRateService.initialize();
    const unsubscribe = exchangeRateService.subscribe((rates) => {
      setLiveRates(rates);
    });
    return unsubscribe;
  };

  const initializeCurrencies = () => {
    const databaseCurrencies: Currency[] = [
      { code: "USD", name: "US Dollar", symbol: "$", type: "fiat" },
      { code: "EUR", name: "Euro", symbol: "€", type: "fiat" },
      { code: "CAD", name: "Canadian Dollar", symbol: "C$", type: "fiat" },
      { code: "ETH", name: "Ethereum", symbol: "Ξ", type: "crypto" },
      { code: "ADA", name: "Cardano", symbol: "₳", type: "crypto" },
      { code: "DOT", name: "Polkadot", symbol: "●", type: "crypto" },
      { code: "LINK", name: "Chainlink", symbol: "🔗", type: "crypto" },
    ];

    const allCurrencies: Currency[] = [
      ...databaseCurrencies,
      { code: "GBP", name: "British Pound", symbol: "£", type: "fiat" },
      { code: "JPY", name: "Japanese Yen", symbol: "¥", type: "fiat" },
      { code: "AUD", name: "Australian Dollar", symbol: "A$", type: "fiat" },
      { code: "CHF", name: "Swiss Franc", symbol: "CHF", type: "fiat" },
    ];

    setCurrencies(allCurrencies);
  };

  const getDatabaseCurrencies = () => {
    return currencies.filter((c) =>
      ["USD", "EUR", "CAD", "BTC"].includes(c.code)
    );
  };

  const getBankTransferCurrencies = () => {
    return currencies.filter((c) =>
      ["USD", "EUR", "CAD", "BTC"].includes(c.code)
    );
  };

  useEffect(() => {
    const formData = activeTab === "internal" ? internalFormData : bankFormData;
    if (
      formData.from_currency &&
      formData.to_currency &&
      formData.amount &&
      liveRates.lastUpdated > 0
    ) {
      calculateRealTimeExchange();
    }
  }, [internalFormData, bankFormData, liveRates, activeTab]);

  const calculateRealTimeExchange = () => {
    const currentFormData =
      activeTab === "internal" ? internalFormData : bankFormData;
    const fromCurrency = currentFormData.from_currency.toUpperCase();
    const toCurrency = currentFormData.to_currency.toUpperCase();
    const amount = Number(currentFormData.amount);

    if (!amount || fromCurrency === toCurrency) {
      setExchangeRate(1);
      setEstimatedAmount(amount);
      setTransferFee(calculateTransferFee(amount, fromCurrency, toCurrency));
      return;
    }

    let rate = exchangeRateService.getExchangeRate(fromCurrency, toCurrency);

    if (rate && rate < 1 && fromCurrency !== toCurrency) {
      const inverseRate = exchangeRateService.getExchangeRate(
        toCurrency,
        fromCurrency
      );
      if (inverseRate && inverseRate > rate) {
        rate = 1 / inverseRate;
      } else {
        rate = 1 / rate;
      }
    }

    const convertedAmount = amount * rate;
    const fee = calculateTransferFee(amount, fromCurrency, toCurrency);

    setExchangeRate(rate);
    setEstimatedAmount(convertedAmount);
    setTransferFee(fee);
  };

  const calculateTransferFee = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    const fromCurrencyInfo = currencies.find((c) => c.code === fromCurrency);
    const toCurrencyInfo = currencies.find((c) => c.code === toCurrency);

    if (activeTab === "bank") {
      const baseFee = amount * 0.02;
      const fixedFee =
        fromCurrencyInfo?.type === "crypto" || toCurrencyInfo?.type === "crypto"
          ? 50
          : 25;
      return baseFee + fixedFee;
    } else {
      if (
        fromCurrencyInfo?.type === "crypto" ||
        toCurrencyInfo?.type === "crypto"
      ) {
        return amount * 0.01;
      } else {
        return amount * 0.005;
      }
    }
  };

  const fetchTransfers = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("transfers")
        .select(`
          *,
          bank_transfer:bank_transfers(*)
        `)
        .eq("user_id", userProfile.id)
        .in("transfer_type", ["internal", "bank_transfer"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedData = data?.map((transfer: any) => ({
        ...transfer,
        bank_transfer: Array.isArray(transfer.bank_transfer)
          ? transfer.bank_transfer[0]
          : transfer.bank_transfer,
      })) || [];

      setTransfers(transformedData);
    } catch (error) {
      console.error("Error fetching transfers:", error);
    }
  };

  const getTableName = (currencyCode: string) => {
    const tableMap: { [key: string]: string } = {
      USD: "usd_balances",
      EUR: "euro_balances",
      CAD: "cad_balances",
      BTC: "crypto_balances",
      ETH: "crypto_balances",
      ADA: "crypto_balances",
      DOT: "crypto_balances",
      LINK: "crypto_balances",
      GBP: "usd_balances",
      JPY: "usd_balances",
      AUD: "usd_balances",
      CHF: "usd_balances",
    };
    return tableMap[currencyCode.toUpperCase()];
  };

  const getBalanceKey = (currencyCode: string): keyof typeof balances => {
    const keyMap: { [key: string]: keyof typeof balances } = {
      USD: "usd",
      EUR: "euro",
      CAD: "cad",
      BTC: "crypto",
      ETH: "crypto",
      ADA: "crypto",
      DOT: "crypto",
      LINK: "crypto",
      GBP: "usd",
      JPY: "usd",
      AUD: "usd",
      CHF: "usd",
    };
    return keyMap[currencyCode.toUpperCase()] || "usd";
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp.slice(-6)}-${random}`;
  };

  const validateInternalTransfer = (): string[] => {
    const errors: string[] = [];
    const amount = Number.parseFloat(internalFormData.amount);
    const fromCurrency = internalFormData.from_currency.toUpperCase();
    const toCurrency = internalFormData.to_currency.toUpperCase();

    if (!fromCurrency || !toCurrency || !internalFormData.amount) {
      errors.push("All fields are required");
    }

    if (fromCurrency === toCurrency) {
      errors.push("From and To currencies must be different");
    }

    if (amount <= 0) {
      errors.push("Amount must be greater than zero");
    }

    const fromBalanceKey = getBalanceKey(fromCurrency);
    const currentFromBalance = balances[fromBalanceKey] || 0;

    if (currentFromBalance < amount + transferFee) {
      errors.push(
        `Insufficient balance. Available: ${currentFromBalance.toFixed(2)} ${fromCurrency}, Required: ${(
          amount + transferFee
        ).toFixed(2)} ${fromCurrency}`
      );
    }

    return errors;
  };

  const validateBankTransfer = (): string[] => {
    const errors: string[] = [];
    const amount = Number.parseFloat(bankFormData.amount);
    const fromCurrency = bankFormData.from_currency.toUpperCase();
    const toCurrency = bankFormData.to_currency.toUpperCase();

    if (!fromCurrency || !toCurrency || !bankFormData.amount) {
      errors.push("All currency and amount fields are required");
    }

    if (fromCurrency === toCurrency) {
      errors.push("From and To currencies must be different");
    }

    if (amount <= 0) {
      errors.push("Amount must be greater than zero");
    }

    const fromBalanceKey = getBalanceKey(fromCurrency);
    const currentFromBalance = balances[fromBalanceKey] || 0;

    if (currentFromBalance < amount + transferFee) {
      errors.push(
        `Insufficient balance. Available: ${currentFromBalance.toFixed(2)} ${fromCurrency}, Required: ${(
          amount + transferFee
        ).toFixed(2)} ${fromCurrency}`
      );
    }

    if (!bankDetails.bank_name.trim()) {
      errors.push("Bank name is required");
    }

    if (!bankDetails.account_holder_name.trim()) {
      errors.push("Account holder name is required");
    }

    if (!bankDetails.account_number.trim()) {
      errors.push("Account number is required");
    }

    return errors;
  };

  const executeInternalTransfer = async () => {
    if (!userProfile?.id) return;

    const errors = validateInternalTransfer();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    try {
      const amount = Number.parseFloat(internalFormData.amount);
      const fromCurrency = internalFormData.from_currency.toUpperCase();
      const toCurrency = internalFormData.to_currency.toUpperCase();

      const fromBalanceKey = getBalanceKey(fromCurrency);
      const toBalanceKey = getBalanceKey(toCurrency);

      const currentFromBalance = balances[fromBalanceKey] || 0;
      const currentToBalance = balances[toBalanceKey] || 0;

      const toAmount = estimatedAmount;
      const referenceNumber = generateReferenceNumber();
      const now = new Date().toISOString();

      const { data: transferData, error: transferError } = await supabase
        .from("transfers")
        .insert({
          user_id: userProfile.id,
          client_id: userProfile.client_id,
          from_currency: internalFormData.from_currency,
          to_currency: internalFormData.to_currency,
          from_amount: amount,
          to_amount: toAmount,
          exchange_rate: exchangeRate,
          status: "completed",
          transfer_type: "internal",
          description: `Account transfer from ${fromCurrency} to ${toCurrency}`,
          reference_number: referenceNumber,
          fee_amount: transferFee,
          fee_currency: fromCurrency,
          processed_at: now,
          rate_source: "live_market",
          rate_timestamp: new Date(liveRates.lastUpdated).toISOString(),
        })
        .select()
        .single();

      if (transferError) throw transferError;

      const fromTable = getTableName(fromCurrency);
      const toTable = getTableName(toCurrency);

      if (fromTable && toTable) {
        const newFromBalance = currentFromBalance - amount - transferFee;
        const newToBalance = currentToBalance + toAmount;

        await Promise.all([
          supabase
            .from(fromTable)
            .update({ balance: newFromBalance })
            .eq("user_id", userProfile.id),
          supabase
            .from(toTable)
            .update({ balance: newToBalance })
            .eq("user_id", userProfile.id),
        ]);
      }

      await supabase.from("transactions").insert([
        {
          user_id: userProfile.id,
          type: "Transfer Out",
          amount: amount + transferFee,
          currency: internalFormData.from_currency,
          description: `Account transfer to ${internalFormData.to_currency} (Ref: ${referenceNumber})`,
          status: "Successful",
        },
        {
          user_id: userProfile.id,
          type: "Transfer In",
          amount: toAmount,
          currency: internalFormData.to_currency,
          description: `Account transfer from ${internalFormData.from_currency} (Ref: ${referenceNumber})`,
          status: "Successful",
        },
      ]);

      setConfirmationData({
        reference_number: referenceNumber,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: amount,
        to_amount: toAmount,
        fee_amount: transferFee,
        total_debit: amount + transferFee,
        exchange_rate: exchangeRate,
        status: "completed",
        transfer_type: "internal",
        created_at: now,
      });

      setInternalFormData({ from_currency: "", to_currency: "", amount: "" });
      setExchangeRate(1);
      setEstimatedAmount(0);
      setTransferFee(0);

      await fetchTransfers();
      setShowConfirmationModal(true);
    } catch (error: any) {
      console.error("Transfer error:", error);
      setValidationErrors([`Error: ${error.message}`]);
    }
  };

  const executeBankTransfer = async () => {
    if (!userProfile?.id) return;

    const errors = validateBankTransfer();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    try {
      const amount = Number.parseFloat(bankFormData.amount);
      const fromCurrency = bankFormData.from_currency.toUpperCase();
      const toCurrency = bankFormData.to_currency.toUpperCase();

      const fromBalanceKey = getBalanceKey(fromCurrency);
      const currentFromBalance = balances[fromBalanceKey] || 0;

      const toAmount = estimatedAmount;
      const referenceNumber = generateReferenceNumber();
      const now = new Date().toISOString();

      const { data: transferData, error: transferError } = await supabase
        .from("transfers")
        .insert({
          user_id: userProfile.id,
          client_id: userProfile.client_id,
          from_currency: bankFormData.from_currency,
          to_currency: bankFormData.to_currency,
          from_amount: amount,
          to_amount: toAmount,
          exchange_rate: exchangeRate,
          status: "pending",
          transfer_type: "bank_transfer",
          description: `Bank transfer to ${bankDetails.bank_name}`,
          reference_number: referenceNumber,
          fee_amount: transferFee,
          fee_currency: fromCurrency,
          rate_source: "estimated",
          rate_timestamp: new Date(liveRates.lastUpdated).toISOString(),
        })
        .select()
        .single();

      if (transferError) throw transferError;

      const { error: bankError } = await supabase.from("bank_transfers").insert({
        transfer_id: transferData.id,
        ...bankDetails,
      });

      if (bankError) throw bankError;

      const fromTable = getTableName(fromCurrency);
      if (fromTable) {
        const newFromBalance = currentFromBalance - amount - transferFee;
        await supabase
          .from(fromTable)
          .update({ balance: newFromBalance })
          .eq("user_id", userProfile.id);
      }

      await supabase.from("transactions").insert({
        user_id: userProfile.id,
        type: "Bank Transfer",
        amount: amount + transferFee,
        currency: bankFormData.from_currency,
        description: `Bank transfer to ${bankDetails.bank_name} (Ref: ${referenceNumber}) - Pending review`,
        status: "Pending",
      });

      setConfirmationData({
        reference_number: referenceNumber,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: amount,
        to_amount: toAmount,
        fee_amount: transferFee,
        total_debit: amount + transferFee,
        exchange_rate: exchangeRate,
        status: "pending",
        transfer_type: "bank_transfer",
        created_at: now,
      });

      setBankFormData({ from_currency: "", to_currency: "", amount: "" });
      setBankDetails({
        bank_name: "",
        account_holder_name: "",
        account_number: "",
        routing_number: "",
        swift_code: "",
        iban: "",
        bank_address: "",
        recipient_address: "",
        purpose_of_transfer: "",
        beneficiary_country: "",
        beneficiary_bank_country: "",
        account_type: "",
        intermediary_bank_name: "",
        intermediary_swift: "",
        intermediary_iban: "",
      });
      setExchangeRate(1);
      setEstimatedAmount(0);
      setTransferFee(0);

      await fetchTransfers();
      setShowConfirmationModal(true);
    } catch (error: any) {
      console.error("Bank transfer error:", error);
      setValidationErrors([`Error: ${error.message}`]);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalized = status.trim().toLowerCase() as TransferStatus;

    const statusConfig: Record<
      TransferStatus,
      {
        color: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      pending: {
        color: "bg-white text-slate-700 border-2 border-gray-300",
        label: "Pending review",
        icon: Clock,
      },
      approved: {
        color: "bg-white text-slate-700 border-2 border-gray-300",
        label: "Approved",
        icon: CheckCircle,
      },
      completed: {
        color: "bg-white text-slate-700 border-2 border-gray-300",
        label: "Completed",
        icon: CheckCircle,
      },
      rejected: {
        color: "bg-white text-red-600 border-2 border-red-600",
        label: "Rejected",
        icon: XCircle,
      },
      processing: {
        color: "bg-white text-slate-700 border-2 border-gray-300",
        label: "Processing",
        icon: Clock,
      },
    };

    const config = statusConfig[normalized] ?? statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    return `••••${lastFour}`;
  };

  const maskIban = (iban: string): string => {
    if (!iban || iban.length <= 8) return iban;
    const first = iban.slice(0, 4);
    const last = iban.slice(-4);
    return `${first}••••••${last}`;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const renderCurrencyOption = (currency: Currency) => (
    <div className="flex items-center gap-3">
      <span className="text-lg">{currency.symbol}</span>
      <div className="flex flex-col">
        <span className="font-medium">{currency.name}</span>
        <span className="text-xs text-slate-500">
          {currency.code} • {currency.type === "crypto" ? "Crypto" : t.fiat}
        </span>
      </div>
      {currency.type === "crypto" && (
        <Coins className="w-4 h-4 text-red-500" />
      )}
    </div>
  );

  const TransferDetailsModal = () => {
    if (!selectedTransfer) return null;

    const isInternal = selectedTransfer.transfer_type === "internal";
    const isPending = selectedTransfer.status.toLowerCase() === "pending";

    return (
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              Transfer Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Reference Number - Prominent */}
            <div className="bg-white border-2 border-red-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 mb-1 font-medium">
                    Reference Number
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    {selectedTransfer.reference_number}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      selectedTransfer.reference_number,
                      "reference"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {copiedField === "reference" ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedField === "reference" ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Status and Timeline */}
            <div className="border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Status & Timeline
              </h3>
              <div className="flex items-center gap-2 mb-4">
                {getStatusBadge(selectedTransfer.status)}
                {isInternal && (
                  <Badge className="bg-white text-slate-700 border-2 border-gray-300">
                    Rate locked at submission
                  </Badge>
                )}
                {!isInternal && isPending && (
                  <Badge className="bg-white text-slate-700 border-2 border-gray-300">
                    Estimated. Final amount confirmed when processed
                  </Badge>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      Submitted
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(selectedTransfer.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedTransfer.processed_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        Processed
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(
                          selectedTransfer.processed_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {!selectedTransfer.processed_at && isPending && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-slate-300 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-400">
                        Processing
                      </p>
                      <p className="text-xs text-slate-400">
                        Awaiting approval
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Details */}
            <div className="border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Transfer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">From Currency</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.from_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">To Currency</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.to_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Debit Amount</p>
                  <p className="text-sm font-medium text-red-600">
                    {selectedTransfer.from_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}{" "}
                    {selectedTransfer.from_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Credit Amount</p>
                  <p className="text-sm font-medium text-green-600">
                    {selectedTransfer.to_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}{" "}
                    {selectedTransfer.to_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Exchange Rate</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.exchange_rate.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Fees</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.fee_amount.toFixed(2)}{" "}
                    {selectedTransfer.fee_currency || selectedTransfer.from_currency}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-600 mb-1">Total Debit</p>
                  <p className="text-lg font-bold text-red-700">
                    {(
                      selectedTransfer.from_amount + selectedTransfer.fee_amount
                    ).toFixed(2)}{" "}
                    {selectedTransfer.from_currency}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details - Only for bank transfers */}
            {!isInternal && selectedTransfer.bank_transfer && (
              <div className="border-2 border-gray-300 p-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Bank Name</p>
                    <p className="text-sm font-medium">
                      {selectedTransfer.bank_transfer.bank_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">
                      Account Holder
                    </p>
                    <p className="text-sm font-medium">
                      {selectedTransfer.bank_transfer.account_holder_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">
                      Account Number
                    </p>
                    <p className="text-sm font-medium font-mono">
                      {maskAccountNumber(
                        selectedTransfer.bank_transfer.account_number
                      )}
                    </p>
                  </div>
                  {selectedTransfer.bank_transfer.swift_code && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1">SWIFT Code</p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.bank_transfer.swift_code}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.bank_transfer.iban && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">IBAN</p>
                      <p className="text-sm font-medium font-mono">
                        {maskIban(selectedTransfer.bank_transfer.iban)}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.bank_transfer.routing_number && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Routing Number
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.bank_transfer.routing_number}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.bank_transfer.purpose_of_transfer && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">Purpose</p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.bank_transfer.purpose_of_transfer}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.bank_transfer.bank_address && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">
                        Bank Address
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.bank_transfer.bank_address}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.bank_transfer.recipient_address && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">
                        Recipient Address
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.bank_transfer.recipient_address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Notes / Status Reason */}
            {(selectedTransfer.admin_notes || selectedTransfer.status_reason) && (
              <div className="border-2 border-gray-300 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Additional Information
                </h3>
                {selectedTransfer.status_reason && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-600 mb-1">Status Reason</p>
                    <p className="text-sm text-slate-800">
                      {selectedTransfer.status_reason}
                    </p>
                  </div>
                )}
                {selectedTransfer.admin_notes && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Notes</p>
                    <p className="text-sm text-slate-800">
                      {selectedTransfer.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const ConfirmationModal = () => {
    if (!confirmationData) return null;

    return (
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Transfer Receipt
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Reference Number */}
            <div className="bg-white border-2 border-red-600 p-4 text-center">
              <p className="text-xs text-slate-600 mb-1 font-medium">
                Reference Number
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {confirmationData.reference_number}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    confirmationData.reference_number,
                    "confirmation"
                  )
                }
                className="mt-2 text-slate-700"
              >
                {copiedField === "confirmation" ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copiedField === "confirmation" ? "Copied" : "Copy Receipt"}
              </Button>
            </div>

            {/* Receipt Details */}
            <div className="border border-slate-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Status</p>
                  <div className="mt-1">{getStatusBadge(confirmationData.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Submitted</p>
                  <p className="text-sm font-medium">
                    {new Date(confirmationData.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">From</p>
                  <p className="text-sm font-medium">
                    {confirmationData.from_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">To</p>
                  <p className="text-sm font-medium">
                    {confirmationData.to_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Amount</p>
                  <p className="text-sm font-medium">
                    {confirmationData.from_amount.toFixed(2)}{" "}
                    {confirmationData.from_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Fees</p>
                  <p className="text-sm font-medium">
                    {confirmationData.fee_amount.toFixed(2)}{" "}
                    {confirmationData.from_currency}
                  </p>
                </div>
                <div className="col-span-2 bg-white p-3 border-2 border-red-600">
                  <p className="text-xs text-slate-600 mb-1 font-medium">
                    Total Debit
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {confirmationData.total_debit.toFixed(2)}{" "}
                    {confirmationData.from_currency}
                  </p>
                </div>
                <div className="col-span-2 bg-white p-3 border-2 border-gray-300">
                  <p className="text-xs text-slate-600 mb-1 font-medium">
                    Estimated Credit
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    {confirmationData.to_amount.toFixed(2)}{" "}
                    {confirmationData.to_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Rate Used</p>
                  <p className="text-sm font-medium">
                    {confirmationData.exchange_rate.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">Type</p>
                  <p className="text-sm font-medium">
                    {confirmationData.transfer_type === "internal"
                      ? "Account Transfer"
                      : "Bank Transfer"}
                  </p>
                </div>
              </div>
            </div>

            {confirmationData.transfer_type === "bank_transfer" && (
              <div className="bg-white border-2 border-gray-300 p-3 text-sm text-slate-800">
                <p className="font-medium mb-1">
                  Your transfer is pending review
                </p>
                <p className="text-xs text-slate-600">
                  Our team will process this transfer shortly. You'll be notified
                  once it's completed.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button onClick={() => setShowConfirmationModal(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-slate-600">{t.loadingTransfers}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center bg-white p-6 border border-red-600">
          <div className="text-red-600 text-lg font-semibold">Error</div>
          <div className="text-red-500 mt-2">{error}</div>
        </div>
      </div>
    );
  }

  const currentFormData = activeTab === "internal" ? internalFormData : bankFormData;
  const fromCurrency = currentFormData.from_currency;
  const amount = Number(currentFormData.amount) || 0;
  const availableBalance = fromCurrency
    ? balances[getBalanceKey(fromCurrency)] || 0
    : 0;
  const totalDebit = amount + transferFee;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .balance-card {
          background: white;
          transition: all 0.3s ease;
          border: 2px solid #e5e7eb;
        }
        .balance-card:hover {
          border-color: #dc2626;
        }
        .transfer-form {
          background: white;
          border: 2px solid #e5e7eb;
        }
        .history-card {
          background: white;
          border: 2px solid #e5e7eb;
        }
        .transfer-item {
          background: #fafafa;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .transfer-item:hover {
          background: white;
          border-color: #dc2626;
        }
        .live-rate-indicator {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        @media (max-width: 1023px) {
          .mobile-form-priority {
            min-height: calc(100vh - 200px);
          }
          .custom-scrollbar {
            max-height: 40vh;
            overflow-y: auto;
          }
        }
      `}</style>

      {/* Header Container - Language Button and Header */}
      <div className="flex-shrink-0 border-b-2 border-gray-200">
        {/* Language Selector - Top Right */}
        <div className="flex justify-end p-4 pb-0">
          <div ref={dropdownRef} className="relative inline-block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent cursor-pointer transition-all shadow-sm hover:shadow-md min-w-[160px]"
            >
              <Languages className="w-4 h-4 text-gray-600" />
              <span className="flex-1 text-left">
                {languages.find((lang) => lang.code === language)?.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
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
                        ? "bg-white text-red-600 font-medium border-l-2 border-red-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <Check className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Header Content */}
        <div className="text-center py-6 md:py-6 px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
            {t.currencyTransfers}
          </h2>
          <p className="text-slate-600">
            Account transfers and bank wire transfers
          </p>
          {liveRates.lastUpdated > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 live-rate-indicator" />
              <span className="text-xs text-green-600 font-medium">
                {t.ratesUpdated}{" "}
                {new Date(liveRates.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout - Fixed Height */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden px-4 md:px-6 pb-6 gap-6">
        {/* Main Content - Scrollable */}
        <div className="flex-1 lg:flex-1 overflow-y-auto custom-scrollbar min-h-0 mobile-form-priority">
          <div className="space-y-6 pr-4">
            {/* Current Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              <Card className="balance-card">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-red-600 flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-lg font-bold">$</span>
                  </div>

                  <p className="text-xs text-slate-600 mb-1 font-medium">
                    {t.usDollar}
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    ${Number(balances.usd || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="balance-card">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-red-600 flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-lg font-bold">€</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1 font-medium">
                    {t.euro}
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    €{Number(balances.euro || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="balance-card">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-red-600 flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-lg font-bold">C$</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1 font-medium">
                    {t.canadianDollar}
                  </p>
                  <p className="text-xl font-bold text-slate-800">
                    C${Number(balances.cad || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-white border-2 border-red-600 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-600 mb-2">
                      Please correct the following errors:
                    </p>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Forms */}
            <Card className="transfer-form">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-600 flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-white" />
                  </div>
                  Create Transfer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(val) => {
                    setActiveTab(val);
                    setValidationErrors([]);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="internal"
                      className="flex items-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      Account Transfer
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Bank Wire
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="internal" className="space-y-6 mt-6">
                    {/* Available Balance Display */}
                    {fromCurrency && (
                      <div className="bg-white border-2 border-gray-300 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            Available Balance ({fromCurrency}):
                          </span>
                          <span className="text-slate-900 font-bold">
                            {availableBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.fromCurrency}
                        </Label>
                        <Select
                          value={internalFormData.from_currency}
                          onValueChange={(value) => {
                            setInternalFormData({
                              ...internalFormData,
                              from_currency: value,
                            });
                            setValidationErrors([]);
                          }}
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-red-600 transition-colors">
                            <SelectValue placeholder={t.selectCurrency} />
                          </SelectTrigger>
                          <SelectContent>
                            {getDatabaseCurrencies().map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="py-3 hover:bg-slate-50"
                              >
                                {renderCurrencyOption(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col items-center justify-center px-6 py-4">
                        <div className="w-12 h-12 bg-red-600 flex items-center justify-center mb-2">
                          <ArrowLeftRight className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-red-600 text-white px-3 py-1 text-sm font-medium">
                          {exchangeRate === 1 ? "1:1" : exchangeRate.toFixed(6)}
                        </div>
                        {liveRates.lastUpdated > 0 && exchangeRate !== 1 && (
                          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {t.live}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.toCurrency}
                        </Label>
                        <Select
                          value={internalFormData.to_currency}
                          onValueChange={(value) => {
                            setInternalFormData({
                              ...internalFormData,
                              to_currency: value,
                            });
                            setValidationErrors([]);
                          }}
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-red-600 transition-colors">
                            <SelectValue placeholder={t.selectCurrency} />
                          </SelectTrigger>
                          <SelectContent>
                            {getDatabaseCurrencies().map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="py-3 hover:bg-slate-50"
                              >
                                {renderCurrencyOption(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          Amount
                        </Label>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={internalFormData.amount}
                          onChange={(e) => {
                            setInternalFormData({
                              ...internalFormData,
                              amount: e.target.value,
                            });
                            setValidationErrors([]);
                          }}
                          placeholder="0.00"
                          className="h-12 text-lg border-slate-300 hover:border-red-600 focus:border-red-600 transition-colors"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          Fees
                        </Label>
                        <Input
                          value={
                            transferFee === 0
                              ? "0.00"
                              : transferFee.toFixed(2)
                          }
                          readOnly
                          className="h-12 text-lg font-semibold bg-white border-2 border-red-600 text-red-800"
                        />
                      </div>
                    </div>

                    {/* Total Debit and Estimated Credit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border-2 border-red-600 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          Total Debit
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {totalDebit.toFixed(2)}{" "}
                          <span className="text-sm">{fromCurrency || "—"}</span>
                        </p>
                      </div>
                      <div className="border-2 border-gray-300 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          Estimated Credit
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {estimatedAmount === 0
                            ? "0.00"
                            : estimatedAmount.toFixed(2)}{" "}
                          <span className="text-sm">
                            {internalFormData.to_currency || "—"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Rate info */}
                    <div className="bg-white border-2 border-gray-300 p-3 text-sm text-slate-800">
                      <p className="font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Rate locked at submission
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        This is an instant account transfer. The rate will be locked
                        and the transfer will be completed immediately.
                      </p>
                    </div>

                    <Button
                      onClick={executeInternalTransfer}
                      disabled={
                        !internalFormData.from_currency ||
                        !internalFormData.to_currency ||
                        !internalFormData.amount ||
                        loading
                      }
                      className="w-full h-14 text-lg font-semibold bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Execute Transfer
                    </Button>
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-6 mt-6">
                    {/* Available Balance Display */}
                    {fromCurrency && (
                      <div className="bg-white border-2 border-gray-300 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            Available Balance ({fromCurrency}):
                          </span>
                          <span className="text-slate-900 font-bold">
                            {availableBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.fromCurrency}
                        </Label>
                        <Select
                          value={bankFormData.from_currency}
                          onValueChange={(value) => {
                            setBankFormData({
                              ...bankFormData,
                              from_currency: value,
                            });
                            setValidationErrors([]);
                          }}
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-red-600 transition-colors">
                            <SelectValue placeholder={t.selectCurrency} />
                          </SelectTrigger>
                          <SelectContent>
                            {getBankTransferCurrencies().map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="py-3 hover:bg-slate-50"
                              >
                                {renderCurrencyOption(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col items-center justify-center px-6 py-4">
                        <div className="w-12 h-12 bg-red-600 flex items-center justify-center mb-2">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-red-600 text-white px-3 py-1 text-sm font-medium">
                          {exchangeRate === 1 ? "1:1" : exchangeRate.toFixed(6)}
                        </div>
                        {liveRates.lastUpdated > 0 && exchangeRate !== 1 && (
                          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Estimated
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.toCurrency}
                        </Label>
                        <Select
                          value={bankFormData.to_currency}
                          onValueChange={(value) => {
                            setBankFormData({
                              ...bankFormData,
                              to_currency: value,
                            });
                            setValidationErrors([]);
                          }}
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-red-600 transition-colors">
                            <SelectValue placeholder={t.selectCurrency} />
                          </SelectTrigger>
                          <SelectContent>
                            {getBankTransferCurrencies().map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="py-3 hover:bg-slate-50"
                              >
                                {renderCurrencyOption(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          Amount
                        </Label>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={bankFormData.amount}
                          onChange={(e) => {
                            setBankFormData({
                              ...bankFormData,
                              amount: e.target.value,
                            });
                            setValidationErrors([]);
                          }}
                          placeholder="0.00"
                          className="h-12 text-lg border-slate-300 hover:border-red-600 focus:border-red-600 transition-colors"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          Fees
                        </Label>
                        <Input
                          value={
                            transferFee === 0
                              ? "0.00"
                              : transferFee.toFixed(2)
                          }
                          readOnly
                          className="h-12 text-lg font-semibold bg-white border-2 border-red-600 text-red-800"
                        />
                      </div>
                    </div>

                    {/* Total Debit and Estimated Credit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border-2 border-red-600 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          Total Debit
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {totalDebit.toFixed(2)}{" "}
                          <span className="text-sm">{fromCurrency || "—"}</span>
                        </p>
                      </div>
                      <div className="border-2 border-gray-300 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          Estimated Credit
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {estimatedAmount === 0
                            ? "0.00"
                            : estimatedAmount.toFixed(2)}{" "}
                          <span className="text-sm">
                            {bankFormData.to_currency || "—"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Rate info */}
                    <div className="bg-white border-2 border-gray-300 p-3 text-sm text-slate-800">
                      <p className="font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Estimated. Final amount confirmed when processed
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Bank transfers require approval. The final exchange rate and
                        amount will be confirmed during processing.
                      </p>
                    </div>

                    {/* Bank Details Form */}
                    <div className="space-y-4 p-6 bg-white border border-slate-300">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Beneficiary Bank Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            Bank Name *
                          </Label>
                          <Input
                            value={bankDetails.bank_name}
                            onChange={(e) => {
                              setBankDetails({
                                ...bankDetails,
                                bank_name: e.target.value,
                              });
                              setValidationErrors([]);
                            }}
                            placeholder="Enter bank name"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            Account Holder Name *
                          </Label>
                          <Input
                            value={bankDetails.account_holder_name}
                            onChange={(e) => {
                              setBankDetails({
                                ...bankDetails,
                                account_holder_name: e.target.value,
                              });
                              setValidationErrors([]);
                            }}
                            placeholder="Full name on account"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            Account Number *
                          </Label>
                          <Input
                            value={bankDetails.account_number}
                            onChange={(e) => {
                              setBankDetails({
                                ...bankDetails,
                                account_number: e.target.value,
                              });
                              setValidationErrors([]);
                            }}
                            placeholder="Account number"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            Routing Number
                          </Label>
                          <Input
                            value={bankDetails.routing_number}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                routing_number: e.target.value,
                              })
                            }
                            placeholder="Optional"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            SWIFT Code
                          </Label>
                          <Input
                            value={bankDetails.swift_code}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                swift_code: e.target.value,
                              })
                            }
                            placeholder="SWIFT/BIC code"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            IBAN
                          </Label>
                          <Input
                            value={bankDetails.iban}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                iban: e.target.value,
                              })
                            }
                            placeholder="International bank account number"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-slate-700">
                          Bank Address
                        </Label>
                        <Textarea
                          value={bankDetails.bank_address}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              bank_address: e.target.value,
                            })
                          }
                          placeholder="Bank branch address"
                          className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-slate-700">
                          Recipient Address
                        </Label>
                        <Textarea
                          value={bankDetails.recipient_address}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              recipient_address: e.target.value,
                            })
                          }
                          placeholder="Beneficiary address"
                          className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-slate-700">
                          Purpose of Transfer
                        </Label>
                        <Textarea
                          value={bankDetails.purpose_of_transfer}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              purpose_of_transfer: e.target.value,
                            })
                          }
                          placeholder="Purpose or description"
                          className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          rows={2}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={executeBankTransfer}
                      disabled={
                        !bankFormData.from_currency ||
                        !bankFormData.to_currency ||
                        !bankFormData.amount ||
                        !bankDetails.bank_name ||
                        !bankDetails.account_holder_name ||
                        !bankDetails.account_number ||
                        loading
                      }
                      className="w-full h-14 text-lg font-semibold bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Submit Transfer Request
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transfer History - Collapsible on Mobile */}
        <div className="w-full lg:w-96 flex-shrink-0 lg:block">
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowHistoryOnMobile(!showHistoryOnMobile)}
              className="w-full flex items-center justify-between"
            >
              <span>Transfer History ({transfers.length})</span>
              {showHistoryOnMobile ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div
            className={`${
              showHistoryOnMobile ? "block" : "hidden"
            } lg:block`}
          >
            <Card className="history-card h-full flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-xl font-bold text-slate-800">
                  Transfer History
                </CardTitle>
                <p className="text-slate-600 text-sm">
                  Recent transactions and transfers
                </p>
              </CardHeader>

              {/* Filters */}
              <div className="px-4 pb-4 space-y-3 border-b flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filterType}
                    onValueChange={(value) =>
                      setFilterType(value as TransferType)
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="internal">Account Transfer</SelectItem>
                      <SelectItem value="bank_transfer">Bank Wire</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterStatus}
                    onValueChange={(value) =>
                      setFilterStatus(value as TransferStatus | "all")
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CardContent className="p-4 flex-1 overflow-hidden">
                {filteredTransfers.length === 0 ? (
                  <div className="text-center py-8 flex-1 flex flex-col justify-center">
                    <p className="text-slate-500">
                      {searchQuery || filterStatus !== "all" || filterType !== "all"
                        ? "No transfers match your filters"
                        : "No transfers yet"}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {searchQuery || filterStatus !== "all" || filterType !== "all"
                        ? "Try adjusting your filters"
                        : "Your transfer history will appear here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 h-full overflow-y-auto custom-scrollbar pr-2">
                    {filteredTransfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="transfer-item p-4"
                        onClick={() => {
                          setSelectedTransfer(transfer);
                          setShowDetailsModal(true);
                        }}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800 text-sm">
                                {transfer.from_currency}
                              </span>
                              <ArrowLeftRight className="w-3 h-3 text-red-600" />
                              <span className="font-bold text-slate-800 text-sm">
                                {transfer.to_currency}
                              </span>
                              {transfer.transfer_type === "bank_transfer" && (
                                <Building2 className="w-3 h-3 text-blue-600" />
                              )}
                              {(currencies.find(
                                (c) => c.code === transfer.from_currency
                              )?.type === "crypto" ||
                                currencies.find(
                                  (c) => c.code === transfer.to_currency
                                )?.type === "crypto") && (
                                <Coins className="w-3 h-3 text-red-600" />
                              )}
                            </div>
                            <div className="text-xs text-slate-600">
                              <span className="font-medium text-red-600">
                                {Number(transfer.from_amount).toFixed(2)}
                              </span>
                              <span className="mx-1">→</span>
                              <span className="font-medium text-green-600">
                                {Number(transfer.to_amount).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(transfer.status)}
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">
                            {new Date(transfer.created_at).toLocaleDateString()}
                          </span>

                          {transfer.reference_number && (
                            <span className="text-slate-600 bg-slate-100 px-2 py-1 text-xs font-mono">
                              {transfer.reference_number}
                            </span>
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
      </div>

      <TransferDetailsModal />
      <ConfirmationModal />
    </div>
  );
}
