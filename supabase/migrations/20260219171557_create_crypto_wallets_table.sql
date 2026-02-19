/*
  # Create Crypto Wallets Table

  1. New Tables
    - `crypto_wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users table)
      - `crypto_type` (text) - e.g., BTC, ETH, USDT, USDC, XRP, LTC
      - `wallet_address` (text) - the wallet address for receiving payments
      - `network` (text) - blockchain network (e.g., ERC20, TRC20, Mainnet)
      - `label` (text) - optional friendly name for the wallet
      - `is_active` (boolean) - whether this wallet is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `crypto_wallets` table
    - Add policies for authenticated users to read their own wallets
    - Add policies for admins to manage all wallets

  3. Indexes
    - Index on user_id for faster lookups
    - Index on crypto_type for filtering by currency
*/

CREATE TABLE IF NOT EXISTS public.crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crypto_type text NOT NULL,
  wallet_address text NOT NULL,
  network text DEFAULT 'Mainnet',
  label text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT crypto_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT crypto_wallets_crypto_type_check CHECK (
    crypto_type IN ('BTC', 'ETH', 'USDT', 'USDC', 'XRP', 'LTC', 'BNB', 'SOL', 'DOGE', 'ADA')
  )
);

CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user_id ON public.crypto_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_crypto_type ON public.crypto_wallets(crypto_type);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_is_active ON public.crypto_wallets(is_active);

ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crypto wallets"
  ON public.crypto_wallets
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all crypto wallets"
  ON public.crypto_wallets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  );

CREATE POLICY "Admins can insert crypto wallets"
  ON public.crypto_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  );

CREATE POLICY "Admins can update crypto wallets"
  ON public.crypto_wallets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  );

CREATE POLICY "Admins can delete crypto wallets"
  ON public.crypto_wallets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  );

CREATE OR REPLACE FUNCTION update_crypto_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crypto_wallets_updated_at
  BEFORE UPDATE ON public.crypto_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_wallets_updated_at();
