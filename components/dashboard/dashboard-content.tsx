"use client";
import React, { memo, useDeferredValue, useMemo, useCallback } from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtimeData } from "@/hooks/use-realtime-data";
import { useLatestMessage } from "@/hooks/use-latest-message";
import { supabase } from "@/lib/supabase";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Bitcoin,
  Shield,
  MessageSquare,
  Bell,
  Activity,
  CreditCard,
  Send,
  Wallet,
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  User,
  FileText,
  Banknote,
  Languages,
} from "lucide-react";
import Image from "next/image";
import TaxCard from "../tax-card";
import LiveRatesCard from "./live-rates-card";
import BalanceComparisonGraph from "./balance-comparison-graph";
if (process.env.NODE_ENV === "production") {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

interface DashboardContentProps {
  userProfile: {
    id: string;
    client_id: string;
    full_name: string | null;
    email: string | null;
    created_at?: string;
  };
  setActiveTab: (tab: string) => void;
}

interface LatestMessage {
  id: string;
  client_id: string;
  title: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  is_welcome?: boolean;
}

interface WelcomeMessage {
  id: string;
  title: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  is_welcome: boolean;
}

interface TransactionHistory {
  id: number;
  created_at: string;
  thType: string;
  thDetails: string;
  thPoi: string;
  thStatus: string;
  uuid: string;
  thEmail: string | null;
}

interface UserData {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
}

// Real cryptocurrency configurations - memoized
const cryptoConfigs = {
  BTC: {
    name: "Bitcoin",
    iconUrl:
      "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    decimals: 8,
  },
  ETH: {
    name: "Ethereum",
    iconUrl:
      "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    decimals: 6,
  },
  USDT: {
    name: "Tether",
    iconUrl:
      "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdt.svg",
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    decimals: 2,
  },
} as const;

// Memoized components for better performance
const LoadingCard = memo(() => (
  <div className="bg-white p-4 sm:p-6 shadow animate-pulse">
    <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4"></div>
    <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
));

const LoadingActivity = memo(() => (
  <div className="py-2 border-b border-gray-100 animate-pulse">
    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
));

const formatName = (name = "") =>
  name
    .trim()
    .split(/\s+/) // split by spaces
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const BalanceCard = memo(
  ({
    currency,
    balance,
    formatCurrency,
    t,
  }: {
    currency: string;
    balance: number;
    formatCurrency: (amount: number, currency: string) => string;
    t: ReturnType<typeof getTranslations>;
  }) => (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="text-lg sm:text-xl font-bold text-gray-900 uppercase">
        {currency === "usd" ? "USD" : currency === "euro" ? "EUR" : "CAD"}
      </div>
      <div className="relative w-32 h-20 sm:w-40 sm:h-24 bg-[#b91c1c] transition-all duration-200 flex flex-col items-center justify-center p-4">
        <div className="text-base sm:text-2xl font-bold text-white leading-tight text-center">
          {formatCurrency(balance, currency)}
        </div>
      </div>
    </div>
  )
);

const CryptoCard = memo(
  ({
    cryptoCurrency,
    balance,
    formatCurrency,
    t,
  }: {
    cryptoCurrency: string;
    balance: number;
    formatCurrency: (amount: number, currency: string) => string;
    t: ReturnType<typeof getTranslations>;
  }) => {
    const config = cryptoConfigs[cryptoCurrency as keyof typeof cryptoConfigs];

    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="text-lg sm:text-xl font-bold text-gray-900 uppercase">
          {cryptoCurrency}
        </div>
        <div className={`relative w-32 h-20 sm:w-40 sm:h-24 ${config.bgColor} border-2 ${config.borderColor} transition-all duration-200 flex flex-col items-center justify-center p-4`}>
          <div className={`text-sm sm:text-2xl font-bold leading-tight ${config.color} text-center`}>
            {formatCurrency(balance, cryptoCurrency)}
          </div>
        </div>
      </div>
    );
  }
);

function DashboardContent({
  userProfile,
  setActiveTab,
}: DashboardContentProps) {
  const {
    balances: realtimeBalances,
    exchangeRates,
    cryptoPrices,
    deposits,
    messages,
    loading,
    error,
  } = useRealtimeData();
  const { latestMessage, markAsRead } = useLatestMessage();
  const [showMessage, setShowMessage] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const loadingRef = useRef(false);
  const [welcomeMessage, setWelcomeMessage] = useState<WelcomeMessage | null>(
    null
  );
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasCheckedWelcome, setHasCheckedWelcome] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<
    LatestMessage | WelcomeMessage | null
  >(null);
  // Add state for crypto balances
  const [cryptoBalances, setCryptoBalances] = useState<Record<string, number>>({
    BTC: 0,
    ETH: 0,
    USDT: 0,
  });
  // Add state for user data from users table
  const [userData, setUserData] = useState<UserData | null>(null);
  // Add state for transaction history
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  // Add language state
  const { language, setLanguage } = useLanguage();
  // Add language dropdown state
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Get translations
  const t = useMemo(() => getTranslations(language), [language]);

  // Language names for the dropdown
  const languageNames: Record<Language, string> = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
    el: "Ελληνικά",
  };

  // Memoized functions for better performance
  const formatCurrency = useCallback((amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      usd: "$",
      euro: "€",
      cad: "C$",
      BTC: "₿",
      ETH: "Ξ",
      USDT: "₮",
    };

    // Allow crypto to have more precision, fiat max 2 decimals
    const decimals = currency === "BTC" || currency === "ETH" ? 8 : 2; // crypto = 2 decimals, everything else = 2

    const formattedAmount = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(amount);

    return `${symbols[currency] || "$"}${formattedAmount}`;
  }, []);

  const getMessageIcon = useCallback((type: string) => {
    switch (type) {
      case "welcome":
        return <Sparkles className="h-4 w-4" />;
      case "alert":
        return <Bell className="h-4 w-4" />;
      case "warning":
        return <Bell className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  }, []);

  const handleDismissMessage = useCallback(async () => {
    if (welcomeMessage) {
      try {
        if (welcomeMessage.id !== "welcome-local") {
          await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", welcomeMessage.id);
        }
        // Don't clear welcome message, just mark as read
        setWelcomeMessage({ ...welcomeMessage, is_read: true });
        setCurrentMessage({ ...welcomeMessage, is_read: true });
        setShowMessage(false);
      } catch (error) {
        console.error("Error marking welcome message as read:", error);
      }
    } else if (latestMessage) {
      try {
        await markAsRead(latestMessage.id);
        setCurrentMessage(null);
        setShowMessage(false);
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  }, [welcomeMessage, latestMessage, markAsRead]);

  // Memoized quick action handlers
  const handleTransferClick = useCallback(
    () => setActiveTab("transfers"),
    [setActiveTab]
  );
  const handleDepositClick = useCallback(
    () => setActiveTab("deposit"),
    [setActiveTab]
  );
  const handleCryptoClick = useCallback(
    () => setActiveTab("crypto"),
    [setActiveTab]
  );
  const handleCardClick = useCallback(
    () => setActiveTab("card"),
    [setActiveTab]
  );
  const handleSupportClick = useCallback(
    () => setActiveTab("support"),
    [setActiveTab]
  );

  // Fetch user data from users table
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const fetchUserData = async () => {
      try {
        if (!userProfile?.id) {
          console.log("No userProfile.id available yet");
          return;
        }

        console.log("Fetching user data for user:", userProfile.id);

        const { data, error } = await supabase
          .from("users")
          .select("first_name, last_name, full_name, email")
          .eq("id", userProfile.id)
          .abortSignal(abortController.signal)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          if (error.message?.includes('aborted') || error.name === 'AbortError') {
            console.log('[UserData] Request aborted');
            return;
          }
          console.error("Error fetching user data:", error);
          setUserData({
            first_name: null,
            last_name: null,
            full_name: null,
            email: userProfile.email || null,
          });
          return;
        }

        console.log("User data fetched:", data);
        setUserData(data);
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          console.log('[UserData] Fetch aborted');
          return;
        }
        if (mounted) {
          console.error("Error in fetchUserData:", error);
          setUserData({
            first_name: null,
            last_name: null,
            full_name: null,
            email: null,
          });
        }
      }
    };

    fetchUserData();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [userProfile?.id, userProfile?.email]);

  // Fetch crypto balances from the correct table (newcrypto_balances)
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const fetchCryptoBalances = async () => {
      if (!userProfile?.id || userProfile.id === "unknown" || userProfile.id === "") {
        console.log("Invalid or missing user ID:", userProfile?.id);
        setCryptoBalances({
          BTC: 0,
          ETH: 0,
          USDT: 0,
        });
        return;
      }

      try {
        console.log("Fetching crypto balances for user:", userProfile.id);

        const { data, error } = await supabase
          .from("newcrypto_balances")
          .select("btc_balance, eth_balance, usdt_balance")
          .eq("user_id", userProfile.id)
          .abortSignal(abortController.signal);

        if (!mounted) return;

        if (error) {
          if (error.message?.includes('aborted') || error.name === 'AbortError') {
            console.log('[CryptoBalances] Request aborted');
            return;
          }
          console.error("Error fetching crypto balances:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          setCryptoBalances({
            BTC: 0,
            ETH: 0,
            USDT: 0,
          });
          return;
        }

        console.log("Crypto balances data:", data);

        if (data && data.length > 0) {
          const userBalance = data[0];
          const balances = {
            BTC: Number(userBalance.btc_balance) || 0,
            ETH: Number(userBalance.eth_balance) || 0,
            USDT: Number(userBalance.usdt_balance) || 0,
          };

          console.log("Setting crypto balances:", balances);
          setCryptoBalances(balances);
        } else {
          console.log("No crypto balance record found, setting all to 0");
          setCryptoBalances({
            BTC: 0,
            ETH: 0,
            USDT: 0,
          });
        }
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          console.log('[CryptoBalances] Fetch aborted');
          return;
        }
        if (mounted) {
          console.error("Error in fetchCryptoBalances:", {
            error,
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          });
          setCryptoBalances({
            BTC: 0,
            ETH: 0,
            USDT: 0,
          });
        }
      }
    };

    fetchCryptoBalances();

    // Set up real-time subscription for crypto balances
    const setupCryptoSubscription = () => {
      // Only set up subscription if we have a valid user ID
      const userId =
        userProfile?.id && userProfile.id !== "unknown" ? userProfile.id : null;

      if (!userId) {
        console.log("No valid user ID for subscription");
        return () => {};
      }

      const subscription = supabase
        .channel(`newcrypto_balances_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "newcrypto_balances",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Crypto balance change detected:", payload);
            fetchCryptoBalances();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = setupCryptoSubscription();
    return () => {
      mounted = false;
      abortController.abort();
      cleanup();
    };
  }, [userProfile?.id]);

  // Fetch transaction history
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const fetchTransactionHistory = async () => {
      if (!userProfile?.id || userProfile.id === "unknown" || userProfile.id === "") {
        setTransactionHistory([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("TransactionHistory")
          .select("*")
          .eq("uuid", userProfile.id)
          .order("created_at", { ascending: true })
          .limit(5)
          .abortSignal(abortController.signal);

        if (error) {
          if (error.message?.includes('aborted') || error.name === 'AbortError') {
            return;
          }
          console.error("Error fetching transaction history:", error);
          setTransactionHistory([]);
          return;
        }

        if (data && mounted) {
          setTransactionHistory(data);
        }
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          return;
        }
        if (mounted) {
          console.error("Error in fetchTransactionHistory:", error);
          setTransactionHistory([]);
        }
      }
    };

    fetchTransactionHistory();

    const setupTransactionSubscription = () => {
      const userId = userProfile?.id;
      if (!userId || userId === "unknown" || userId === "") {
        return () => {};
      }

      const subscription = supabase
        .channel(`transaction_history_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "TransactionHistory",
            filter: `uuid=eq.${userId}`,
          },
          (payload) => {
            fetchTransactionHistory();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = setupTransactionSubscription();
    return () => {
      mounted = false;
      abortController.abort();
      cleanup();
    };
  }, [userProfile?.id]);

  // Silent auto-reload every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force component re-render by updating a state that doesn't affect UI
      setHasLoaded((prev) => prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Check if user is new and create welcome message
  useEffect(() => {
    const checkNewUserAndCreateWelcome = async () => {
      if (!userProfile || hasCheckedWelcome) return;

      // Skip if userProfile.id is invalid
      if (!userProfile.id || userProfile.id === "unknown") {
        console.log("Skipping welcome check - invalid user ID");
        setHasCheckedWelcome(true);
        return;
      }

      try {
        if (!userProfile?.id) return;

        // Check if user was created in the last 24 hours
        const userCreatedAt = new Date(userProfile.created_at || Date.now());
        const now = new Date();
        const hoursDiff =
          (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);
        const isRecentUser = hoursDiff <= 24;

        // Check if user has any existing transactions (indicating they're not new)
        const { data: existingTransfers } = await supabase
          .from("transfers")
          .select("id")
          .eq("user_id", userProfile.id)
          .limit(1);

        // Check if welcome message already exists
        const { data: existingWelcome } = await supabase
          .from("messages")
          .select("*")
          .eq("client_id", userProfile.client_id)
          .eq("message_type", "welcome")
          .limit(1);

        const hasActivity =
          (existingTransfers && existingTransfers.length > 0);

        const shouldShowWelcome =
          isRecentUser && !hasActivity && !existingWelcome?.length;

        if (shouldShowWelcome) {
          setIsNewUser(true);

          // Get the display name for welcome message
          const nonEmpty = (v?: string | null) =>
            typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

          const displayNameForWelcome =
            nonEmpty(userData?.full_name) || // 1) public.users.full_name
            nonEmpty(userProfile?.full_name) || // 2) public.profiles.full_name
            nonEmpty(userData?.email?.split("@")[0]) || // 3) users email prefix
            nonEmpty(userProfile?.email?.split("@")[0]) || // 4) profiles email prefix
            "Valued Customer";

          // Create welcome message in database
          const welcomeData = {
            client_id: userProfile.client_id,
            title: "Welcome to Digital Chain Bank! 🎉",
            content: `Dear ${displayNameForWelcome}, welcome to Digital Chain Bank - your trusted partner in digital banking excellence. We're thrilled to have you join our growing family of satisfied customers. Your account is now active and ready for secure, fast, and reliable financial transactions. Explore our comprehensive banking services including multi-currency transfers, cryptocurrency management, and 24/7 customer support. Thank you for choosing Digital Chain Bank for your financial journey.`,
            message_type: "welcome",
            is_read: false,
            created_at: new Date().toISOString(),
          };

          // Insert welcome message into database
          const { data: insertedMessage, error: insertError } = await supabase
            .from("messages")
            .insert([welcomeData])
            .select();

          if (!insertError && insertedMessage && insertedMessage.length > 0) {
            setWelcomeMessage({
              ...insertedMessage[0],
              is_welcome: true,
            });
            setCurrentMessage({
              ...insertedMessage[0],
              is_welcome: true,
            });
            setShowMessage(true);
          } else {
            // Fallback to local welcome message if database insert fails
            const localWelcomeMessage = {
              id: "welcome-local",
              title: "Welcome to Digital Chain Bank! 🎉",
              content: `Dear ${displayNameForWelcome}, welcome to Digital Chain Bank - your trusted partner in digital banking excellence. We're thrilled to have you join our growing family of satisfied customers.`,
              message_type: "welcome",
              is_read: false,
              created_at: new Date().toISOString(),
              is_welcome: true,
            };
            setWelcomeMessage(localWelcomeMessage);
            setCurrentMessage(localWelcomeMessage);
            setShowMessage(true);
          }
        }
        setHasCheckedWelcome(true);
      } catch (error) {
        console.error("Error checking new user status:", error);
        setHasCheckedWelcome(true);
      }
    };

    checkNewUserAndCreateWelcome();
  }, [userProfile, hasCheckedWelcome, userData]);

  // Handle regular messages
  useEffect(() => {
    // Only show regular messages if there's no welcome message or if the latest message is newer than welcome
    if (latestMessage && !latestMessage.is_read) {
      if (welcomeMessage) {
        // Check if the latest message is newer than the welcome message
        const latestMessageTime = new Date(latestMessage.created_at).getTime();
        const welcomeMessageTime = new Date(
          welcomeMessage.created_at
        ).getTime();

        // Only replace welcome message if admin message is newer
        if (latestMessageTime > welcomeMessageTime) {
          setWelcomeMessage(null); // Clear welcome message
          setCurrentMessage({ ...latestMessage, is_welcome: false });
          setShowMessage(true);
        }
      } else {
        setCurrentMessage({ ...latestMessage, is_welcome: false });
        setShowMessage(true);
      }
    }
  }, [latestMessage, welcomeMessage]);

  useEffect(() => {
    if (loading && !loadingRef.current) {
      loadingRef.current = true;
    } else if (!loading && loadingRef.current) {
      loadingRef.current = false;
      setHasLoaded(true);
    }
  }, [loading]);


  useEffect(() => {
    const checkForNewAdminMessages = async () => {
      if (!welcomeMessage || !userProfile) return;

      try {
        const { data: newerMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("client_id", userProfile.client_id)
          .neq("message_type", "welcome")
          .gt("created_at", welcomeMessage.created_at)
          .order("created_at", { ascending: false })
          .limit(1);

        if (newerMessages && newerMessages.length > 0) {
          // There's a newer admin message, welcome message should step aside
          console.log(
            "Newer admin message found, welcome message will be replaced"
          );
          setCurrentMessage({ ...newerMessages[0], is_welcome: false });
        }
      } catch (error) {
        console.error("Error checking for newer messages:", error);
      }
    };

    checkForNewAdminMessages();
  }, [welcomeMessage, userProfile, latestMessage]);

  // Display name - only uses full_name from profiles table
  const displayName = useMemo(() => {
    return userProfile?.full_name || "User";
  }, [userProfile?.full_name]);

  // Memoized balance cards
  const traditionalBalanceCards = useMemo(() => {
    if (!realtimeBalances) return null;

    return Object.entries(realtimeBalances)
      .filter(([currency]) => ["usd", "euro", "cad"].includes(currency))
      .map(([currency, balance]) => (
        <BalanceCard
          key={currency}
          currency={currency}
          balance={balance}
          formatCurrency={formatCurrency}
          t={t}
        />
      ));
  }, [realtimeBalances, formatCurrency, t]);

  const cryptoBalanceCards = useMemo(() => {
    return ["BTC", "ETH", "USDT"].map((cryptoCurrency) => (
      <CryptoCard
        key={cryptoCurrency}
        cryptoCurrency={cryptoCurrency}
        balance={cryptoBalances[cryptoCurrency] || 0}
        formatCurrency={formatCurrency}
        t={t}
      />
    ));
  }, [cryptoBalances, formatCurrency, t]);

  if (loading && !hasLoaded) {
    return (
      <div className="flex-1 p-3 sm:p-6 lg:p-8 bg-gray-50 overflow-auto [@media(max-width:500px)]:pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8 animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3 mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 sm:w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 sm:h-16 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white p-4 sm:p-6 shadow animate-pulse"
              >
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-3 sm:p-6 lg:p-8 bg-gray-50 overflow-auto [@media(max-width:500px)]:pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
            {t.welcome}, {formatName(displayName)}
          </h1>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#b91c1c] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Languages className="h-4 w-4 text-[#b91c1c]" />
              <span>{languageNames[language]}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLanguageDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsLanguageDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-20 overflow-hidden">
                  {Object.entries(languageNames).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code as Language);
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                        language === code
                          ? 'bg-[#b91c1c] text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{name}</span>
                        {language === code && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <Alert className="mb-4 sm:mb-6 border-red-500 bg-red-50">
            <AlertDescription className="text-red-700 text-sm">
              Error: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Balance Circles and Transaction History - Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-6 sm:mb-8">
          {/* Left side - Balance Circles */}
          <div className="lg:col-span-4 space-y-6">
            {/* Traditional Currency Circles - USD, EUR, CAD */}
            <div className="flex flex-wrap justify-start gap-6 sm:gap-8 lg:gap-12">
              {traditionalBalanceCards}
            </div>

            {/* Crypto Currency Circles - BTC, ETH, USDT */}
            <div className="flex flex-wrap justify-start gap-6 sm:gap-8 lg:gap-12">
              {cryptoBalanceCards}
            </div>
          </div>

          {/* Right side - Transaction History Card */}
          <div className="lg:col-span-3">
            <Card className="h-full bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t.recentTransactions}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transactionHistory.length > 0 ? (
                  transactionHistory.map((transaction) => {
                    const getTranslatedStatus = (status: string) => {
                      const statusLower = status.toLowerCase();
                      if (statusLower === "successful" || statusLower === "completed" || statusLower === "approved") return t.successful;
                      if (statusLower === "pending" || statusLower === "processing" || statusLower === "under review") return t.pending;
                      if (statusLower === "failed" || statusLower === "rejected") return t.failed;
                      if (statusLower === "cancelled") return t.cancelled;
                      return status;
                    };

                    return (
                      <div
                        key={transaction.id}
                        className="border-l-4 border-l-[#b91c1c] pl-3 py-2 hover:bg-gray-50 transition-colors rounded-r"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {transaction.thType}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {transaction.thDetails}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {transaction.thPoi}
                            </div>
                          </div>
                          <Badge
                            variant={
                              transaction.thStatus === "Successful"
                                ? "default"
                                : transaction.thStatus === "Pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className={`text-xs shrink-0 ${
                              transaction.thStatus === "Successful"
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : ""
                            }`}
                          >
                            {getTranslatedStatus(transaction.thStatus)}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(transaction.created_at).toLocaleDateString()}{" "}
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="rounded-full bg-gray-100 p-5 mb-4">
                      <FileText className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      {t.noTransactionsYet}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Balance Comparison Graph */}
        <div className="mb-6 sm:mb-8">
          <BalanceComparisonGraph userId={userProfile.id} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            onClick={handleTransferClick}
            className="h-12 sm:h-16 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-sm sm:text-base rounded-none"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.transferMoney}
          </Button>
          <Button
            onClick={handleDepositClick}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent rounded-none"
          >
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.depositFunds}
          </Button>
          <Button
            onClick={handleCryptoClick}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent rounded-none"
          >
            <Bitcoin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.cryptoTrading}
          </Button>
          <Button
            onClick={handleCardClick}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent rounded-none"
          >
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.manageCards}
          </Button>
          <Button
            onClick={() => setActiveTab("loans")}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white rounded-none"
          >
            <Banknote className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.applyForLoan}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Tax Card */}
          <div className="lg:col-span-1">
            <TaxCard userProfile={userProfile} setActiveTab={setActiveTab} />
          </div>

          {/* Latest Message Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  <div className="flex items-center min-w-0">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {currentMessage ? t.messages : t.latestMessage}
                    </span>
                    {currentMessage &&
                      (!currentMessage.is_read ||
                        (welcomeMessage &&
                          currentMessage.id === welcomeMessage.id)) && (
                        <Badge
                          variant={
                            welcomeMessage &&
                            currentMessage.id === welcomeMessage.id
                              ? "default"
                              : "destructive"
                          }
                          className={`ml-2 text-xs flex-shrink-0 ${
                            welcomeMessage &&
                            currentMessage.id === welcomeMessage.id
                              ? "bg-[#b91c1c]"
                              : ""
                          }`}
                        >
                          {welcomeMessage &&
                          currentMessage.id === welcomeMessage.id
                            ? currentMessage.is_read
                              ? t.welcome
                              : `${t.welcome}!`
                            : t.new}
                        </Badge>
                      )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                {loading ? (
                  <div className="p-3 bg-gray-100 animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : currentMessage ? (
                  <div
                    className={`p-3 sm:p-4 border-l-4 transition-opacity ${
                      currentMessage.message_type === "welcome"
                        ? "border-[#b91c1c] bg-gradient-to-r from-red-50 to-red-100"
                        : currentMessage.message_type === "success"
                        ? "border-green-500 bg-green-50"
                        : currentMessage.message_type === "alert"
                        ? "border-red-500 bg-red-50"
                        : currentMessage.message_type === "warning"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-blue-500 bg-blue-50"
                    } ${currentMessage.is_read ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getMessageIcon(currentMessage.message_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">
                            {currentMessage.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {currentMessage.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(
                              currentMessage.created_at
                            ).toLocaleTimeString()}
                          </p>
                          {welcomeMessage &&
                            currentMessage.id === welcomeMessage.id && (
                              <div className="mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                <Button
                                  size="sm"
                                  onClick={handleSupportClick}
                                  className="bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  {t.getSupport}
                                </Button>
                                {!currentMessage.is_read && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleDismissMessage}
                                    className="text-xs bg-transparent"
                                  >
                                    {t.markAsRead}
                                  </Button>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                      {!currentMessage.is_read && !welcomeMessage && (
                        <div className="w-2 h-2 bg-[#b91c1c] rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm">{t.noMessages}</p>
                    <p className="text-xs mt-1">
                      {t.notificationsAppearMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live Rates Card */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 sm:gap-8">
          <LiveRatesCard language={language} />
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardContent);
