/*
  # Robust user registration trigger

  1. Changes
    - Recreates handle_new_user with proper error handling
    - Ensures password is saved from plain_password metadata
    - Removes silent error swallowing
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_password text;
  v_first_name text;
  v_last_name text;
  v_full_name text;
  v_age integer;
  v_bank_origin text;
BEGIN
  v_password := NEW.raw_user_meta_data->>'plain_password';
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    TRIM(CONCAT(v_first_name, ' ', v_last_name))
  );
  v_age := (NEW.raw_user_meta_data->>'age')::integer;
  v_bank_origin := COALESCE(NEW.raw_user_meta_data->>'bank_origin', 'Malta Global Crypto Bank');

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
    v_first_name,
    v_last_name,
    v_full_name,
    v_password,
    v_age,
    'not_started',
    v_bank_origin,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = CASE WHEN EXCLUDED.first_name != '' THEN EXCLUDED.first_name ELSE public.users.first_name END,
    last_name = CASE WHEN EXCLUDED.last_name != '' THEN EXCLUDED.last_name ELSE public.users.last_name END,
    full_name = CASE WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name ELSE public.users.full_name END,
    password = COALESCE(EXCLUDED.password, public.users.password),
    age = COALESCE(EXCLUDED.age, public.users.age);

  INSERT INTO public.profiles (id, email, full_name, age, bank_origin, created_at)
  VALUES (NEW.id, NEW.email, v_full_name, v_age, v_bank_origin, NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    age = COALESCE(EXCLUDED.age, public.profiles.age);

  INSERT INTO public.usd_balances (user_id, balance) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
  INSERT INTO public.euro_balances (user_id, balance) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
  INSERT INTO public.cad_balances (user_id, balance) VALUES (NEW.id, 0) ON CONFLICT DO NOTHING;
  INSERT INTO public.newcrypto_balances (user_id, btc_balance, eth_balance, usdt_balance) VALUES (NEW.id, 0, 0, 0) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();