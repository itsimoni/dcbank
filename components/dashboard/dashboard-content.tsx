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

interface Payment {
  id: string;
  user_id: string;
  payment_type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  due_date?: string;
  created_at: string;
}

interface AccountActivity {
  id: string;
  user_id: string;
  client_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  currency: string;
  display_amount: number;
  status: string;
  priority: string;
  is_read: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  metadata: any;
}

interface TransactionHistory {
  id: number;
  created_at: string;
  thType: string;
  thDetails: string;
  thPoi: string;
  thStatus: string;
  uuid: string | null;
  thEmail: string | null;
}

interface CombinedActivity {
  id: string;
  type: "account_activity";
  created_at: string;
  data: AccountActivity | TransactionHistory;
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
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow animate-pulse">
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
    <Card className="hover:shadow-md transition-all duration-200 bg-[#b91c1c] relative overflow-hidden h-[120px] sm:h-[140px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
        <CardTitle className="text-xs sm:text-sm text-white font-medium capitalize">
          {currency === "usd" ? "USD" : currency === "euro" ? "EUR" : "CAD"}{" "}
          {t.balanceLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="text-base sm:text-lg font-bold text-white leading-tight">
          {formatCurrency(balance, currency)}
        </div>
        <p className="text-xs text-white/80 mt-1">
          {currency.toUpperCase()} {t.account}
        </p>
      </CardContent>
    </Card>
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
      <Card
        className={`hover:shadow-md transition-all duration-200 relative overflow-hidden ${config.bgColor} ${config.borderColor} border rounded-lg h-[120px] sm:h-[140px]`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 sm:p-4">
          <CardTitle
            className={`text-xs sm:text-sm font-medium ${config.color}`}
          >
            {config.name}
          </CardTitle>
          <Image
            src={config.iconUrl || "/placeholder.svg"}
            alt={`${config.name} icon`}
            width={28}
            height={28}
            className={`w-7 h-7 sm:w-8 sm:h-8 ${config.color}`}
          />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div
            className={`text-base sm:text-lg font-bold leading-tight ${config.color}`}
          >
            {formatCurrency(balance, cryptoCurrency)}
          </div>
          <p className={`text-xs mt-1 ${config.color} opacity-70`}>
            {cryptoCurrency} {t.wallet}
          </p>
        </CardContent>
      </Card>
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const loadingRef = useRef(false);
  const [accountActivities, setAccountActivities] = useState<AccountActivity[]>(
    []
  );
  const [combinedActivities, setCombinedActivities] = useState<
    CombinedActivity[]
  >([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState<WelcomeMessage | null>(
    null
  );
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasCheckedWelcome, setHasCheckedWelcome] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<
    LatestMessage | WelcomeMessage | null
  >(null);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(
    new Set()
  );
  const [showAllActivities, setShowAllActivities] = useState(false);
  // Add state for crypto balances
  const [cryptoBalances, setCryptoBalances] = useState<Record<string, number>>({
    BTC: 0,
    ETH: 0,
    USDT: 0,
  });
  // Add state for user data from users table
  const [userData, setUserData] = useState<UserData | null>(null);
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

  const getActivityIcon = useCallback((activity: CombinedActivity) => {
    const a = activity.data as AccountActivity;
    switch (a.activity_type) {
      case "admin_notification":
        return <Building2 className="h-5 w-5" />;
      case "system_update":
        return <Activity className="h-5 w-5" />;
      case "security_alert":
        return <AlertTriangle className="h-5 w-5" />;
      case "account_notice":
        return <Info className="h-5 w-5" />;
      case "service_announcement":
        return <Send className="h-5 w-5" />;
      case "account_credit":
        return <ArrowDownLeft className="h-5 w-5" />;
      case "account_debit":
        return <ArrowUpRight className="h-5 w-5" />;
      case "wire_transfer":
        return <ArrowUpRight className="h-5 w-5" />;
      case "fraud_alert":
        return <Shield className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  }, []);

  const getActivityDescription = useCallback((activity: CombinedActivity, t: ReturnType<typeof getTranslations>) => {
    const accountActivity = activity.data as AccountActivity;

    const title = accountActivity.title?.toLowerCase() || "";

    if (title.includes("administrative balance adjustment")) {
      return t.balanceUpdated;
    }
    if (title.includes("administrative credit")) {
      return "Manual Credit";
    }
    if (title.includes("administrative debit")) {
      return "Manual Debit";
    }
    if (title.includes("administrative crypto deposit")) {
      return t.cryptoDeposit;
    }
    if (title.includes("administrative crypto debit")) {
      return t.cryptoWithdrawal;
    }

    switch (accountActivity.activity_type) {
      case "admin_notification":
        return "Administrative Notice";
      case "system_update":
        return "System Update";
      case "security_alert":
        return "Security Alert";
      case "account_notice":
        return "Account Notice";
      case "service_announcement":
        return "Service Announcement";
      case "account_credit":
        return "Account Credited";
      case "account_debit":
        return "Account Debited";
      case "wire_transfer":
        return "Wire Transfer";
      case "fraud_alert":
        return "Fraud Alert";
      case "statement_ready":
        return "Statement Ready";
      default:
        return (
          accountActivity.title
            ?.replace(/^Administrative\s*/i, "")
            ?.replace(/ - .*/g, "")
            ?.trim() || "Account Activity"
        );
    }
  }, []);

  const getActivityAmount = useCallback((activity: CombinedActivity) => {
    const accountActivity = activity.data as AccountActivity;
    if (
      accountActivity.display_amount &&
      accountActivity.display_amount !== 0
    ) {
      const sign = accountActivity.display_amount > 0 ? "+" : "";
      return `${sign}${Number(
        accountActivity.display_amount
      ).toLocaleString()} ${accountActivity.currency.toUpperCase()}`;
    }
    return null;
  }, []);

  const getActivityColor = useCallback((activity: CombinedActivity) => {
    // Use neutral colors with #b91c1c accent
    return "border-gray-200 bg-gray-50/30 hover:border-[#b91c1c]/30";
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-[#b91c1c] text-white border-[#b91c1c]";
      case "high":
        return "bg-[#b91c1c]/20 text-[#b91c1c] border-[#b91c1c]/30";
      case "normal":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "low":
        return "bg-gray-50 text-gray-600 border-gray-100";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }, []);

  const toggleActivityExpansion = useCallback((activityId: string) => {
    setExpandedActivities((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(activityId)) {
        newExpanded.delete(activityId);
      } else {
        newExpanded.add(activityId);
      }
      return newExpanded;
    });
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

        const { data: existingPayments } = await supabase
          .from("payments")
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
          (existingTransfers && existingTransfers.length > 0) ||
          (existingPayments && existingPayments.length > 0);

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
    let mounted = true;
    const abortController = new AbortController();

    const fetchPayments = async () => {
      try {
        if (!userProfile?.id) return;

        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", userProfile.id)
          .order("created_at", { ascending: false })
          .limit(10)
          .abortSignal(abortController.signal);

        if (!mounted) return;

        if (error) {
          if (error.message?.includes('aborted') || error.name === 'AbortError') {
            console.log('[Payments] Request aborted');
            return;
          }
          console.error("Error fetching payments:", error);
          return;
        }

        setPayments(data || []);
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          console.log('[Payments] Fetch aborted');
          return;
        }
        console.error("Error fetching payments:", error);
      } finally {
        if (mounted) {
          setPaymentsLoading(false);
        }
      }
    };

    fetchPayments();

    const setupPaymentsSubscription = async () => {
      if (!userProfile?.id) return;

      const paymentsSubscription = supabase
        .channel("payments_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments",
            filter: `user_id=eq.${userProfile.id}`,
          },
          () => {
            fetchPayments();
          }
        )
        .subscribe();

      return () => {
        paymentsSubscription.unsubscribe();
      };
    };

    const cleanup = setupPaymentsSubscription();
    return () => {
      mounted = false;
      abortController.abort();
      cleanup?.then((fn) => fn?.());
    };
  }, []);

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;
    const abortController = new AbortController();

    const fetchActivities = async () => {
      setActivitiesLoading(true);
      try {
        if (!userProfile?.id) return;

        console.log("Fetching transaction history for:", {
          user_id: userProfile.id,
        });

        const { data, error } = await supabase
          .from("TransactionHistory")
          .select("*")
          .eq("uuid", userProfile.id)
          .order("created_at", { ascending: false })
          .limit(50)
          .abortSignal(abortController.signal);

        if (!mounted) return;

        if (error) {
          if (error.message?.includes('aborted') || error.name === 'AbortError') {
            console.log('[Activities] Request aborted');
            return;
          }
          console.error("Error fetching transaction history:", error);
          return;
        }

        console.log("Fetched transaction history:", data);

        const sorted = (data || []).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setCombinedActivities(
          sorted.map((a) => ({
            id: String(a.id),
            type: "account_activity" as const,
            created_at: a.created_at,
            data: a,
          }))
        );
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
          console.log('[Activities] Fetch aborted');
          return;
        }
        console.error("Error fetching transaction history:", err);
      } finally {
        if (mounted) {
          setActivitiesLoading(false);
        }
      }
    };

    const setupRealtime = async () => {
      if (!userProfile?.id) return;

      subscription = supabase
        .channel(`transaction_history_realtime_${userProfile.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "TransactionHistory",
            filter: `uuid=eq.${userProfile.id}`,
          },
          () => fetchActivities()
        )
        .subscribe();
    };

    fetchActivities();
    setupRealtime();

    return () => {
      mounted = false;
      abortController.abort();
      if (subscription) subscription.unsubscribe();
    };
  }, [userProfile.client_id]);

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
  const deferredActivities = useDeferredValue(combinedActivities);
  // Memoized activities display
  const activitiesDisplay = useMemo(() => {
    const displayActivities = showAllActivities
      ? deferredActivities
      : deferredActivities.slice(0, 3);

    return displayActivities.map((activity) => {
      const isExpanded = expandedActivities.has(activity.id);
      const activityData = activity.data;

      const isTransactionHistory = "thType" in activityData;

      const title = isTransactionHistory
        ? (activityData as TransactionHistory).thType
        : (() => {
            const text = getActivityDescription(activity, t);
            switch (text) {
              case "Manual Credit":
              case "Account Credited":
                return t.depositReceived;
              case "Manual Debit":
              case "Account Debited":
                return t.fundsWithdrawn;
              case t.balanceUpdated:
                return t.balanceUpdated;
              case t.cryptoDeposit:
                return t.cryptoDeposit;
              case t.cryptoWithdrawal:
                return t.cryptoWithdrawal;
              default:
                return text;
            }
          })();

      const description = isTransactionHistory
        ? (activityData as TransactionHistory).thDetails
        : null;

      const pointOfInteraction = isTransactionHistory
        ? (activityData as TransactionHistory).thPoi
        : null;

      const status = isTransactionHistory
        ? (activityData as TransactionHistory).thStatus
        : null;

      const shouldShowExpand = description && description.length > 100;

      return (
        <div
          key={activity.id}
          className={`transition-all duration-200 hover:bg-gray-50/50 border-gray-200 bg-gray-50/30 hover:border-[#b91c1c]/30 border-l-4 hover:border-l-[#b91c1c]`}
        >
          <div className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 sm:mb-3">
                    <h4 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 leading-tight">
                      {title}
                    </h4>
                    {status && (
                      <Badge
                        className={`text-xs font-medium border mt-1 sm:mt-0 self-start ${
                          status.toLowerCase() === "successful"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        {status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <div className="mb-3 sm:mb-4">
                      <div
                        className={`text-xs sm:text-sm text-gray-700 leading-relaxed ${
                          !isExpanded && shouldShowExpand ? "line-clamp-3" : ""
                        }`}
                      >
                        {description.split("\n").map((line, index) => (
                          <div key={index} className={index > 0 ? "mt-2" : ""}>
                            {line}
                          </div>
                        ))}
                      </div>
                      {shouldShowExpand && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActivityExpansion(activity.id)}
                          className="mt-2 text-[#b91c1c] hover:text-[#b91c1c] hover:bg-[#b91c1c]/10 p-0 h-auto font-medium text-xs sm:text-sm"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {t.showLess}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {t.readMore}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                  {pointOfInteraction && (
                    <div className="mb-2 sm:mb-3">
                      <span className="text-xs text-gray-600">
                        <strong>{t.pointOfInteraction}:</strong>{" "}
                        {pointOfInteraction}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">
                        {new Date(activity.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}{" "}
                        at{" "}
                        {new Date(activity.created_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                <Badge className="text-xs px-2 sm:px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200">
                  {status || t.active}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }, [
    combinedActivities,
    showAllActivities,
    expandedActivities,
    toggleActivityExpansion,
    getActivityDescription,
    t,
  ]);

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
                className="bg-white p-4 sm:p-6 rounded-lg shadow animate-pulse"
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
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#b91c1c] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
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

        {/* Balance Cards - Traditional currencies on top row, crypto on bottom row */}
        <div className="space-y-3 sm:space-y-6 mb-6 sm:mb-8">
          {/* Traditional Currency Cards - USD, EUR, CAD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {traditionalBalanceCards}
          </div>

          {/* Crypto Currency Cards - BTC, ETH, USDT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {cryptoBalanceCards}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            onClick={handleTransferClick}
            className="h-12 sm:h-16 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-sm sm:text-base"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.transferMoney}
          </Button>
          <Button
            onClick={handleDepositClick}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent"
          >
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.depositFunds}
          </Button>
          <Button
            onClick={handleCryptoClick}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent"
          >
            <Bitcoin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.cryptoTrading}
          </Button>
          <Button
            onClick={handleCardClick}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent"
          >
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.manageCards}
          </Button>
          <Button
            onClick={() => setActiveTab("loans")}
            variant="outline"
            className="h-12 sm:h-16 text-sm sm:text-base bg-transparent border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
          >
            <Banknote className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t.applyForLoan}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Account Activity Card */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-[#fef2f2] border-b p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#b91c1c]" />
                  {t.accountActivity}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activitiesLoading ? (
                  <div className="space-y-2 p-4 sm:p-6">
                    {[1, 2, 3].map((i) => (
                      <LoadingActivity key={i} />
                    ))}
                  </div>
                ) : combinedActivities.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-gray-500 p-4 sm:p-6">
                    <Send className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm">
                      {isNewUser
                        ? t.firstTransactionMessage
                        : t.noAccountActivity}
                    </p>
                    <p className="text-xs mt-1">
                      {isNewUser
                        ? t.startDepositMessage
                        : t.transactionsAppearMessage}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {activitiesDisplay}
                    {combinedActivities.length > 3 && (
                      <div className="p-4 text-center border-t border-gray-100">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setShowAllActivities(!showAllActivities)
                          }
                          className="text-[#b91c1c] hover:text-[#b91c1c] hover:bg-[#b91c1c]/10 font-medium"
                        >
                          {showAllActivities ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              {t.showLess}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              {t.readMore} ({combinedActivities.length - 3} {t.more})
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Payments Card */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t.payments}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                {paymentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <LoadingActivity key={i} />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm">
                      {isNewUser ? t.noPaymentsYet : t.noRecentPayments}
                    </p>
                    <p className="text-xs mt-1">
                      {isNewUser
                        ? t.paymentHistoryAppearMessage
                        : t.paymentHistoryMessage}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payments.slice(0, 6).map((payment) => (
                      <div
                        key={payment.id}
                        className="py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate">
                              {payment.payment_type}
                            </span>
                            <span className="text-xs text-gray-600 block truncate">
                              {payment.description || "Payment transaction"}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className="text-sm font-medium block">
                              {formatCurrency(payment.amount, payment.currency)}
                            </span>
                            <Badge
                              variant={
                                payment.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs mt-1"
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Now only contains Tax Card and Mobile Banking Card */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Tax Card */}
            <TaxCard userProfile={userProfile} setActiveTab={setActiveTab} />

            {/* Latest Message Card - Now positioned between Activity and Payments */}
            <Card>
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
                  <div className="p-3 rounded-lg bg-gray-100 animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : currentMessage ? (
                  <div
                    className={`p-3 sm:p-4 rounded-lg border-l-4 transition-opacity ${
                      currentMessage.message_type === "welcome"
                        ? "border-[#b91c1c] bg-gradient-to-r from-orange-50 to-yellow-50"
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

            {/* Mobile Banking Card Image */}
            <Card className="flex justify-center items-center p-4 sm:p-6">
              <Image
                src="/db/1.png"
                alt="Mobile Banking Card"
                width={200}
                height={300}
                className="object-contain max-w-full h-auto"
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardContent);
