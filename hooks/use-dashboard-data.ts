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

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    userProfile: null,
    balances: { usd: 0, euro: 0, cad: 0 },
    cryptoBalances: { BTC: 0, ETH: 0, USDT: 0 },
    transactions: [],
    userData: null,
    loading: true,
    error: null,
  });

  const mountedRef = useRef(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchAllData = async () => {
      try {
        // Step 1: Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        if (!mountedRef.current) return;

        // Step 2: Fetch ALL data in parallel (not sequential!)
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

        if (!mountedRef.current) return;

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

        if (!mountedRef.current) return;

        setData({
          userProfile: profile,
          balances,
          cryptoBalances,
          transactions,
          userData,
          loading: false,
          error: null,
        });

      } catch (error: any) {
        console.error('Dashboard data fetch error:', error);
        if (mountedRef.current) {
          setData(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Failed to load dashboard data',
          }));
        }
      }
    };

    fetchAllData();
  }, []);

  return data;
}
