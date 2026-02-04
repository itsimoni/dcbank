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
}

interface Transfer {
  id: string;
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
  processed_at: string;
  admin_notes: string;
  fee_amount: number;
}

export default function TransfersSection({
  userProfile,
}: TransfersSectionProps) {
  const { balances, loading, error } = useRealtimeData();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
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
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
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
  });

  const [activeTab, setActiveTab] = useState("internal");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [transferFee, setTransferFee] = useState<number>(0);
  const [showHistoryOnMobile, setShowHistoryOnMobile] = useState(false);

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
      fetchTransfers();
      initializeCurrencies();
      initializeExchangeRates();
    }
    return () => {
      exchangeRateService.cleanup();
    };
  }, [userProfile?.id]);

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
    const fromCurrency = currentFormData.from_currency;
    const toCurrency = currentFormData.to_currency;
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
        .select("*")
        .eq("user_id", userProfile.id)
        .in("transfer_type", ["internal", "bank_transfer"])
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

  const executeInternalTransfer = async () => {
    if (!userProfile?.id) return;

    try {
      const amount = Number.parseFloat(internalFormData.amount);
      const fromCurrency = internalFormData.from_currency.toUpperCase();
      const toCurrency = internalFormData.to_currency.toUpperCase();

      const fromBalanceKey = getBalanceKey(fromCurrency);
      const toBalanceKey = getBalanceKey(toCurrency);

      const currentFromBalance = balances[fromBalanceKey] || 0;
      const currentToBalance = balances[toBalanceKey] || 0;

      if (currentFromBalance < amount + transferFee) {
        alert("Insufficient balance including fees");
        return;
      }

      const toAmount = estimatedAmount;
      const referenceNumber = generateReferenceNumber();

      const { data: transferData, error: transferError } = await supabase
        .from("transfers")
        .insert({
          user_id: userProfile.id,
          from_currency: internalFormData.from_currency,
          to_currency: internalFormData.to_currency,
          from_amount: amount,
          to_amount: toAmount,
          exchange_rate: exchangeRate,
          status: "Completed",
          transfer_type: "internal",
          description: `Internal transfer from ${fromCurrency} to ${toCurrency}`,
          reference_number: referenceNumber,
          fee_amount: transferFee,
          processed_at: new Date().toISOString(),
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
          description: `Internal transfer to ${internalFormData.to_currency} (Ref: ${referenceNumber})`,
          status: "Successful",
        },
        {
          user_id: userProfile.id,
          type: "Transfer In",
          amount: toAmount,
          currency: internalFormData.to_currency,
          description: `Internal transfer from ${internalFormData.from_currency} (Ref: ${referenceNumber})`,
          status: "Successful",
        },
      ]);

      setInternalFormData({ from_currency: "", to_currency: "", amount: "" });
      setExchangeRate(1);
      setEstimatedAmount(0);
      setTransferFee(0);

      await fetchTransfers();
      alert(
        `Internal transfer completed successfully! Reference: ${referenceNumber}`
      );
    } catch (error: any) {
      console.error("Transfer error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const executeBankTransfer = async () => {
    if (!userProfile?.id) return;

    try {
      const amount = Number.parseFloat(bankFormData.amount);
      const fromCurrency = bankFormData.from_currency.toUpperCase();
      const toCurrency = bankFormData.to_currency.toUpperCase();

      const fromBalanceKey = getBalanceKey(fromCurrency);
      const currentFromBalance = balances[fromBalanceKey] || 0;

      if (currentFromBalance < amount + transferFee) {
        alert("Insufficient balance including fees");
        return;
      }

      const toAmount = estimatedAmount;
      const referenceNumber = generateReferenceNumber();

      const { data: transferData, error: transferError } = await supabase
        .from("transfers")
        .insert({
          user_id: userProfile.id,
          from_currency: bankFormData.from_currency,
          to_currency: bankFormData.to_currency,
          from_amount: amount,
          to_amount: toAmount,
          exchange_rate: exchangeRate,
          status: "Pending",
          transfer_type: "bank_transfer",
          description: `Bank transfer to ${bankDetails.bank_name}`,
          reference_number: referenceNumber,
          fee_amount: transferFee,
        })
        .select()
        .single();

      if (transferError) throw transferError;

      const { error: bankError } = await supabase
        .from("bank_transfers")
        .insert({
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
        description: `Bank transfer to ${bankDetails.bank_name} (Ref: ${referenceNumber}) - Pending Approval`,
        status: "Pending",
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
      });
      setExchangeRate(1);
      setEstimatedAmount(0);
      setTransferFee(0);

      await fetchTransfers();
      alert(
        `Bank transfer request submitted successfully! Reference: ${referenceNumber}. Your transfer is pending approval.`
      );
    } catch (error: any) {
      console.error("Bank transfer error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalized = status.trim().toLowerCase() as
      | "pending"
      | "approved"
      | "completed"
      | "rejected"
      | "processing";

    const statusConfig: Record<
      "pending" | "approved" | "completed" | "rejected" | "processing",
      {
        color: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      pending: {
        color:
          "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
        icon: Clock,
      },
      approved: {
        color: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
        icon: CheckCircle,
      },
      completed: {
        color:
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
        icon: CheckCircle,
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
        icon: XCircle,
      },
      processing: {
        color:
          "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
        icon: Clock,
      },
    };

    const config = statusConfig[normalized] ?? statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 border`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
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
        <Coins className="w-4 h-4 text-orange-500" />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F26623]"></div>
        <span className="ml-3 text-slate-600">{t.loadingTransfers}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="text-red-600 text-lg font-semibold">Error</div>
          <div className="text-red-500 mt-2">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .balance-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }
        .balance-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: #f26623;
        }
        .transfer-form {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }
        .history-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        }
        .transfer-item {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        .transfer-item:hover {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .currency-badge {
          background: linear-gradient(135deg, #f26623 0%, #e55a1f 100%);
          box-shadow: 0 2px 8px rgba(242, 102, 35, 0.3);
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

      {/* Language Selector - Top Right */}
      <div className="flex justify-end p-4">
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

      {/* Header - Fixed */}
      <div className="text-center py-6 md:py-6 px-4 md:px-6 flex-shrink-0">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-1">
          {t.currencyTransfers}
        </h2>
        <p className="text-slate-600">• {t.internalBankTransfers}</p>
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

      {/* Main Layout - Fixed Height */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden px-4 md:px-6 pb-6 gap-6">
        {/* Main Content - Scrollable */}
        <div className="flex-1 lg:flex-1 overflow-y-auto custom-scrollbar min-h-0 mobile-form-priority">
          <div className="space-y-6 pr-4">
            {/* Current Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              <Card className="balance-card">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-[#F26623]/75 rounded-full flex items-center justify-center mx-auto mb-3">
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
                  <div className="w-10 h-10 bg-[#F26623]/75 rounded-full flex items-center justify-center mx-auto mb-3">
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
                  <div className="w-10 h-10 bg-[#F26623]/75 rounded-full flex items-center justify-center mx-auto mb-3">
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

            {/* Transfer Forms */}
            <Card className="transfer-form">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F26623]/75 rounded-lg flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-white" />
                  </div>
                  {t.newTransfer}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="internal"
                      className="flex items-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      {t.internalTransfer}
                    </TabsTrigger>
                    <TabsTrigger
                      value="bank"
                      className="flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      {t.bankTransfer}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="internal" className="space-y-6 mt-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.fromCurrency}
                        </Label>
                        <Select
                          value={internalFormData.from_currency}
                          onValueChange={(value) =>
                            setInternalFormData({
                              ...internalFormData,
                              from_currency: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-[#F26623] transition-colors">
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
                        <div className="w-12 h-12 bg-[#F26623]/75 rounded-full flex items-center justify-center mb-2">
                          <ArrowLeftRight className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-[#F26623]/75 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {exchangeRate === 1 ? "1:1" : exchangeRate.toFixed(2)}
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
                          onValueChange={(value) =>
                            setInternalFormData({
                              ...internalFormData,
                              to_currency: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-[#F26623] transition-colors">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.amountToTransfer}
                        </Label>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={internalFormData.amount}
                          onChange={(e) =>
                            setInternalFormData({
                              ...internalFormData,
                              amount: e.target.value,
                            })
                          }
                          placeholder="0"
                          className="h-12 text-lg border-slate-300 hover:border-[#F26623] focus:border-[#F26623] transition-colors"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.transferFee}
                        </Label>
                        <Input
                          value={
                            transferFee === 0
                              ? "0"
                              : transferFee < 1
                              ? transferFee.toFixed(4)
                              : transferFee.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })
                          }
                          readOnly
                          className="h-12 text-lg font-semibold bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.youWillReceive}
                        </Label>
                        <Input
                          value={
                            estimatedAmount === 0
                              ? "0"
                              : estimatedAmount < 1
                              ? estimatedAmount.toFixed(4)
                              : estimatedAmount.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })
                          }
                          readOnly
                          className="h-12 text-lg font-semibold bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-800"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={executeInternalTransfer}
                      disabled={
                        !internalFormData.from_currency ||
                        !internalFormData.to_currency ||
                        !internalFormData.amount ||
                        loading
                      }
                      className="w-full h-14 text-lg font-semibold bg-[#F26623] hover:bg-[#E55A1F] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {t.executeInternalTransfer}
                    </Button>
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-6 mt-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                      <div className="flex-1 w-full">
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.fromCurrency}
                        </Label>
                        <Select
                          value={bankFormData.from_currency}
                          onValueChange={(value) =>
                            setBankFormData({
                              ...bankFormData,
                              from_currency: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-[#F26623] transition-colors">
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
                        <div className="w-12 h-12 bg-[#F26623]/75 rounded-full flex items-center justify-center mb-2">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-[#F26623]/75 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {exchangeRate === 1 ? "1:1" : exchangeRate.toFixed(2)}
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
                          value={bankFormData.to_currency}
                          onValueChange={(value) =>
                            setBankFormData({
                              ...bankFormData,
                              to_currency: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-12 w-full border-slate-300 hover:border-[#F26623] transition-colors">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.amountToTransfer}
                        </Label>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={bankFormData.amount}
                          onChange={(e) =>
                            setBankFormData({
                              ...bankFormData,
                              amount: e.target.value,
                            })
                          }
                          placeholder="0"
                          className="h-12 text-lg border-slate-300 hover:border-[#F26623] focus:border-[#F26623] transition-colors"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.transferFee}
                        </Label>
                        <Input
                          value={
                            transferFee === 0
                              ? "0"
                              : transferFee < 1
                              ? transferFee.toFixed(4)
                              : transferFee.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })
                          }
                          readOnly
                          className="h-12 text-lg font-semibold bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold mb-3 block text-slate-700">
                          {t.youWillReceive}
                        </Label>
                        <Input
                          value={
                            estimatedAmount === 0
                              ? "0"
                              : estimatedAmount < 1
                              ? estimatedAmount.toFixed(4)
                              : estimatedAmount.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })
                          }
                          readOnly
                          className="h-12 text-lg font-semibold bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-800"
                        />
                      </div>
                    </div>

                    {/* Bank Details Form */}
                    <div className="space-y-4 p-6 bg-slate-50 rounded-lg border">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        {t.bankDetails}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.bankNameRequired}
                          </Label>
                          <Input
                            value={bankDetails.bank_name}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                bank_name: e.target.value,
                              })
                            }
                            placeholder={t.enterBankName}
                            className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.accountHolderNameRequired}
                          </Label>
                          <Input
                            value={bankDetails.account_holder_name}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                account_holder_name: e.target.value,
                              })
                            }
                            placeholder={t.enterAccountHolderName}
                            className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.accountNumberRequired}
                          </Label>
                          <Input
                            value={bankDetails.account_number}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                account_number: e.target.value,
                              })
                            }
                            placeholder={t.enterAccountNumber}
                            className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t.routingNumberOptional}
                          </Label>
                          <Input
                            value={bankDetails.routing_number}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                routing_number: e.target.value,
                              })
                            }
                            placeholder={t.enterRoutingNumber}
                            className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
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
                            placeholder={t.enterSwiftCode}
                            className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
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
                            placeholder={t.enterIban}
                            className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
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
                          placeholder={t.enterBankAddress}
                          className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
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
                          placeholder={t.enterRecipientAddress}
                          className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
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
                          placeholder={t.enterPurposeOfTransfer}
                          className="border-slate-300 hover:border-[#F26623] focus:border-[#F26623]"
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
                      className="w-full h-14 text-lg font-semibold bg-[#F26623] hover:bg-[#E55A1F] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {t.submitBankTransferRequest}
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
              <span>{t.transferHistory} ({transfers.length})</span>
              {showHistoryOnMobile ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div
            className={`${showHistoryOnMobile ? "block" : "hidden"} lg:block`}
          >
            <Card className="history-card h-full flex flex-col">
              <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="text-xl font-bold text-slate-800">
                  {t.transferHistory}
                </CardTitle>
                <p className="text-slate-600 text-sm">
                  {t.yourRecentTransactions}
                </p>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-hidden">
                {transfers.length === 0 ? (
                  <div className="text-center py-0 pb-4 flex-1 flex flex-col justify-center">
                    <p className="text-slate-500">{t.noTransfersYet}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {t.transferHistoryAppear}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 h-full overflow-y-auto custom-scrollbar pr-2">
                    {transfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="transfer-item p-4 rounded-lg"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800 text-sm">
                                {transfer.from_currency}
                              </span>
                              <ArrowLeftRight className="w-3 h-3 text-[#F26623]" />
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
                                <Coins className="w-3 h-3 text-orange-600" />
                              )}
                            </div>
                            <div className="text-xs text-slate-600">
                              <span className="font-medium">
                                {Number(transfer.from_amount).toLocaleString()}
                              </span>
                              <span className="mx-1">→</span>
                              <span className="font-medium">
                                {Number(transfer.to_amount).toLocaleString()}
                              </span>
                              {transfer.fee_amount > 0 && (
                                <span className="text-red-600 text-xs ml-1">
                                  (Fee: {Number(transfer.fee_amount).toFixed(2)}
                                  )
                                </span>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(transfer.status)}
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">
                            {(() => {
                              const d = new Date(transfer.created_at);
                              const day = String(d.getDate()).padStart(2, "0");
                              const month = String(d.getMonth() + 1).padStart(
                                2,
                                "0"
                              );
                              const year = d.getFullYear();
                              return `${day}-${month}-${year}`;
                            })()}
                          </span>

                          {transfer.reference_number && (
                            <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs">
                              {transfer.reference_number}
                            </span>
                          )}
                        </div>
                        {transfer.transfer_type === "bank_transfer" &&
                          transfer.status === "Pending" && (
                            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                              {t.bankTransferPendingApproval}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
