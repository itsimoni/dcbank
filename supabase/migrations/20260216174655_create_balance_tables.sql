/*
  # Create Balance Tables for 6 Currencies
  
  1. New Tables
    - `usd_balances` - USD balance for each user
    - `euro_balances` - EUR balance for each user
    - `cad_balances` - CAD balance for each user
    - `newcrypto_balances` - BTC, ETH, USDT balances for each user
    
  2. Indexes
    - user_id indexes for fast lookups
    - crypto balance indexes for queries
    
  3. Functions
    - `prevent_zero_overwrite()` - Prevents accidental zero overwrites
    - `update_newcrypto_balances_updated_at()` - Updates timestamp
    
  4. Security
    - Enable RLS on all tables
    - Users can only view/update their own balances
*/

-- Function to prevent zero overwrite
CREATE OR REPLACE FUNCTION prevent_zero_overwrite()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance = 0 AND OLD.balance > 0 THEN
    RAISE NOTICE 'Prevented overwriting balance % with zero', OLD.balance;
    NEW.balance := OLD.balance;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update crypto balances timestamp
CREATE OR REPLACE FUNCTION update_newcrypto_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- USD Balances Table
CREATE TABLE IF NOT EXISTS public.usd_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  balance numeric(30, 8) NULL DEFAULT 0.00,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT usd_balances_pkey PRIMARY KEY (id),
  CONSTRAINT usd_balances_user_id_key UNIQUE (user_id),
  CONSTRAINT usd_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usd_balances_user_id ON public.usd_balances USING btree (user_id);

CREATE TRIGGER trg_prevent_zero_overwrite_usd
  BEFORE UPDATE ON usd_balances
  FOR EACH ROW
  EXECUTE FUNCTION prevent_zero_overwrite();

-- EUR Balances Table
CREATE TABLE IF NOT EXISTS public.euro_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  balance numeric(30, 8) NULL DEFAULT 0.00,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT euro_balances_pkey PRIMARY KEY (id),
  CONSTRAINT euro_balances_user_id_key UNIQUE (user_id),
  CONSTRAINT euro_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_euro_balances_user_id ON public.euro_balances USING btree (user_id);

CREATE TRIGGER trg_prevent_zero_overwrite_eur
  BEFORE UPDATE ON euro_balances
  FOR EACH ROW
  EXECUTE FUNCTION prevent_zero_overwrite();

-- CAD Balances Table
CREATE TABLE IF NOT EXISTS public.cad_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  balance numeric(30, 8) NULL DEFAULT 0.00,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT cad_balances_pkey PRIMARY KEY (id),
  CONSTRAINT cad_balances_user_id_key UNIQUE (user_id),
  CONSTRAINT cad_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cad_balances_user_id ON public.cad_balances USING btree (user_id);

CREATE TRIGGER trg_prevent_zero_overwrite_cad
  BEFORE UPDATE ON cad_balances
  FOR EACH ROW
  EXECUTE FUNCTION prevent_zero_overwrite();

-- Crypto Balances Table
CREATE TABLE IF NOT EXISTS public.newcrypto_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  btc_balance numeric(18, 8) NOT NULL DEFAULT 0.00000000,
  eth_balance numeric(18, 8) NOT NULL DEFAULT 0.00000000,
  usdt_balance numeric(20, 6) NOT NULL DEFAULT 0.000000,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT newcrypto_balances_pkey PRIMARY KEY (id),
  CONSTRAINT newcrypto_balances_user_id_key UNIQUE (user_id),
  CONSTRAINT newcrypto_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_newcrypto_balances_user_id ON public.newcrypto_balances USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_newcrypto_balances_btc ON public.newcrypto_balances USING btree (btc_balance);
CREATE INDEX IF NOT EXISTS idx_newcrypto_balances_eth ON public.newcrypto_balances USING btree (eth_balance);
CREATE INDEX IF NOT EXISTS idx_newcrypto_balances_usdt ON public.newcrypto_balances USING btree (usdt_balance);

CREATE TRIGGER update_newcrypto_balances_updated_at
  BEFORE UPDATE ON newcrypto_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_newcrypto_balances_updated_at();

-- Enable RLS on all tables
ALTER TABLE usd_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE euro_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE cad_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE newcrypto_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for USD
CREATE POLICY "Users can view own USD balance"
  ON usd_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own USD balance"
  ON usd_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for EUR
CREATE POLICY "Users can view own EUR balance"
  ON euro_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own EUR balance"
  ON euro_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for CAD
CREATE POLICY "Users can view own CAD balance"
  ON cad_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own CAD balance"
  ON cad_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Crypto
CREATE POLICY "Users can view own crypto balances"
  ON newcrypto_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own crypto balances"
  ON newcrypto_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);