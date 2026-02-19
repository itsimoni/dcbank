import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface CryptoBalances {
  BTC: number;
  ETH: number;
  USDT: number;
}

export interface Balances {
  usd: number;
  euro: number;
  cad: number;
}

export interface TransactionHistory {
  id: number;
  created_at: string;
  thType: string;
  thDetails: string;
  thPoi: string;
  thStatus: string;
  uuid: string;
  thEmail: string | null;
}

export interface UserData {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
}

export interface DashboardData {
  userProfile: UserProfile | null;
  balances: Balances;
  cryptoBalances: CryptoBalances;
  transactions: TransactionHistory[];
  userData: UserData | null;
  loading: boolean;
  error: string | null;
}

// GLOBAL CACHE - persists across component mounts
const globalCache = {
  data: null as DashboardData | null,
  timestamp: 0,
  isLoading: false,
  CACHE_DURATION: 30000, // 30 seconds
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(() => {
    // Initialize with cached data if available and fresh
    if (globalCache.data && Date.now() - globalCache.timestamp < globalCache.CACHE_DURATION) {
      return globalCache.data;
    }
    return {
      userProfile: null,
      balances: { usd: 0, euro: 0, cad: 0 },
      cryptoBalances: { BTC: 0, ETH: 0, USDT: 0 },
      transactions: [],
      userData: null,
      loading: true,
      error: null,
    };
  });

  const mountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Check if we have fresh cached data
    const isCacheFresh = globalCache.data &&
      Date.now() - globalCache.timestamp < globalCache.CACHE_DURATION;

    if (isCacheFresh) {
      // Use cached data instead of fetching
      if (!hasInitializedRef.current) {
        setData(globalCache.data!);
        hasInitializedRef.current = true;
      }
      return;
    }

    // Prevent duplicate fetches
    if (hasInitializedRef.current || globalCache.isLoading) {
      return;
    }

    hasInitializedRef.current = true;
    globalCache.isLoading = true;

    const fetchAllData = async () => {
      try {
        // Step 1: Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        if (!mountedRef.current) {
          globalCache.isLoading = false;
          return;
        }

        // Step 2: Fetch ALL data in parallel
        const [
          profileResult,
          usdResult,
          euroResult,
          cadResult,
          cryptoResult,
          transactionsResult,
          userDataResult,
        ] = await Promise.allSettled([
          // Profile
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),

          // Balances
          supabase.from('usd_balances').select('balance').eq('user_id', user.id).maybeSingle(),
          supabase.from('euro_balances').select('balance').eq('user_id', user.id).maybeSingle(),
          supabase.from('cad_balances').select('balance').eq('user_id', user.id).maybeSingle(),

          // Crypto balances
          supabase.from('newcrypto_balances').select('btc_balance, eth_balance, usdt_balance').eq('user_id', user.id).maybeSingle(),

          // Transaction history (limit to 2 most recent)
          supabase.from('TransactionHistory').select('*').eq('uuid', user.id).order('created_at', { ascending: false }).limit(2),

          // User data from users table
          supabase.from('users').select('first_name, last_name, full_name, email').eq('id', user.id).maybeSingle(),
        ]);

        if (!mountedRef.current) {
          globalCache.isLoading = false;
          return;
        }

        // Extract profile or create it
        let profile: UserProfile;
        if (profileResult.status === 'fulfilled' && profileResult.value.data) {
          profile = profileResult.value.data;
        } else {
          // Create profile if it doesn't exist
          const clientId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          const newProfile = {
            id: user.id,
            client_id: clientId,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })
            .select()
            .single();

          if (createError || !createdProfile) {
            throw new Error('Failed to create profile');
          }

          profile = createdProfile;
        }

        // Extract balances
        const balances: Balances = {
          usd: usdResult.status === 'fulfilled' && usdResult.value.data ? Number(usdResult.value.data.balance) || 0 : 0,
          euro: euroResult.status === 'fulfilled' && euroResult.value.data ? Number(euroResult.value.data.balance) || 0 : 0,
          cad: cadResult.status === 'fulfilled' && cadResult.value.data ? Number(cadResult.value.data.balance) || 0 : 0,
        };

        // Extract crypto balances
        const cryptoBalances: CryptoBalances = {
          BTC: cryptoResult.status === 'fulfilled' && cryptoResult.value.data ? Number(cryptoResult.value.data.btc_balance) || 0 : 0,
          ETH: cryptoResult.status === 'fulfilled' && cryptoResult.value.data ? Number(cryptoResult.value.data.eth_balance) || 0 : 0,
          USDT: cryptoResult.status === 'fulfilled' && cryptoResult.value.data ? Number(cryptoResult.value.data.usdt_balance) || 0 : 0,
        };

        // Extract transactions
        const transactions: TransactionHistory[] =
          transactionsResult.status === 'fulfilled' && transactionsResult.value.data
            ? transactionsResult.value.data
            : [];

        // Extract user data
        const userData: UserData | null =
          userDataResult.status === 'fulfilled' && userDataResult.value.data
            ? userDataResult.value.data
            : null;

        const newData: DashboardData = {
          userProfile: profile,
          balances,
          cryptoBalances,
          transactions,
          userData,
          loading: false,
          error: null,
        };

        if (mountedRef.current) {
          // Update global cache
          globalCache.data = newData;
          globalCache.timestamp = Date.now();
          globalCache.isLoading = false;

          setData(newData);
        }

      } catch (error: any) {
        console.error('Dashboard data fetch error:', error);
        globalCache.isLoading = false;

        if (mountedRef.current) {
          const errorData = {
            userProfile: null,
            balances: { usd: 0, euro: 0, cad: 0 },
            cryptoBalances: { BTC: 0, ETH: 0, USDT: 0 },
            transactions: [],
            userData: null,
            loading: false,
            error: error.message || 'Failed to load dashboard data',
          };
          setData(errorData);
        }
      }
    };

    fetchAllData();
  }, []);

  // Set up real-time subscriptions for data updates (optional but recommended)
  useEffect(() => {
    if (!data.userProfile?.id) return;

    const userId = data.userProfile.id;

    // Subscribe to balance changes
    const balanceChannel = supabase
      .channel(`balance-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usd_balances',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate cache on balance change
          globalCache.timestamp = 0;
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'euro_balances',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          globalCache.timestamp = 0;
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cad_balances',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          globalCache.timestamp = 0;
        }
      )
      .subscribe();

    // Subscribe to crypto balance changes
    const cryptoChannel = supabase
      .channel(`crypto-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'newcrypto_balances',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          globalCache.timestamp = 0;
        }
      )
      .subscribe();

    // Subscribe to transaction changes
    const txChannel = supabase
      .channel(`tx-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'TransactionHistory',
          filter: `uuid=eq.${userId}`,
        },
        () => {
          globalCache.timestamp = 0;
        }
      )
      .subscribe();

    return () => {
      balanceChannel.unsubscribe();
      cryptoChannel.unsubscribe();
      txChannel.unsubscribe();
    };
  }, [data.userProfile?.id]);

  return data;
}

// Export function to manually invalidate cache (useful for manual refresh)
export function invalidateDashboardCache() {
  globalCache.timestamp = 0;
  globalCache.data = null;
}
