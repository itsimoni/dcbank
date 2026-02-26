/*
  # Create Payment Wallets Table

  1. New Tables
    - `payment_wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references public.users)
      - `crypto_type` (text) - btc, eth, usdterc20, sol
      - `wallet_address` (text) - the wallet address for receiving payments
      - `is_active` (boolean) - whether this wallet is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `payment_wallets` table
    - Add policy for authenticated users to read wallets for their account
    - Add policy for service role to manage all wallets

  3. Indexes
    - Unique constraint on user_id + crypto_type combination
*/

CREATE TABLE IF NOT EXISTS payment_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crypto_type text NOT NULL CHECK (crypto_type IN ('btc', 'eth', 'usdterc20', 'sol')),
  wallet_address text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, crypto_type)
);

ALTER TABLE payment_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own payment wallets"
  ON payment_wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payment wallets"
  ON payment_wallets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payment_wallets_user_id ON payment_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_wallets_crypto_type ON payment_wallets(crypto_type);

CREATE OR REPLACE FUNCTION update_payment_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_wallets_updated_at ON payment_wallets;
CREATE TRIGGER payment_wallets_updated_at
  BEFORE UPDATE ON payment_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_wallets_updated_at();
