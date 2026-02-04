'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getSupabase() {
  if (typeof window === 'undefined') {
    console.warn('[Supabase] Running on server, returning null')
    return null
  }

  if (supabaseInstance) {
    console.log('[Supabase] Returning existing instance')
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('[Supabase] Initializing client', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    userAgent: navigator.userAgent
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing env variables')
    throw new Error('Missing Supabase environment variables')
  }

  let storage: any = undefined
  try {
    if (window.localStorage) {
      window.localStorage.setItem('__test__', 'test')
      window.localStorage.removeItem('__test__')
      storage = window.localStorage
      console.log('[Supabase] LocalStorage available')
    }
  } catch (e) {
    console.warn('[Supabase] LocalStorage blocked, using memory storage')
    storage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage,
      storageKey: 'supabase.auth.token',
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    global: {
      headers: {
        "x-application-name": "dashboard-app",
      },
      fetch: (url, options = {}) => {
        console.log('[Supabase] Fetch:', url.substring(0, 50))
        return fetch(url, options).catch(err => {
          console.error('[Supabase] Fetch error:', err)
          throw err
        })
      },
    },
  })

  console.log('[Supabase] Client initialized successfully')
  return supabaseInstance
}

export const supabase = getSupabase()!

export interface CryptoWallet {
  id: string;
  user_id?: string;
  crypto_type: 'bitcoin' | 'ethereum' | 'usdt_erc20' | 'usdt_trc20';
  wallet_address: string;
  label: string;
  symbol: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface UserBankDetails {
  id: string;
  user_id: string;
  beneficiary: string;
  iban: string;
  bic: string;
  bank_name: string;
  created_at: string;
  updated_at: string;
}

export interface FundAccount {
  id: string;
  user_id: string;
  funding_method: 'crypto' | 'bank';
  status: 'pending' | 'success';
  amount: number;
  currency: string;
  user_name: string;
  user_email: string;
  crypto_type?: 'bitcoin' | 'ethereum' | 'tron';
  crypto_address?: string;
  bank_beneficiary?: string;
  bank_iban?: string;
  bank_bic?: string;
  bank_name?: string;
  reference_number?: string;
  created_at: string;
  updated_at: string;
}

export type User = {
  id: string
  email: string | null
  password: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  age: number | null
  created_at: string | null
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected'
  is_admin: boolean
}
