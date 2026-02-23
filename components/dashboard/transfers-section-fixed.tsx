"use client";
import { useState, useEffect } from "react";
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
  Check,
  Copy,
  FileText,
  Search,
  Filter,
  AlertCircle,
  Info,
  Wallet,
  Send,
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
type TransferType = "internal" | "bank_transfer" | "crypto_internal" | "crypto_external" | "all";

interface CryptoWalletDetails {
  wallet_address: string;
  network: string;
  memo_tag: string;
}

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

  const { language } = useLanguage();

  const t = getTranslations(language);

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

  const [cryptoInternalFormData, setCryptoInternalFormData] = useState({
    from_currency: "",
    to_currency: "",
    amount: "",
  });

  const [cryptoExternalFormData, setCryptoExternalFormData] = useState({
    from_currency: "",
    amount: "",
  });

  const [cryptoWalletDetails, setCryptoWalletDetails] = useState<CryptoWalletDetails>({
    wallet_address: "",
    network: "",
    memo_tag: "",
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

  const [showTransferSuccessModal, setShowTransferSuccessModal] = useState(false);
  const [transferSuccessData, setTransferSuccessData] = useState<{
    transferType: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    fee: number;
    referenceNumber: string;
  } | null>(null);
  const [processingTransfer, setProcessingTransfer] = useState(false);

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
    const getFormData = () => {
      switch (activeTab) {
        case "internal": return internalFormData;
        case "bank": return bankFormData;
        case "crypto_internal": return cryptoInternalFormData;
        case "crypto_external": return { ...cryptoExternalFormData, to_currency: cryptoExternalFormData.from_currency };
        default: return internalFormData;
      }
    };
    const formData = getFormData();
    if (
      formData.from_currency &&
      formData.amount &&
      liveRates.lastUpdated > 0
    ) {
      calculateRealTimeExchange();
    }
  }, [internalFormData, bankFormData, cryptoInternalFormData, cryptoExternalFormData, liveRates, activeTab]);

  const calculateRealTimeExchange = () => {
    const getCurrentFormData = () => {
      switch (activeTab) {
        case "internal": return internalFormData;
        case "bank": return bankFormData;
        case "crypto_internal": return cryptoInternalFormData;
        case "crypto_external": return { ...cryptoExternalFormData, to_currency: cryptoExternalFormData.from_currency };
        default: return internalFormData;
      }
    };
    const currentFormData = getCurrentFormData();
    const fromCurrency = currentFormData.from_currency.toUpperCase();
    const toCurrency = (currentFormData.to_currency || fromCurrency).toUpperCase();
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
    } else if (activeTab === "crypto_internal") {
      return amount * 0.005;
    } else if (activeTab === "crypto_external") {
      return amount * 0.015;
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

  const getCryptoCurrencies = () => {
    return [
      { code: "BTC", name: "Bitcoin", symbol: "₿", type: "crypto" as const },
      { code: "ETH", name: "Ethereum", symbol: "Ξ", type: "crypto" as const },
      { code: "USDT", name: "Tether USD", symbol: "₮", type: "crypto" as const },
    ];
  };

  const getFiatCurrencies = () => {
    return currencies.filter((c) =>
      c.type === "fiat" && ["USD", "EUR", "CAD"].includes(c.code)
    );
  };

  const getCryptoBalanceColumn = (currencyCode: string): string => {
    const columnMap: { [key: string]: string } = {
      BTC: "btc_balance",
      ETH: "eth_balance",
      USDT: "usdt_balance",
    };
    return columnMap[currencyCode.toUpperCase()] || "btc_balance";
  };

  const isCryptoFromNewTable = (currencyCode: string): boolean => {
    return ["BTC", "ETH", "USDT"].includes(currencyCode.toUpperCase());
  };

  const fetchTransfers = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_transfers")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransfers(data || []);
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
      BTC: "btc",
      ETH: "eth",
      USDT: "usdt",
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
      errors.push(t.allFieldsRequired);
    }

    if (fromCurrency === toCurrency) {
      errors.push(t.currenciesMustBeDifferent);
    }

    if (amount <= 0) {
      errors.push(t.amountMustBeGreaterThanZero);
    }

    const fromBalanceKey = getBalanceKey(fromCurrency);
    const currentFromBalance = balances[fromBalanceKey] || 0;

    if (currentFromBalance < amount + transferFee) {
      const availableFormatted = currentFromBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const requiredFormatted = (amount + transferFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      errors.push(
        `Insufficient ${fromCurrency} balance. Your available balance is ${availableFormatted} ${fromCurrency}, but this transfer requires ${requiredFormatted} ${fromCurrency} (including fees).`
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
      errors.push(t.allCurrencyAmountFieldsRequired);
    }

    if (fromCurrency === toCurrency) {
      errors.push(t.currenciesMustBeDifferent);
    }

    if (amount <= 0) {
      errors.push(t.amountMustBeGreaterThanZero);
    }

    const fromBalanceKey = getBalanceKey(fromCurrency);
    const currentFromBalance = balances[fromBalanceKey] || 0;

    if (currentFromBalance < amount + transferFee) {
      const availableFormatted = currentFromBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const requiredFormatted = (amount + transferFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      errors.push(
        `Insufficient ${fromCurrency} balance. Your available balance is ${availableFormatted} ${fromCurrency}, but this transfer requires ${requiredFormatted} ${fromCurrency} (including fees).`
      );
    }

    if (!bankDetails.bank_name.trim()) {
      errors.push(t.bankNameRequired);
    }

    if (!bankDetails.account_holder_name.trim()) {
      errors.push(t.accountHolderNameRequired);
    }

    if (!bankDetails.account_number.trim()) {
      errors.push(t.accountNumberRequired);
    }

    return errors;
  };

  const createTransfer = async (
    transferType: "internal" | "bank_transfer" | "crypto_internal" | "crypto_external",
    transferData: {
      fromCurrency: string;
      toCurrency: string;
      fromAmount: number;
      toAmount: number;
      fee: number;
      exchangeRate?: number;
      bankDetails?: {
        bankName: string;
        accountNumber: string;
        beneficiaryName: string;
        routingNumber?: string;
        swiftCode?: string;
        iban?: string;
        bankAddress?: string;
        recipientAddress?: string;
        purposeOfTransfer?: string;
        beneficiaryCountry?: string;
        beneficiaryBankCountry?: string;
        accountType?: string;
        intermediaryBankName?: string;
        intermediarySwift?: string;
        intermediaryIban?: string;
      };
      cryptoDetails?: {
        walletAddress: string;
        network: string;
        memoTag?: string;
      };
    }
  ): Promise<boolean> => {
    setProcessingTransfer(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-transfer-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: userProfile.id,
            email: userProfile.email,
            fullName: userProfile.full_name,
            clientId: userProfile.client_id,
            transferType,
            transferData,
            ipAddress: null,
            userAgent: navigator.userAgent,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setTransferSuccessData({
          transferType,
          fromCurrency: transferData.fromCurrency,
          toCurrency: transferData.toCurrency,
          fromAmount: transferData.fromAmount,
          toAmount: transferData.toAmount,
          fee: transferData.fee,
          referenceNumber: data.transfer.referenceNumber,
        });
        setShowTransferSuccessModal(true);
        fetchTransfers();
        return true;
      } else {
        throw new Error(data.error || "Failed to create transfer");
      }
    } catch (error: any) {
      console.error("Error creating transfer:", error);
      setValidationErrors([`Failed to create transfer: ${error.message}`]);
      return false;
    } finally {
      setProcessingTransfer(false);
    }
  };

  const executeInternalTransfer = async () => {
    if (!userProfile?.id) return;

    const errors = validateInternalTransfer();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const amount = Number.parseFloat(internalFormData.amount);
    const fromCurrency = internalFormData.from_currency.toUpperCase();
    const toCurrency = internalFormData.to_currency.toUpperCase();
    const toAmount = estimatedAmount;

    const success = await createTransfer("internal", {
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount,
      fee: transferFee,
      exchangeRate: exchangeRate,
    });

    if (success) {
      setInternalFormData({ from_currency: "", to_currency: "", amount: "" });
      setExchangeRate(1);
      setEstimatedAmount(0);
      setTransferFee(0);
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

    const amount = Number.parseFloat(bankFormData.amount);
    const fromCurrency = bankFormData.from_currency.toUpperCase();
    const toCurrency = bankFormData.to_currency.toUpperCase();
    const toAmount = estimatedAmount;

    const success = await createTransfer("bank_transfer", {
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount,
      fee: transferFee,
      exchangeRate: exchangeRate,
      bankDetails: {
        bankName: bankDetails.bank_name,
        accountNumber: bankDetails.account_number,
        beneficiaryName: bankDetails.account_holder_name,
        routingNumber: bankDetails.routing_number,
        swiftCode: bankDetails.swift_code,
        iban: bankDetails.iban,
        bankAddress: bankDetails.bank_address,
        recipientAddress: bankDetails.recipient_address,
        purposeOfTransfer: bankDetails.purpose_of_transfer,
        beneficiaryCountry: bankDetails.beneficiary_country,
        beneficiaryBankCountry: bankDetails.beneficiary_bank_country,
        accountType: bankDetails.account_type,
        intermediaryBankName: bankDetails.intermediary_bank_name,
        intermediarySwift: bankDetails.intermediary_swift,
        intermediaryIban: bankDetails.intermediary_iban,
      },
    });

    if (success) {
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
    }
  };

  const validateCryptoInternalTransfer = (): string[] => {
    const errors: string[] = [];
    const amount = Number.parseFloat(cryptoInternalFormData.amount);
    const fromCurrency = cryptoInternalFormData.from_currency.toUpperCase();
    const toCurrency = cryptoInternalFormData.to_currency.toUpperCase();

    if (!fromCurrency || !toCurrency || !cryptoInternalFormData.amount) {
      errors.push(t.allFieldsRequired || "All fields are required");
    }

    if (fromCurrency === toCurrency) {
      errors.push(t.currenciesMustBeDifferent || "Currencies must be different");
    }

    if (amount <= 0) {
      errors.push(t.amountMustBeGreaterThanZero || "Amount must be greater than zero");
    }

    const fromBalanceKey = getBalanceKey(fromCurrency);
    const currentFromBalance = balances[fromBalanceKey] || 0;

    if (currentFromBalance < amount + transferFee) {
      const isCrypto = ["BTC", "ETH", "USDT", "ADA", "DOT", "LINK", "XRP", "SOL"].includes(fromCurrency);
      const decimals = isCrypto ? 8 : 2;
      const availableFormatted = currentFromBalance.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      const requiredFormatted = (amount + transferFee).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      errors.push(
        `Insufficient ${fromCurrency} balance. Your available balance is ${availableFormatted} ${fromCurrency}, but this transfer requires ${requiredFormatted} ${fromCurrency} (including fees).`
      );
    }

    return errors;
  };

  const validateCryptoExternalTransfer = (): string[] => {
    const errors: string[] = [];
    const amount = Number.parseFloat(cryptoExternalFormData.amount);
    const fromCurrency = cryptoExternalFormData.from_currency.toUpperCase();

    if (!fromCurrency || !cryptoExternalFormData.amount) {
      errors.push(t.allFieldsRequired || "All fields are required");
    }

    if (amount <= 0) {
      errors.push(t.amountMustBeGreaterThanZero || "Amount must be greater than zero");
    }

    const fromBalanceKey = getBalanceKey(fromCurrency);
    const currentFromBalance = balances[fromBalanceKey] || 0;

    if (currentFromBalance < amount + transferFee) {
      const isCrypto = ["BTC", "ETH", "USDT", "ADA", "DOT", "LINK", "XRP", "SOL"].includes(fromCurrency);
      const decimals = isCrypto ? 8 : 2;
      const availableFormatted = currentFromBalance.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      const requiredFormatted = (amount + transferFee).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      errors.push(
        `Insufficient ${fromCurrency} balance. Your available balance is ${availableFormatted} ${fromCurrency}, but this transfer requires ${requiredFormatted} ${fromCurrency} (including fees).`
      );
    }

    if (!cryptoWalletDetails.wallet_address.trim()) {
      errors.push("Wallet address is required");
    }

    if (!cryptoWalletDetails.network.trim()) {
      errors.push("Network is required");
    }

    return errors;
  };

  const executeCryptoInternalTransfer = async () => {
    if (!userProfile?.id) return;

    const errors = validateCryptoInternalTransfer();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const amount = Number.parseFloat(cryptoInternalFormData.amount);
    const fromCurrency = cryptoInternalFormData.from_currency.toUpperCase();
    const toCurrency = cryptoInternalFormData.to_currency.toUpperCase();
    const toAmount = estimatedAmount;

    const success = await createTransfer("crypto_internal", {
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount,
      fee: transferFee,
      exchangeRate: exchangeRate,
    });

    if (success) {
      setCryptoInternalFormData({ from_currency: "", to_currency: "", amount: "" });
      setExchangeRate(1);
      setEstimatedAmount(0);
      setTransferFee(0);
    }
  };

  const executeCryptoExternalTransfer = async () => {
    if (!userProfile?.id) return;

    const errors = validateCryptoExternalTransfer();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const amount = Number.parseFloat(cryptoExternalFormData.amount);
    const fromCurrency = cryptoExternalFormData.from_currency.toUpperCase();

    const success = await createTransfer("crypto_external", {
      fromCurrency,
      toCurrency: fromCurrency,
      fromAmount: amount,
      toAmount: amount,
      fee: transferFee,
      exchangeRate: 1,
      cryptoDetails: {
        walletAddress: cryptoWalletDetails.wallet_address,
        network: cryptoWalletDetails.network,
        memoTag: cryptoWalletDetails.memo_tag,
      },
    });

    if (success) {
      setCryptoExternalFormData({ from_currency: "", amount: "" });
      setCryptoWalletDetails({ wallet_address: "", network: "", memo_tag: "" });
      setExchangeRate(1);
      setEstimatedAmount(0);
      setTransferFee(0);
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
        label: t.pendingReview,
        icon: Clock,
      },
      approved: {
        color: "bg-white text-slate-700 border-2 border-gray-300",
        label: t.approved,
        icon: CheckCircle,
      },
      completed: {
        color: "bg-white text-slate-700 border-2 border-gray-300",
        label: t.completed,
        icon: CheckCircle,
      },
      rejected: {
        color: "bg-white text-red-600 border-2 border-red-600",
        label: t.rejected,
        icon: XCircle,
      },
      processing: {
        color: "bg-white text-slate-700 border-2 border-gray-300",
        label: t.processing,
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
          {currency.code} • {currency.type === "crypto" ? t.crypto : t.fiat}
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
              {t.transferDetails}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Reference Number - Prominent */}
            <div className="bg-white border-2 border-red-600 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 mb-1 font-medium">
                    {t.referenceNumber}
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
                  {copiedField === "reference" ? t.copied : t.copy}
                </Button>
              </div>
            </div>

            {/* Status and Timeline */}
            <div className="border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                {t.statusAndTimeline}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                {getStatusBadge(selectedTransfer.status)}
                {isInternal && (
                  <Badge className="bg-white text-slate-700 border-2 border-gray-300">
                    {t.rateLockedAtSubmission}
                  </Badge>
                )}
                {!isInternal && isPending && (
                  <Badge className="bg-white text-slate-700 border-2 border-gray-300">
                    {t.estimatedFinalAmountConfirmed}
                  </Badge>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {t.submitted}
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
                        {t.processed}
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
                        {t.processing}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t.awaitingApproval}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Details */}
            <div className="border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                {t.transferInformation}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">{t.fromCurrencyLabel}</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.from_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">{t.toCurrencyLabel}</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.to_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">{t.debitAmount}</p>
                  <p className="text-sm font-medium text-red-600">
                    {selectedTransfer.from_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}{" "}
                    {selectedTransfer.from_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">{t.creditAmount}</p>
                  <p className="text-sm font-medium text-green-600">
                    {selectedTransfer.to_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 8,
                    })}{" "}
                    {selectedTransfer.to_currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">{t.exchangeRate}</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.exchange_rate.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">{t.fees}</p>
                  <p className="text-sm font-medium">
                    {selectedTransfer.fee_amount.toFixed(2)}{" "}
                    {selectedTransfer.fee_currency || selectedTransfer.from_currency}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-600 mb-1">{t.totalDebit}</p>
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
            {selectedTransfer.transfer_type === "bank_transfer" && selectedTransfer.bank_name && (
              <div className="border-2 border-gray-300 p-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  {t.bankDetails}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">{t.bankName}</p>
                    <p className="text-sm font-medium">
                      {selectedTransfer.bank_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">
                      {t.accountHolder}
                    </p>
                    <p className="text-sm font-medium">
                      {selectedTransfer.account_holder_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">
                      {t.accountNumber}
                    </p>
                    <p className="text-sm font-medium font-mono">
                      {maskAccountNumber(
                        selectedTransfer.account_number
                      )}
                    </p>
                  </div>
                  {selectedTransfer.swift_code && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1">{t.swiftCode}</p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.swift_code}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.iban && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">{t.iban}</p>
                      <p className="text-sm font-medium font-mono">
                        {maskIban(selectedTransfer.iban)}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.routing_number && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        {t.routingNumber}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.routing_number}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.purpose_of_transfer && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">{t.purpose}</p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.purpose_of_transfer}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.bank_address && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">
                        {t.bankAddress}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.bank_address}
                      </p>
                    </div>
                  )}
                  {selectedTransfer.recipient_address && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 mb-1">
                        {t.recipientAddress}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTransfer.recipient_address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Crypto Details - Only for crypto external transfers */}
            {selectedTransfer.transfer_type === "crypto_external" && selectedTransfer.wallet_address && (
              <div className="border-2 border-gray-300 p-4 bg-white">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Destination Wallet Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Wallet Address</p>
                    <p className="text-sm font-medium font-mono break-all">
                      {selectedTransfer.wallet_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Network</p>
                    <p className="text-sm font-medium">
                      {selectedTransfer.network}
                    </p>
                  </div>
                  {selectedTransfer.memo_tag && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Memo / Tag</p>
                      <p className="text-sm font-medium font-mono">
                        {selectedTransfer.memo_tag}
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
                  {t.additionalInformation}
                </h3>
                {selectedTransfer.status_reason && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-600 mb-1">{t.statusReason}</p>
                    <p className="text-sm text-slate-800">
                      {selectedTransfer.status_reason}
                    </p>
                  </div>
                )}
                {selectedTransfer.admin_notes && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">{t.notes}</p>
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
              {t.close}
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
        <DialogContent className="max-w-md p-4 sm:p-5">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {t.transferReceipt}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-white border border-red-600 p-2 sm:p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">{t.referenceNumber}</p>
                <p className="text-sm sm:text-base font-bold text-slate-800">
                  {confirmationData.reference_number}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(confirmationData.reference_number, "confirmation")}
                className="text-slate-700 h-8 px-2"
              >
                {copiedField === "confirmation" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="border border-slate-200 p-2 sm:p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-600">{t.status}</p>
                  <div className="mt-0.5">{getStatusBadge(confirmationData.status)}</div>
                </div>
                <div>
                  <p className="text-slate-600">{t.type}</p>
                  <p className="font-medium">
                    {confirmationData.transfer_type === "internal" ? t.accountTransfer : t.bankTransfer}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600">{t.from}</p>
                  <p className="font-medium">{confirmationData.from_currency}</p>
                </div>
                <div>
                  <p className="text-slate-600">{t.to}</p>
                  <p className="font-medium">{confirmationData.to_currency}</p>
                </div>
                <div>
                  <p className="text-slate-600">{t.amount}</p>
                  <p className="font-medium">{confirmationData.from_amount.toFixed(2)} {confirmationData.from_currency}</p>
                </div>
                <div>
                  <p className="text-slate-600">{t.fees}</p>
                  <p className="font-medium">{confirmationData.fee_amount.toFixed(2)} {confirmationData.from_currency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                <div className="bg-red-50 p-2 border border-red-200">
                  <p className="text-xs text-slate-600">{t.totalDebit}</p>
                  <p className="text-sm sm:text-base font-bold text-red-600">
                    {confirmationData.total_debit.toFixed(2)} {confirmationData.from_currency}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-200">
                  <p className="text-xs text-slate-600">{t.estimatedCredit}</p>
                  <p className="text-sm sm:text-base font-bold text-slate-800">
                    {confirmationData.to_amount.toFixed(2)} {confirmationData.to_currency}
                  </p>
                </div>
              </div>
            </div>

            {confirmationData.transfer_type === "bank_transfer" && (
              <div className="bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800">
                <p className="font-medium">{t.transferPendingReview}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t mt-3">
            <Button onClick={() => setShowConfirmationModal(false)} size="sm" className="h-8">
              {t.done}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const getTransferTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      internal: "Internal Currency Exchange",
      bank_transfer: "International Bank Wire Transfer",
      crypto_internal: "Cryptocurrency Exchange",
      crypto_external: "External Cryptocurrency Withdrawal",
    };
    return labels[type] || "Transfer";
  };

  const formatVerificationAmount = (amount: number, currency: string): string => {
    const cryptoCurrencies = ["BTC", "ETH", "ADA", "DOT", "LINK", "XRP", "SOL", "AVAX", "MATIC", "ATOM"];
    if (cryptoCurrencies.includes(currency?.toUpperCase())) {
      return `${amount.toFixed(8)} ${currency}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
  };

  const TransferSuccessModal = () => {
    if (!transferSuccessData) return null;

    return (
      <Dialog open={showTransferSuccessModal} onOpenChange={setShowTransferSuccessModal}>
        <DialogContent className="max-w-lg p-5 sm:p-6">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-green-700">
              <CheckCircle className="w-6 h-6" />
              Transfer Submitted Successfully
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-300 p-4 rounded">
              <p className="text-green-800 font-medium mb-2">
                Your transfer has been submitted and is now being processed.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-800 mb-3">Transfer Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <p className="text-slate-500">Reference Number</p>
                  <p className="font-mono font-semibold text-slate-800">{transferSuccessData.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500">Transfer Type</p>
                  <p className="font-medium text-slate-800">{getTransferTypeLabel(transferSuccessData.transferType)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-medium text-amber-600">Pending</p>
                </div>
                <div>
                  <p className="text-slate-500">Amount</p>
                  <p className="font-medium text-slate-800">
                    {formatVerificationAmount(transferSuccessData.fromAmount, transferSuccessData.fromCurrency)}
                  </p>
                </div>
                {transferSuccessData.toCurrency !== transferSuccessData.fromCurrency && (
                  <div>
                    <p className="text-slate-500">You Will Receive</p>
                    <p className="font-medium text-slate-800">
                      {formatVerificationAmount(transferSuccessData.toAmount, transferSuccessData.toCurrency)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Fee</p>
                  <p className="font-medium text-slate-800">
                    {formatVerificationAmount(transferSuccessData.fee, transferSuccessData.fromCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center">
              <p>You can track your transfer status in the Transfer History section below.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button
              onClick={() => setShowTransferSuccessModal(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center bg-white p-6 border border-red-600">
          <div className="text-red-600 text-lg font-semibold">{t.error}</div>
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
          background: white;
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

      {/* Main Layout - Fixed Height */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden px-4 md:px-6 pb-6 gap-6 pt-6">
        {/* Main Content - Scrollable */}
        <div className="flex-1 lg:flex-1 overflow-y-auto custom-scrollbar min-h-0 mobile-form-priority">
          <div className="space-y-6 pr-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-white border-2 border-red-600 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-600 mb-2">
                      {t.pleaseCorrectFollowingErrors}
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
                  {t.createTransfer}
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
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-1">
                    <TabsTrigger
                      value="internal"
                      className="flex items-center gap-2 text-xs sm:text-sm py-2"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.accountTransfer || "Fiat Transfer"}</span>
                      <span className="sm:hidden">Fiat</span>
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                      <Building2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.bankWire || "Bank Wire"}</span>
                      <span className="sm:hidden">Bank</span>
                    </TabsTrigger>
                    <TabsTrigger value="crypto_internal" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                      <Coins className="w-4 h-4" />
                      <span className="hidden sm:inline">Crypto Exchange</span>
                      <span className="sm:hidden">Crypto</span>
                    </TabsTrigger>
                    <TabsTrigger value="crypto_external" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Crypto Withdraw</span>
                      <span className="sm:hidden">Withdraw</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="internal" className="space-y-6 mt-6">
                    {/* Available Balance Display */}
                    {fromCurrency && (
                      <div className="bg-white border-2 border-gray-300 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            {t.availableBalance.replace('{currency}', fromCurrency)}:
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
                                className="py-3 hover:bg-white"
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
                                className="py-3 hover:bg-white"
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
                          {t.amount}
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
                          placeholder={t.zeroDecimalPlaceholder}
                          className="h-12 text-lg border-slate-300 hover:border-red-600 focus:border-red-600 transition-colors"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.fees}
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
                          {t.totalDebit}
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {totalDebit.toFixed(2)}{" "}
                          <span className="text-sm">{fromCurrency || "—"}</span>
                        </p>
                      </div>
                      <div className="border-2 border-gray-300 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          {t.estimatedCredit}
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {estimatedAmount === 0
                            ? t.zeroDecimalPlaceholder
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
                        {t.rateLockedAtSubmission}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {t.instantTransferInfo}
                      </p>
                    </div>

                    <Button
                      onClick={executeInternalTransfer}
                      disabled={
                        !internalFormData.from_currency ||
                        !internalFormData.to_currency ||
                        !internalFormData.amount ||
                        loading ||
                        processingTransfer
                      }
                      className="w-full h-14 text-lg font-semibold bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {processingTransfer ? "Processing..." : t.executeTransfer}
                    </Button>

                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-3">
                      <h4 className="font-semibold text-slate-700 text-sm">Internal Account Transfer Terms and Conditions</h4>
                      <p>
                        By initiating this internal currency exchange transaction, you acknowledge and agree to the following terms pursuant to applicable financial regulations and our Terms of Service:
                      </p>
                      <p>
                        <strong>1. Exchange Rate Disclosure:</strong> The exchange rate displayed is indicative and subject to market fluctuations. The final rate applied to your transaction will be determined at the time of execution and may differ from the quoted rate. All exchange rates include a markup that constitutes part of our service fee structure.
                      </p>
                      <p>
                        <strong>2. Transaction Finality:</strong> Once executed, internal currency exchange transactions are final and irrevocable. No cancellations, reversals, or modifications shall be permitted after confirmation. You bear sole responsibility for verifying all transaction details prior to submission.
                      </p>
                      <p>
                        <strong>3. Regulatory Compliance:</strong> This transaction is subject to Anti-Money Laundering (AML) regulations, Know Your Customer (KYC) requirements, and applicable sanctions screening under the Bank Secrecy Act, EU Anti-Money Laundering Directives, and other relevant jurisdictional requirements. We reserve the right to delay, block, or report any transaction that triggers compliance concerns.
                      </p>
                      <p>
                        <strong>4. Tax Obligations:</strong> Currency exchange transactions may have tax implications in your jurisdiction. You are solely responsible for determining and fulfilling any tax reporting or payment obligations arising from this transaction. We recommend consulting a qualified tax professional.
                      </p>
                      <p>
                        <strong>5. Service Availability:</strong> We reserve the right to suspend, modify, or discontinue currency exchange services without prior notice for maintenance, compliance, or operational reasons. We shall not be liable for any losses resulting from service interruptions.
                      </p>
                      <p className="text-slate-500 italic">
                        This service is provided in accordance with our Terms of Service and Privacy Policy. By proceeding, you confirm that you have read, understood, and agree to be bound by these terms.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-6 mt-6">
                    {/* Available Balance Display */}
                    {fromCurrency && (
                      <div className="bg-white border-2 border-gray-300 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            {t.availableBalance.replace('{currency}', fromCurrency)}:
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
                                className="py-3 hover:bg-white"
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
                                className="py-3 hover:bg-white"
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
                          {t.amount}
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
                          placeholder={t.zeroDecimalPlaceholder}
                          className="h-12 text-lg border-slate-300 hover:border-red-600 focus:border-red-600 transition-colors"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.fees}
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
                          {t.totalDebit}
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {totalDebit.toFixed(2)}{" "}
                          <span className="text-sm">{fromCurrency || "—"}</span>
                        </p>
                      </div>
                      <div className="border-2 border-gray-300 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          {t.estimatedCredit}
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {estimatedAmount === 0
                            ? t.zeroDecimalPlaceholder
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
                        {t.estimatedFinalAmountConfirmed}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {t.bankTransferApprovalInfo}
                      </p>
                    </div>

                    {/* Bank Details Form */}
                    <div className="space-y-4 p-6 bg-white border border-slate-300">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        {t.beneficiaryBankDetails}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.bankName} *
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
                            placeholder={t.enterBankName}
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.accountHolderName} *
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
                            placeholder={t.fullNameOnAccount}
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.accountNumber} *
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
                            placeholder={t.accountNumberPlaceholder}
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.routingNumber}
                          </Label>
                          <Input
                            value={bankDetails.routing_number}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                routing_number: e.target.value,
                              })
                            }
                            placeholder={t.optional}
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.swiftCode}
                          </Label>
                          <Input
                            value={bankDetails.swift_code}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                swift_code: e.target.value,
                              })
                            }
                            placeholder={t.swiftBicCode}
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.iban}
                          </Label>
                          <Input
                            value={bankDetails.iban}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                iban: e.target.value,
                              })
                            }
                            placeholder={t.internationalBankAccountNumber}
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-slate-700">
                          {t.bankAddress}
                        </Label>
                        <Textarea
                          value={bankDetails.bank_address}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              bank_address: e.target.value,
                            })
                          }
                          placeholder={t.bankBranchAddress}
                          className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-slate-700">
                          {t.recipientAddress}
                        </Label>
                        <Textarea
                          value={bankDetails.recipient_address}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              recipient_address: e.target.value,
                            })
                          }
                          placeholder={t.beneficiaryAddress}
                          className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-slate-700">
                          {t.purposeOfTransfer}
                        </Label>
                        <Textarea
                          value={bankDetails.purpose_of_transfer}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              purpose_of_transfer: e.target.value,
                            })
                          }
                          placeholder={t.purposeOrDescription}
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
                        loading ||
                        processingTransfer
                      }
                      className="w-full h-14 text-lg font-semibold bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {processingTransfer ? "Processing..." : t.submitTransferRequest}
                    </Button>

                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-3">
                      <h4 className="font-semibold text-slate-700 text-sm">Bank Wire Transfer Terms and Conditions</h4>
                      <p>
                        By submitting this bank wire transfer request, you acknowledge and agree to the following legally binding terms in accordance with international banking regulations and applicable law:
                      </p>
                      <p>
                        <strong>1. Transfer Authorization:</strong> You hereby authorize the initiation of an international wire transfer to the designated beneficiary account. You represent and warrant that you are the lawful owner of the funds being transferred and that this transaction does not violate any applicable laws, regulations, or sanctions.
                      </p>
                      <p>
                        <strong>2. SWIFT/BIC and IBAN Accuracy:</strong> You bear sole responsibility for the accuracy of all banking details provided, including but not limited to SWIFT/BIC codes, IBAN numbers, account numbers, and beneficiary information. Errors in banking details may result in delayed, returned, or lost funds, and we shall bear no liability for losses arising from incorrect information provided by you.
                      </p>
                      <p>
                        <strong>3. Processing Time and Intermediary Banks:</strong> International wire transfers typically require 1-5 business days for processing. Transfers may be routed through correspondent or intermediary banks, each of which may deduct fees from the transferred amount. Settlement times may vary based on destination country banking infrastructure, time zones, and local holidays.
                      </p>
                      <p>
                        <strong>4. Fees and Charges:</strong> Wire transfer fees include our service fee and may include additional charges imposed by correspondent banks, intermediary banks, and the beneficiary bank. Total fees deducted from the transfer amount may exceed the quoted estimate. You agree to bear all such fees and charges.
                      </p>
                      <p>
                        <strong>5. AML/CFT Compliance:</strong> This transaction is subject to Anti-Money Laundering (AML), Combating the Financing of Terrorism (CFT), and sanctions compliance requirements under the Financial Action Task Force (FATF) recommendations, EU Anti-Money Laundering Directives, the USA PATRIOT Act, and applicable local regulations. We may be required to report certain transactions to relevant authorities.
                      </p>
                      <p>
                        <strong>6. Transaction Limits and Review:</strong> Wire transfers exceeding certain thresholds may be subject to enhanced due diligence and manual review. We reserve the right to request additional documentation, delay processing, or decline transactions that fail to meet our compliance requirements.
                      </p>
                      <p>
                        <strong>7. Cancellation and Recall:</strong> Once a wire transfer has been initiated, cancellation or recall may not be possible. If a recall is requested and successful, recall fees will apply. We do not guarantee the success of any recall attempt.
                      </p>
                      <p>
                        <strong>8. Cross-Border Regulations:</strong> International transfers are subject to the laws and regulations of both the originating and destination jurisdictions. Some countries impose restrictions on foreign currency transfers. You are responsible for ensuring compliance with all applicable cross-border transfer regulations.
                      </p>
                      <p className="text-slate-500 italic">
                        By proceeding with this wire transfer, you confirm that all information provided is accurate, the funds are from legitimate sources, and you have read and agreed to our Terms of Service, Privacy Policy, and these Wire Transfer Terms and Conditions.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="crypto_internal" className="space-y-6 mt-6">
                    {cryptoInternalFormData.from_currency && (
                      <div className="bg-white border-2 border-gray-300 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            Available {cryptoInternalFormData.from_currency}:
                          </span>
                          <span className="text-slate-900 font-bold">
                            {(balances[getBalanceKey(cryptoInternalFormData.from_currency)] || 0).toFixed(8)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          From Crypto
                        </Label>
                        <Select
                          value={cryptoInternalFormData.from_currency}
                          onValueChange={(value) => {
                            setCryptoInternalFormData({
                              ...cryptoInternalFormData,
                              from_currency: value,
                            });
                            setValidationErrors([]);
                          }}
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-red-600 transition-colors">
                            <SelectValue placeholder="Select crypto" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCryptoCurrencies().map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="py-3 hover:bg-white"
                              >
                                {renderCurrencyOption(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col items-center justify-center px-6 py-4">
                        <div className="w-12 h-12 bg-red-600 flex items-center justify-center mb-2">
                          <Coins className="w-6 h-6 text-white" />
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
                          To Crypto
                        </Label>
                        <Select
                          value={cryptoInternalFormData.to_currency}
                          onValueChange={(value) => {
                            setCryptoInternalFormData({
                              ...cryptoInternalFormData,
                              to_currency: value,
                            });
                            setValidationErrors([]);
                          }}
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-red-600 transition-colors">
                            <SelectValue placeholder="Select crypto" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCryptoCurrencies().map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="py-3 hover:bg-white"
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
                          {t.amount}
                        </Label>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={cryptoInternalFormData.amount}
                          onChange={(e) => {
                            setCryptoInternalFormData({
                              ...cryptoInternalFormData,
                              amount: e.target.value,
                            });
                            setValidationErrors([]);
                          }}
                          placeholder="0.00000000"
                          className="h-12 text-lg border-slate-300 hover:border-red-600 focus:border-red-600 transition-colors"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.fees}
                        </Label>
                        <Input
                          value={transferFee === 0 ? "0.00000000" : transferFee.toFixed(8)}
                          readOnly
                          className="h-12 text-lg font-semibold bg-white border-2 border-red-600 text-red-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border-2 border-red-600 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          {t.totalDebit}
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {(Number(cryptoInternalFormData.amount || 0) + transferFee).toFixed(8)}{" "}
                          <span className="text-sm">{cryptoInternalFormData.from_currency || "—"}</span>
                        </p>
                      </div>
                      <div className="border-2 border-gray-300 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          {t.estimatedCredit}
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {estimatedAmount === 0 ? "0.00000000" : estimatedAmount.toFixed(8)}{" "}
                          <span className="text-sm">{cryptoInternalFormData.to_currency || "—"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-gray-300 p-3 text-sm text-slate-800">
                      <p className="font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Instant Crypto Exchange
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Exchange between cryptocurrencies instantly at live market rates. Rate is locked at submission.
                      </p>
                    </div>

                    <Button
                      onClick={executeCryptoInternalTransfer}
                      disabled={
                        !cryptoInternalFormData.from_currency ||
                        !cryptoInternalFormData.to_currency ||
                        !cryptoInternalFormData.amount ||
                        loading ||
                        processingTransfer
                      }
                      className="w-full h-14 text-lg font-semibold bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {processingTransfer ? "Processing..." : "Exchange Crypto"}
                    </Button>

                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-3">
                      <h4 className="font-semibold text-slate-700 text-sm">Cryptocurrency Exchange Terms and Risk Disclosure</h4>
                      <p>
                        By executing this cryptocurrency exchange transaction, you acknowledge that you have read, understood, and agree to the following terms, conditions, and risk disclosures:
                      </p>
                      <p>
                        <strong>1. Market Volatility Risk:</strong> Cryptocurrency markets are highly volatile. The value of digital assets can fluctuate significantly within short periods. The exchange rate at which your transaction is executed may differ materially from rates observed at other times. Past performance is not indicative of future results.
                      </p>
                      <p>
                        <strong>2. Exchange Rate Execution:</strong> Exchange rates are determined by real-time market conditions at the moment of execution. While we strive to provide competitive rates, we do not guarantee the best available market rate. A spread or markup is applied to all exchange transactions as part of our fee structure.
                      </p>
                      <p>
                        <strong>3. Transaction Finality:</strong> Cryptocurrency exchange transactions executed through this platform are final and irreversible. Once confirmed, no cancellations, reversals, or modifications are possible. You are solely responsible for reviewing all transaction details before confirmation.
                      </p>
                      <p>
                        <strong>4. Regulatory Status:</strong> Cryptocurrency assets are not legal tender in most jurisdictions and are not backed by any government or central bank. The regulatory status of cryptocurrencies varies by jurisdiction and is subject to change. You are responsible for understanding and complying with all applicable laws and regulations in your jurisdiction.
                      </p>
                      <p>
                        <strong>5. No Investment Advice:</strong> Nothing in this platform constitutes investment, financial, legal, or tax advice. Cryptocurrency trading involves substantial risk of loss and is not suitable for all investors. You should carefully consider whether trading is appropriate for you in light of your financial condition.
                      </p>
                      <p>
                        <strong>6. Tax Obligations:</strong> Cryptocurrency transactions may be subject to capital gains tax, income tax, or other tax obligations in your jurisdiction. You are solely responsible for determining and fulfilling any tax reporting and payment obligations arising from your transactions.
                      </p>
                      <p>
                        <strong>7. Technology Risks:</strong> Blockchain networks and cryptocurrency protocols are subject to technical risks including but not limited to network congestion, protocol changes, forks, and vulnerabilities. We are not responsible for losses arising from such technical events.
                      </p>
                      <p>
                        <strong>8. AML/KYC Compliance:</strong> All cryptocurrency transactions are subject to our Anti-Money Laundering (AML) and Know Your Customer (KYC) policies. We reserve the right to freeze, suspend, or terminate accounts and transactions that fail to comply with applicable regulations or our internal policies.
                      </p>
                      <p className="text-slate-500 italic">
                        By proceeding, you confirm that you understand the risks associated with cryptocurrency trading and accept full responsibility for your trading decisions. This service is provided subject to our Terms of Service and Privacy Policy.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="crypto_external" className="space-y-6 mt-6">
                    {cryptoExternalFormData.from_currency && (
                      <div className="bg-white border-2 border-gray-300 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            Available {cryptoExternalFormData.from_currency}:
                          </span>
                          <span className="text-slate-900 font-bold">
                            {(balances[getBalanceKey(cryptoExternalFormData.from_currency)] || 0).toFixed(8)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          Select Crypto to Withdraw
                        </Label>
                        <Select
                          value={cryptoExternalFormData.from_currency}
                          onValueChange={(value) => {
                            setCryptoExternalFormData({
                              ...cryptoExternalFormData,
                              from_currency: value,
                            });
                            setValidationErrors([]);
                          }}
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-red-600 transition-colors">
                            <SelectValue placeholder="Select crypto" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCryptoCurrencies().map((currency) => (
                              <SelectItem
                                key={currency.code}
                                value={currency.code}
                                className="py-3 hover:bg-white"
                              >
                                {renderCurrencyOption(currency)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col items-center justify-center px-6 py-4">
                        <div className="w-12 h-12 bg-red-600 flex items-center justify-center mb-2">
                          <Send className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-red-600 text-white px-3 py-1 text-sm font-medium">
                          External
                        </div>
                      </div>

                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.amount}
                        </Label>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={cryptoExternalFormData.amount}
                          onChange={(e) => {
                            setCryptoExternalFormData({
                              ...cryptoExternalFormData,
                              amount: e.target.value,
                            });
                            setValidationErrors([]);
                          }}
                          placeholder="0.00000000"
                          className="h-12 text-lg border-slate-300 hover:border-red-600 focus:border-red-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-white border border-slate-300">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Destination Wallet Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div className="col-span-2">
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            Wallet Address *
                          </Label>
                          <Input
                            value={cryptoWalletDetails.wallet_address}
                            onChange={(e) => {
                              setCryptoWalletDetails({
                                ...cryptoWalletDetails,
                                wallet_address: e.target.value,
                              });
                              setValidationErrors([]);
                            }}
                            placeholder="Enter destination wallet address"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600 font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            Network *
                          </Label>
                          <Select
                            value={cryptoWalletDetails.network}
                            onValueChange={(value) => {
                              setCryptoWalletDetails({
                                ...cryptoWalletDetails,
                                network: value,
                              });
                              setValidationErrors([]);
                            }}
                          >
                            <SelectTrigger className="border-slate-300 hover:border-red-600">
                              <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ethereum">Ethereum (ERC-20)</SelectItem>
                              <SelectItem value="bsc">BNB Smart Chain (BEP-20)</SelectItem>
                              <SelectItem value="polygon">Polygon</SelectItem>
                              <SelectItem value="arbitrum">Arbitrum</SelectItem>
                              <SelectItem value="optimism">Optimism</SelectItem>
                              <SelectItem value="avalanche">Avalanche C-Chain</SelectItem>
                              <SelectItem value="solana">Solana</SelectItem>
                              <SelectItem value="cardano">Cardano</SelectItem>
                              <SelectItem value="polkadot">Polkadot</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            Memo/Tag (if required)
                          </Label>
                          <Input
                            value={cryptoWalletDetails.memo_tag}
                            onChange={(e) =>
                              setCryptoWalletDetails({
                                ...cryptoWalletDetails,
                                memo_tag: e.target.value,
                              })
                            }
                            placeholder="Optional"
                            className="border-slate-300 hover:border-red-600 focus:border-red-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border-2 border-red-600 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          {t.totalDebit} (incl. fee)
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {(Number(cryptoExternalFormData.amount || 0) + transferFee).toFixed(8)}{" "}
                          <span className="text-sm">{cryptoExternalFormData.from_currency || "—"}</span>
                        </p>
                      </div>
                      <div className="border-2 border-gray-300 bg-white p-4">
                        <p className="text-xs text-slate-600 font-medium mb-1">
                          Network Fee
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {transferFee.toFixed(8)}{" "}
                          <span className="text-sm">{cryptoExternalFormData.from_currency || "—"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-amber-400 p-3 text-sm text-slate-800">
                      <p className="font-medium flex items-center gap-2 text-amber-700">
                        <AlertCircle className="w-4 h-4" />
                        Important Notice
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        External withdrawals require manual review for security. Ensure the wallet address and network are correct. Funds sent to the wrong address cannot be recovered.
                      </p>
                    </div>

                    <Button
                      onClick={executeCryptoExternalTransfer}
                      disabled={
                        !cryptoExternalFormData.from_currency ||
                        !cryptoExternalFormData.amount ||
                        !cryptoWalletDetails.wallet_address ||
                        !cryptoWalletDetails.network ||
                        loading ||
                        processingTransfer
                      }
                      className="w-full h-14 text-lg font-semibold bg-red-600 hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {processingTransfer ? "Processing..." : "Submit Withdrawal Request"}
                    </Button>

                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-3">
                      <h4 className="font-semibold text-slate-700 text-sm">External Cryptocurrency Withdrawal Terms and Conditions</h4>
                      <p>
                        By submitting this external cryptocurrency withdrawal request, you acknowledge and agree to the following legally binding terms and conditions:
                      </p>
                      <p>
                        <strong>1. Blockchain Transaction Irreversibility:</strong> Cryptocurrency transactions on blockchain networks are irreversible by design. Once a withdrawal is broadcast to the network and confirmed, it cannot be cancelled, reversed, or modified under any circumstances. We strongly advise triple-checking all wallet addresses and network selections before submission.
                      </p>
                      <p>
                        <strong>2. Wallet Address and Network Verification:</strong> You bear sole and absolute responsibility for ensuring the accuracy of the destination wallet address and the selected blockchain network. Sending cryptocurrency to an incorrect address or incompatible network will result in permanent and irrecoverable loss of funds. We shall have no liability whatsoever for losses resulting from user error.
                      </p>
                      <p>
                        <strong>3. Network Fees and Confirmation Times:</strong> Blockchain network fees (gas fees, miner fees) are determined by network conditions and are separate from our service fees. Confirmation times vary based on network congestion and may range from minutes to hours. We do not control blockchain network performance.
                      </p>
                      <p>
                        <strong>4. Security Review and Processing:</strong> All external withdrawal requests are subject to security review and manual approval. This process may take up to 24-72 hours depending on the amount, destination, and risk assessment. We reserve the right to request additional verification or documentation before processing any withdrawal.
                      </p>
                      <p>
                        <strong>5. Withdrawal Limits:</strong> Withdrawals are subject to daily, weekly, and monthly limits based on your account verification level. Attempts to circumvent withdrawal limits may result in account suspension and investigation.
                      </p>
                      <p>
                        <strong>6. Sanctions and Compliance Screening:</strong> All withdrawal requests are screened against international sanctions lists, including but not limited to OFAC (Office of Foreign Assets Control), EU sanctions, and UN sanctions. Withdrawals to addresses associated with sanctioned entities or illicit activities will be blocked and reported to relevant authorities.
                      </p>
                      <p>
                        <strong>7. Travel Rule Compliance:</strong> In accordance with FATF Travel Rule requirements, we may be required to collect and transmit beneficiary information for withdrawals above certain thresholds. Failure to provide required information may result in delayed or cancelled withdrawals.
                      </p>
                      <p>
                        <strong>8. Smart Contract Risks:</strong> Withdrawals to smart contract addresses carry additional risks. Some smart contracts may not be compatible with certain token standards or may have vulnerabilities. We recommend withdrawing only to standard wallet addresses unless you fully understand smart contract risks.
                      </p>
                      <p>
                        <strong>9. Third-Party Wallets:</strong> We have no control over or responsibility for third-party wallet services, exchanges, or DeFi protocols. Any issues arising after funds leave our platform are solely between you and the receiving party.
                      </p>
                      <p>
                        <strong>10. Tax Reporting:</strong> Cryptocurrency withdrawals may constitute taxable events in your jurisdiction. You are solely responsible for maintaining records of all transactions and fulfilling applicable tax obligations.
                      </p>
                      <p className="text-slate-500 italic">
                        By submitting this withdrawal request, you confirm that you are the lawful owner of the destination wallet, that the withdrawal does not violate any applicable laws or regulations, and that you accept full responsibility for the accuracy of all provided information. This service is governed by our Terms of Service and Privacy Policy.
                      </p>
                    </div>
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
              <span>{t.transferHistoryWithCount.replace('{count}', Math.min(filteredTransfers.length, 4).toString())}</span>
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
                  {t.transferHistory}
                </CardTitle>
                <p className="text-slate-600 text-sm">
                  {t.recentTransactionsAndTransfers}
                </p>
              </CardHeader>

              {/* Filters */}
              <div className="px-4 pb-4 space-y-3 border-b flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={t.searchByReference}
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
                      <SelectValue placeholder={t.type} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allTypes}</SelectItem>
                      <SelectItem value="internal">{t.accountTransfer}</SelectItem>
                      <SelectItem value="bank_transfer">{t.bankWire}</SelectItem>
                      <SelectItem value="crypto_internal">Crypto Exchange</SelectItem>
                      <SelectItem value="crypto_external">Crypto Withdraw</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterStatus}
                    onValueChange={(value) =>
                      setFilterStatus(value as TransferStatus | "all")
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={t.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allStatus}</SelectItem>
                      <SelectItem value="pending">{t.pending}</SelectItem>
                      <SelectItem value="processing">{t.processing}</SelectItem>
                      <SelectItem value="approved">{t.approved}</SelectItem>
                      <SelectItem value="completed">{t.completed}</SelectItem>
                      <SelectItem value="rejected">{t.rejected}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CardContent className="p-4 flex-1 overflow-hidden">
                {filteredTransfers.length === 0 ? (
                  <div className="text-center py-8 flex-1 flex flex-col justify-center">
                    <p className="text-slate-500">
                      {searchQuery || filterStatus !== "all" || filterType !== "all"
                        ? t.noTransfersMatchFilters
                        : t.noTransfersYet}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      {searchQuery || filterStatus !== "all" || filterType !== "all"
                        ? t.tryAdjustingFilters
                        : t.transferHistoryWillAppearHere}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 h-full overflow-y-auto custom-scrollbar pr-2">
                    {filteredTransfers.slice(0, 4).map((transfer) => (
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
                            <span className="text-slate-600 bg-white border border-slate-300 px-2 py-1 text-xs font-mono">
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
      <TransferSuccessModal />
    </div>
  );
}
