/*
  # Fix Trigger Metadata Keys

  ## Overview
  Updates trigger to use correct metadata keys from auth form
  
  ## Changes
  - Changes firstName -> first_name
  - Changes lastName -> last_name
  - Matches the actual keys sent by the registration form
*/

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
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
             TRIM(CONCAT(
               COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
               ' ',
               COALESCE(NEW.raw_user_meta_data->>'last_name', '')
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
               COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
               ' ',
               COALESCE(NEW.raw_user_meta_data->>'last_name', '')
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

  -- Initialize balances
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
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$;
