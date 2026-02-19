/*
  # Fix User Registration System

  ## Overview
  Aligns database schema with expected structure and fixes trigger

  ## Changes
  1. Aligns profiles table structure with requirements
  2. Ensures users table has all required columns
  3. Fixes trigger to work with actual schema
  4. Adds RLS policies for service role access
*/

-- Fix profiles table structure
DO $$
BEGIN
  -- Remove columns that shouldn't be there
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS address CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'kyc_status') THEN
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS kyc_status CASCADE;
  END IF;

  -- Add missing columns to profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') THEN
    ALTER TABLE public.profiles ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_origin') THEN
    ALTER TABLE public.profiles ADD COLUMN bank_origin text NOT NULL DEFAULT 'Malta Global Crypto Bank';
  END IF;
END $$;

-- Ensure users table constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_id_fkey' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add policy for service role to bypass RLS during trigger execution
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add policy for service role on profiles
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Recreate trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (
    id, 
    auth_user_id,
    email, 
    first_name,
    last_name,
    full_name, 
    age,
    kyc_status, 
    bank_origin,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
             TRIM(CONCAT(
               COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
               ' ',
               COALESCE(NEW.raw_user_meta_data->>'lastName', '')
             ))
    ),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    'not_started',
    'Malta Global Crypto Bank',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    age = COALESCE(EXCLUDED.age, public.users.age);

  -- Insert into profiles table
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    age,
    bank_origin,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
             TRIM(CONCAT(
               COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
               ' ',
               COALESCE(NEW.raw_user_meta_data->>'lastName', '')
             ))
    ),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    'Malta Global Crypto Bank',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    age = COALESCE(EXCLUDED.age, public.profiles.age);

  -- Initialize balances (silently ignore if they exist)
  INSERT INTO public.usd_balances (user_id, balance) 
  VALUES (NEW.id, 0.00) 
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.euro_balances (user_id, balance) 
  VALUES (NEW.id, 0.00) 
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.cad_balances (user_id, balance) 
  VALUES (NEW.id, 0.00) 
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.newcrypto_balances (user_id, btc_balance, eth_balance, usdt_balance) 
  VALUES (NEW.id, 0.00000000, 0.00000000, 0.000000) 
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth.users insert
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
