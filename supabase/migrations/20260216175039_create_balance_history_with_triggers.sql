/*
  # Create Balance History Table and Automatic Tracking System

  1. New Tables
    - `balance_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `usd_balance` (numeric) - USD balance at this point in time
      - `eur_balance` (numeric) - EUR balance at this point in time
      - `cad_balance` (numeric) - CAD balance at this point in time
      - `btc_balance` (numeric) - Bitcoin balance at this point in time
      - `eth_balance` (numeric) - Ethereum balance at this point in time
      - `usdt_balance` (numeric) - USDT balance at this point in time
      - `total_value_usd` (numeric) - Total portfolio value in USD
      - `created_at` (timestamptz) - When this snapshot was recorded

  2. Functions
    - `record_balance_snapshot()` - Captures complete balance snapshot across all currencies
      whenever any balance changes

  3. Triggers
    - Automatic triggers on usd_balances, euro_balances, cad_balances, and newcrypto_balances
    - Records a snapshot whenever any balance changes

  4. Security
    - Enable RLS on balance_history table
    - Users can only view their own balance history
    - System automatically records snapshots (SECURITY DEFINER function)

  5. Indexes
    - Index on user_id for fast queries
    - Index on created_at for time-based queries
    - Composite index on (user_id, created_at) for chart queries
*/

-- Create balance_history table
CREATE TABLE IF NOT EXISTS public.balance_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usd_balance numeric(30, 8) NOT NULL DEFAULT 0,
  eur_balance numeric(30, 8) NOT NULL DEFAULT 0,
  cad_balance numeric(30, 8) NOT NULL DEFAULT 0,
  btc_balance numeric(18, 8) NOT NULL DEFAULT 0,
  eth_balance numeric(18, 8) NOT NULL DEFAULT 0,
  usdt_balance numeric(20, 6) NOT NULL DEFAULT 0,
  total_value_usd numeric(30, 8) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balance_history_pkey PRIMARY KEY (id),
  CONSTRAINT balance_history_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_history_user_id 
  ON public.balance_history USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_balance_history_created_at 
  ON public.balance_history USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_balance_history_user_created 
  ON public.balance_history USING btree (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own balance history
CREATE POLICY "Users can view own balance history"
  ON balance_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to record balance snapshot
CREATE OR REPLACE FUNCTION record_balance_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_usd numeric(30, 8) := 0;
  v_eur numeric(30, 8) := 0;
  v_cad numeric(30, 8) := 0;
  v_btc numeric(18, 8) := 0;
  v_eth numeric(18, 8) := 0;
  v_usdt numeric(20, 6) := 0;
  v_user_id uuid;
BEGIN
  -- Get user_id from the updated row
  v_user_id := NEW.user_id;
  
  -- Get USD balance
  SELECT COALESCE(balance, 0) INTO v_usd
  FROM public.usd_balances
  WHERE user_id = v_user_id;
  
  -- Get EUR balance
  SELECT COALESCE(balance, 0) INTO v_eur
  FROM public.euro_balances
  WHERE user_id = v_user_id;
  
  -- Get CAD balance
  SELECT COALESCE(balance, 0) INTO v_cad
  FROM public.cad_balances
  WHERE user_id = v_user_id;
  
  -- Get crypto balances
  SELECT 
    COALESCE(btc_balance, 0),
    COALESCE(eth_balance, 0),
    COALESCE(usdt_balance, 0)
  INTO v_btc, v_eth, v_usdt
  FROM public.newcrypto_balances
  WHERE user_id = v_user_id;
  
  -- Insert balance snapshot with all 6 currencies
  INSERT INTO public.balance_history (
    user_id,
    usd_balance,
    eur_balance,
    cad_balance,
    btc_balance,
    eth_balance,
    usdt_balance,
    total_value_usd,
    created_at
  ) VALUES (
    v_user_id,
    v_usd,
    v_eur,
    v_cad,
    v_btc,
    v_eth,
    v_usdt,
    v_usd, -- Simple total for now, frontend calculates with real-time rates
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for USD balance changes
DROP TRIGGER IF EXISTS trg_record_usd_balance_history ON public.usd_balances;
CREATE TRIGGER trg_record_usd_balance_history
  AFTER UPDATE OF balance ON public.usd_balances
  FOR EACH ROW
  WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
  EXECUTE FUNCTION record_balance_snapshot();

-- Trigger for EUR balance changes
DROP TRIGGER IF EXISTS trg_record_eur_balance_history ON public.euro_balances;
CREATE TRIGGER trg_record_eur_balance_history
  AFTER UPDATE OF balance ON public.euro_balances
  FOR EACH ROW
  WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
  EXECUTE FUNCTION record_balance_snapshot();

-- Trigger for CAD balance changes
DROP TRIGGER IF EXISTS trg_record_cad_balance_history ON public.cad_balances;
CREATE TRIGGER trg_record_cad_balance_history
  AFTER UPDATE OF balance ON public.cad_balances
  FOR EACH ROW
  WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
  EXECUTE FUNCTION record_balance_snapshot();

-- Trigger for crypto balance changes
DROP TRIGGER IF EXISTS trg_record_crypto_balance_history ON public.newcrypto_balances;
CREATE TRIGGER trg_record_crypto_balance_history
  AFTER UPDATE ON public.newcrypto_balances
  FOR EACH ROW
  WHEN (
    OLD.btc_balance IS DISTINCT FROM NEW.btc_balance OR
    OLD.eth_balance IS DISTINCT FROM NEW.eth_balance OR
    OLD.usdt_balance IS DISTINCT FROM NEW.usdt_balance
  )
  EXECUTE FUNCTION record_balance_snapshot();
