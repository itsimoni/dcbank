/*
  # Fix trigger to save password from user metadata

  1. Changes
    - Updates handle_new_user trigger to save plain_password from metadata
    - Saves all user fields: email, first_name, last_name, full_name, age, password, bank_origin

  2. Security
    - Password stored as plain text per user requirement
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  RAISE LOG 'Trigger fired for user: % with email: %', NEW.id, NEW.email;

  INSERT INTO public.users (
    id, 
    auth_user_id,
    email, 
    first_name,
    last_name,
    full_name, 
    password,
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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      ))
    ),
    NEW.raw_user_meta_data->>'plain_password',
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    'not_started',
    COALESCE(NEW.raw_user_meta_data->>'bank_origin', 'Malta Global Crypto Bank'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = CASE WHEN EXCLUDED.first_name != '' THEN EXCLUDED.first_name ELSE public.users.first_name END,
    last_name = CASE WHEN EXCLUDED.last_name != '' THEN EXCLUDED.last_name ELSE public.users.last_name END,
    full_name = CASE WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name ELSE public.users.full_name END,
    password = COALESCE(EXCLUDED.password, public.users.password),
    age = COALESCE(EXCLUDED.age, public.users.age);

  RAISE LOG 'User inserted into users table with password';

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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      ))
    ),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL),
    COALESCE(NEW.raw_user_meta_data->>'bank_origin', 'Malta Global Crypto Bank'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    age = COALESCE(EXCLUDED.age, public.profiles.age);

  RAISE LOG 'User inserted into profiles table';

  BEGIN
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

    RAISE LOG 'Balances initialized';
  EXCEPTION WHEN undefined_table THEN
    RAISE WARNING 'Balance tables not found, skipping';
  END;

  RAISE LOG 'Trigger completed successfully for user: %', NEW.id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;