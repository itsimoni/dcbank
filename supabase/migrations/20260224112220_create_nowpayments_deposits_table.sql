/*
  # Create NOWPayments Deposits Table

  1. New Tables
    - `nowpayments_deposits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `payment_id` (text, NOWPayments payment ID)
      - `payment_status` (text, payment status from NOWPayments)
      - `pay_address` (text, wallet address to send payment)
      - `pay_currency` (text, cryptocurrency to pay with e.g. btc, eth)
      - `pay_amount` (numeric, amount in crypto)
      - `price_amount` (numeric, amount in fiat)
      - `price_currency` (text, fiat currency e.g. EUR, USD)
      - `actually_paid` (numeric, amount actually received)
      - `outcome_amount` (numeric, amount after conversion)
      - `outcome_currency` (text, outcome currency)
      - `payment_category` (text, category of payment e.g. utilities, taxes)
      - `order_id` (text, internal order reference)
      - `order_description` (text, payment description)
      - `payer_name` (text, name of payer)
      - `payer_email` (text, email of payer)
      - `network` (text, blockchain network)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS on `nowpayments_deposits` table
    - Add policies for users to view their own deposits
    - Add policies for admins to view all deposits
*/

CREATE TABLE IF NOT EXISTS nowpayments_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id text UNIQUE,
  payment_status text NOT NULL DEFAULT 'waiting',
  pay_address text,
  pay_currency text NOT NULL,
  pay_amount numeric DEFAULT 0,
  price_amount numeric NOT NULL DEFAULT 0,
  price_currency text NOT NULL DEFAULT 'EUR',
  actually_paid numeric DEFAULT 0,
  outcome_amount numeric DEFAULT 0,
  outcome_currency text,
  payment_category text NOT NULL,
  order_id text,
  order_description text,
  payer_name text,
  payer_email text,
  network text,
  payin_extra_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE nowpayments_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
  ON nowpayments_deposits
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert their own deposits"
  ON nowpayments_deposits
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own deposits"
  ON nowpayments_deposits
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all deposits"
  ON nowpayments_deposits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND (is_admin = true OR is_manager = true)
    )
  );

CREATE POLICY "Admins can update all deposits"
  ON nowpayments_deposits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND (is_admin = true OR is_manager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND (is_admin = true OR is_manager = true)
    )
  );

CREATE POLICY "Service role can do everything"
  ON nowpayments_deposits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nowpayments_deposits_user_id ON nowpayments_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_deposits_payment_id ON nowpayments_deposits(payment_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_deposits_status ON nowpayments_deposits(payment_status);
