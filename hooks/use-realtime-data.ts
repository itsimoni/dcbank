"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { priceService } from "@/lib/price-service";
import { useAuth } from "@/contexts/AuthContext";

interface RealtimeData {
  balances: {
    usd: number;
    euro: number;
    cad: number;
    crypto: number;
    btc: number;
    eth: number;
    usdt: number;
  };
  exchangeRates: {
    usd_to_eur: number;
    usd_to_cad: number;
    eur_to_usd: number;
    cad_to_usd: number;
  };
  cryptoPrices: {
    bitcoin: number;
    ethereum: number;
  };
  messages: any[];
  deposits: any[];
  cryptoTransactions: any[];
  loading: boolean;
  error: string | null;
}

interface UseRealtimeDataOptions {
  initialBalances?: {
    usd: number;
    euro: number;
    cad: number;
  };
  initialCryptoBalances?: {
    BTC: number;
    ETH: number;
    USDT: number;
  };
}

export function useRealtimeData(options?: UseRealtimeDataOptions): RealtimeData {
  const { user, loading: authLoading } = useAuth();
  const initRef = useRef(false);

  const initialBal = options?.initialBalances;
  const initialCrypto = options?.initialCryptoBalances;

  const [data, setData] = useState<RealtimeData>({
    balances: {
      usd: initialBal?.usd ?? 0,
      euro: initialBal?.euro ?? 0,
      cad: initialBal?.cad ?? 0,
      crypto: 0,
      btc: initialCrypto?.BTC ?? 0,
      eth: initialCrypto?.ETH ?? 0,
      usdt: initialCrypto?.USDT ?? 0,
    },
    exchangeRates: {
      usd_to_eur: 0.85,
      usd_to_cad: 1.35,
      eur_to_usd: 1.18,
      cad_to_usd: 0.74,
    },
    cryptoPrices: { bitcoin: 85000, ethereum: 3200 },
    messages: [],
    deposits: [],
    cryptoTransactions: [],
    loading: !initialBal,
    error: null,
  });

  const fetchBalances = async (userId: string) => {
    try {
      const [usdResult, euroResult, cadResult, cryptoResult, newCryptoResult] =
        await Promise.all([
          supabase
            .from("usd_balances")
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("euro_balances")
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("cad_balances")
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("crypto_balances")
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("newcrypto_balances")
            .select("btc_balance, eth_balance, usdt_balance")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

      return {
        usd: usdResult.data?.balance || 0,
        euro: euroResult.data?.balance || 0,
        cad: cadResult.data?.balance || 0,
        crypto: cryptoResult.data?.balance || 0,
        btc: newCryptoResult.data?.btc_balance || 0,
        eth: newCryptoResult.data?.eth_balance || 0,
        usdt: newCryptoResult.data?.usdt_balance || 0,
      };
    } catch (error) {
      console.error("Error fetching balances:", error);
      return { usd: 0, euro: 0, cad: 0, crypto: 0, btc: 0, eth: 0, usdt: 0 };
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const rates = await priceService.getExchangeRates();
      return {
        usd_to_eur: rates?.USD ? 1 / rates.USD : 0.92,
        usd_to_cad: rates?.USD && rates?.CAD ? rates.CAD / rates.USD : 1.35,
        eur_to_usd: rates?.USD || 1.087,
        cad_to_usd: rates?.CAD ? 1 / rates.CAD : 0.74,
      };
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      return {
        usd_to_eur: 0.92,
        usd_to_cad: 1.35,
        eur_to_usd: 1.087,
        cad_to_usd: 0.74,
      };
    }
  };

  const fetchCryptoPrices = async () => {
    try {
      const prices = await priceService.getCryptoPrices();
      return {
        bitcoin: Math.round(prices.bitcoin?.eur || 85000),
        ethereum: Math.round(prices.ethereum?.eur || 3200),
      };
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      return {
        bitcoin: 85000,
        ethereum: 3200,
      };
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching messages:", error.message || error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching messages:", error.message || error);
      return [];
    }
  };

  const fetchDeposits = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .eq("uuid", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching deposits:", error.message || error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error("Error fetching deposits:", error.message || error);
      return [];
    }
  };

  const fetchCryptoTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("crypto_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error(
          "Error fetching crypto transactions:",
          error.message || error
        );
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error(
        "Error fetching crypto transactions:",
        error.message || error
      );
      return [];
    }
  };

  const initializeData = async (userId: string) => {
    try {
      const hasInitialBalances = initialBal && initialCrypto;

      if (hasInitialBalances) {
        const [messages, deposits, cryptoTransactions] = await Promise.all([
          fetchMessages(userId),
          fetchDeposits(userId),
          fetchCryptoTransactions(userId),
        ]);

        setData((prev) => ({
          ...prev,
          messages,
          deposits,
          cryptoTransactions,
          loading: false,
          error: null,
        }));

        Promise.all([fetchExchangeRates(), fetchCryptoPrices()]).then(([exchangeRates, cryptoPrices]) => {
          setData((prev) => ({ ...prev, exchangeRates, cryptoPrices }));
        }).catch(() => {});
      } else {
        setData((prev) => ({ ...prev, loading: true, error: null }));

        const [balances, exchangeRates, cryptoPrices, messages, deposits, cryptoTransactions] = await Promise.all([
          fetchBalances(userId),
          fetchExchangeRates(),
          fetchCryptoPrices(),
          fetchMessages(userId),
          fetchDeposits(userId),
          fetchCryptoTransactions(userId),
        ]);

        setData({
          balances,
          exchangeRates,
          cryptoPrices,
          messages,
          deposits,
          cryptoTransactions,
          loading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error("Error initializing data:", error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load data",
      }));
    }
  };

  const setupRealtimeSubscriptions = (userId: string) => {
    const balanceSubscription = supabase
      .channel("balance_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usd_balances",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBalances(userId).then((balances) => {
            setData((prev) => ({ ...prev, balances }));
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "euro_balances",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBalances(userId).then((balances) => {
            setData((prev) => ({ ...prev, balances }));
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cad_balances",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBalances(userId).then((balances) => {
            setData((prev) => ({ ...prev, balances }));
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crypto_balances",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBalances(userId).then((balances) => {
            setData((prev) => ({ ...prev, balances }));
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "newcrypto_balances",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBalances(userId).then((balances) => {
            setData((prev) => ({ ...prev, balances }));
          });
        }
      )
      .subscribe();

    // Subscribe to message changes
    const messageSubscription = supabase
      .channel("message_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_messages",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchMessages(userId).then((messages) => {
            setData((prev) => ({ ...prev, messages }));
          });
        }
      )
      .subscribe();

    // Subscribe to deposits changes
    const depositsSubscription = supabase
      .channel("deposits_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deposits",
          filter: `uuid=eq.${userId}`,
        },
        () => {
          fetchDeposits(userId).then((deposits) => {
            setData((prev) => ({ ...prev, deposits }));
          });
        }
      )
      .subscribe();

    // Subscribe to crypto transaction changes
    const cryptoTransactionSubscription = supabase
      .channel("crypto_transaction_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crypto_transactions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCryptoTransactions(userId).then((cryptoTransactions) => {
            setData((prev) => ({ ...prev, cryptoTransactions }));
          });
          // Also refresh balances when crypto transaction status changes
          fetchBalances(userId).then((balances) => {
            setData((prev) => ({ ...prev, balances }));
          });
        }
      )
      .subscribe();

    return () => {
      balanceSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      depositsSubscription.unsubscribe();
      cryptoTransactionSubscription.unsubscribe();
    };
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.hidden) return;
        fetchExchangeRates().then((exchangeRates) => {
          setData((prev) => ({ ...prev, exchangeRates }));
        });
        fetchCryptoPrices().then((cryptoPrices) => {
          setData((prev) => ({ ...prev, cryptoPrices }));
        });
      }, 30000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && intervalId === null) {
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: "User not authenticated",
      }));
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    initializeData(user.id);
    const cleanup = setupRealtimeSubscriptions(user.id);

    return () => {
      cleanup?.();
    };
  }, [user, authLoading]);

  return data;
}
