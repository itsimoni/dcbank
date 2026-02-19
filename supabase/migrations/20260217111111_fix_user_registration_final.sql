/*
  # Fix User Registration and RLS Policies

  ## Overview
  This migration fixes user registration by:
  1. Adding missing columns to users table
  2. Creating auto-insert trigger for new auth users
  3. Setting up proper RLS policies
  
  ## Changes
  - Adds kyc_status, is_admin, is_manager columns to users table
  - Creates trigger to auto-create users in public tables
  - Sets up RLS policies for users, profiles, and balance tables
*/

-- Add missing columns to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kyc_status') THEN
    ALTER TABLE public.users ADD COLUMN kyc_status character varying(20) DEFAULT 'not_started';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin') THEN
    ALTER TABLE public.users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_manager') THEN
    ALTER TABLE public.users ADD COLUMN is_manager boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_superiormanager') THEN
    ALTER TABLE public.users ADD COLUMN is_superiormanager boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'bank_origin') THEN
    ALTER TABLE public.users ADD COLUMN bank_origin text NOT NULL DEFAULT 'Malta Global Crypto Bank';
  END IF;
END $$;

-- Create function to auto-create user in public tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, full_name, kyc_status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'not_started',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  
  -- Initialize balances
  INSERT INTO public.usd_balances (user_id, balance) VALUES (NEW.id, 0.00) ON CONFLICT DO NOTHING;
  INSERT INTO public.euro_balances (user_id, balance) VALUES (NEW.id, 0.00) ON CONFLICT DO NOTHING;
  INSERT INTO public.cad_balances (user_id, balance) VALUES (NEW.id, 0.00) ON CONFLICT DO NOTHING;
  INSERT INTO public.newcrypto_balances (user_id, btc_balance, eth_balance, usdt_balance) 
    VALUES (NEW.id, 0.00000000, 0.00000000, 0.000000) ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usd_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.euro_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cad_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newcrypto_balances ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('users', 'profiles', 'usd_balances', 'euro_balances', 'cad_balances', 'newcrypto_balances')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.' || quote_ident(pol.tablename);
  END LOOP;
END $$;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles table policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- USD balance policies
CREATE POLICY "Users can read own usd balance"
  ON public.usd_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usd balance"
  ON public.usd_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- EUR balance policies
CREATE POLICY "Users can read own euro balance"
  ON public.euro_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own euro balance"
  ON public.euro_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- CAD balance policies
CREATE POLICY "Users can read own cad balance"
  ON public.cad_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cad balance"
  ON public.cad_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Newcrypto balance policies
CREATE POLICY "Users can read own newcrypto balance"
  ON public.newcrypto_balances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own newcrypto balance"
  ON public.newcrypto_balances FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
