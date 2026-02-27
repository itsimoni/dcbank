/*
  # Create Fund Requests Table

  1. New Tables
    - `fund_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references public.users)
      - `funding_type` (text: 'crypto' or 'bank')
      - `crypto_currency` (text: BTC, ETH, USDT - nullable for bank)
      - `crypto_wallet_address` (text - the wallet user sent to)
      - `crypto_tx_hash` (text - transaction hash provided by user)
      - `amount` (numeric - amount user claims to have sent)
      - `currency` (text - USD for bank, or crypto symbol)
      - `bank_name` (text - client's bank name for bank transfers)
      - `bank_account_number` (text - client's account number)
      - `bank_routing_number` (text - client's routing number)
      - `bank_account_holder` (text - account holder name)
      - `bank_reference` (text - transfer reference)
      - `status` (text: pending, approved, rejected - default pending)
      - `admin_notes` (text - notes from admin)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on fund_requests table
    - Users can view and create their own requests
    - Admins can view and update all requests
*/

CREATE TABLE IF NOT EXISTS public.fund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  funding_type text NOT NULL CHECK (funding_type IN ('crypto', 'bank')),
  crypto_currency text CHECK (crypto_currency IN ('BTC', 'ETH', 'USDT') OR crypto_currency IS NULL),
  crypto_wallet_address text,
  crypto_tx_hash text,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  bank_name text,
  bank_account_number text,
  bank_routing_number text,
  bank_account_holder text,
  bank_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_requests_user_id ON public.fund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_requests_status ON public.fund_requests(status);
CREATE INDEX IF NOT EXISTS idx_fund_requests_funding_type ON public.fund_requests(funding_type);

ALTER TABLE public.fund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fund requests"
  ON public.fund_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.is_admin = true OR users.is_manager = true OR users.is_superiormanager = true)
  ));

CREATE POLICY "Users can create own fund requests"
  ON public.fund_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update fund requests"
  ON public.fund_requests
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.is_admin = true OR users.is_manager = true OR users.is_superiormanager = true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.is_admin = true OR users.is_manager = true OR users.is_superiormanager = true)
  ));

CREATE OR REPLACE FUNCTION update_fund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fund_requests_updated_at
  BEFORE UPDATE ON public.fund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_fund_requests_updated_at();
