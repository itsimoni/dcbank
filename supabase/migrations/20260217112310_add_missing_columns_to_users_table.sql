/*
  # Add Missing Columns to Users Table

  ## Overview
  Adds missing columns to the users table for proper user registration
  
  ## Changes
  1. Adds first_name, last_name, age, auth_user_id columns to users table
  2. Updates trigger to populate all fields correctly
*/

-- Add missing columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'age'
  ) THEN
    ALTER TABLE public.users ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update the handle_new_user function to include all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table with all metadata
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
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    'not_started',
    COALESCE(NEW.raw_user_meta_data->>'bank_origin', 'Malta Global Crypto Bank'),
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    COALESCE(NEW.raw_user_meta_data->>'bank_origin', 'Malta Global Crypto Bank'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    age = COALESCE(EXCLUDED.age, public.profiles.age);

  -- Initialize balances
  INSERT INTO public.usd_balances (user_id, balance) VALUES (NEW.id, 0.00) ON CONFLICT DO NOTHING;
  INSERT INTO public.euro_balances (user_id, balance) VALUES (NEW.id, 0.00) ON CONFLICT DO NOTHING;
  INSERT INTO public.cad_balances (user_id, balance) VALUES (NEW.id, 0.00) ON CONFLICT DO NOTHING;
  INSERT INTO public.newcrypto_balances (user_id, btc_balance, eth_balance, usdt_balance) 
  VALUES (NEW.id, 0.00000000, 0.00000000, 0.000000) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
