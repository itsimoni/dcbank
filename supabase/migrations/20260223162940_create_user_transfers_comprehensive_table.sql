/*
  # Create Comprehensive User Transfers Table

  This migration creates a single unified table to store all transfer data
  from the transfers component, linked to the public.users table.

  1. New Table: `user_transfers`
    - Core Transfer Fields:
      - `id` (uuid, primary key)
      - `user_id` (uuid, references public.users)
      - `client_id` (text, for display purposes)
      - `reference_number` (text, unique identifier)
      - `transfer_type` (text: internal, bank_transfer, crypto_internal, crypto_external)
      - `status` (text: pending, processing, approved, completed, rejected)
    
    - Currency & Amount Fields:
      - `from_currency` (text)
      - `to_currency` (text)
      - `from_amount` (numeric)
      - `to_amount` (numeric)
      - `exchange_rate` (numeric)
      - `fee_amount` (numeric)
      - `fee_currency` (text)
      - `rate_source` (text)
      - `rate_timestamp` (timestamptz)
    
    - Bank Transfer Fields:
      - `bank_name` (text)
      - `account_holder_name` (text)
      - `account_number` (text)
      - `routing_number` (text)
      - `swift_code` (text)
      - `iban` (text)
      - `bank_address` (text)
      - `recipient_address` (text)
      - `purpose_of_transfer` (text)
      - `beneficiary_country` (text)
      - `beneficiary_bank_country` (text)
      - `account_type` (text)
      - `intermediary_bank_name` (text)
      - `intermediary_swift` (text)
      - `intermediary_iban` (text)
    
    - Crypto Transfer Fields:
      - `wallet_address` (text)
      - `network` (text)
      - `memo_tag` (text)
    
    - Additional Fields:
      - `description` (text)
      - `admin_notes` (text)
      - `status_reason` (text)
      - `processed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Policies for authenticated users to manage own transfers
    - Service role full access

  3. Indexes
    - user_id, status, transfer_type, reference_number, created_at
*/

-- Create the comprehensive user_transfers table
CREATE TABLE IF NOT EXISTS public.user_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id text,
  reference_number text UNIQUE DEFAULT ('TRF-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  
  -- Transfer type and status
  transfer_type text NOT NULL DEFAULT 'internal' CHECK (
    transfer_type IN ('internal', 'bank_transfer', 'crypto_internal', 'crypto_external')
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'approved', 'completed', 'rejected')
  ),
  
  -- Currency and amounts
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  from_amount numeric NOT NULL DEFAULT 0,
  to_amount numeric NOT NULL DEFAULT 0,
  exchange_rate numeric NOT NULL DEFAULT 1,
  fee_amount numeric DEFAULT 0,
  fee_currency text,
  rate_source text,
  rate_timestamp timestamptz,
  
  -- Bank transfer details
  bank_name text,
  account_holder_name text,
  account_number text,
  routing_number text,
  swift_code text,
  iban text,
  bank_address text,
  recipient_address text,
  purpose_of_transfer text,
  beneficiary_country text,
  beneficiary_bank_country text,
  account_type text,
  intermediary_bank_name text,
  intermediary_swift text,
  intermediary_iban text,
  
  -- Crypto transfer details
  wallet_address text,
  network text,
  memo_tag text,
  
  -- Additional info
  description text,
  admin_notes text,
  status_reason text,
  
  -- Timestamps
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own transfers"
  ON public.user_transfers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own transfers"
  ON public.user_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending transfers"
  ON public.user_transfers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all transfers"
  ON public.user_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.is_manager = true OR users.is_superiormanager = true)
    )
  );

CREATE POLICY "Admins can update all transfers"
  ON public.user_transfers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.is_manager = true OR users.is_superiormanager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.is_manager = true OR users.is_superiormanager = true)
    )
  );

-- Grant permissions
GRANT ALL ON public.user_transfers TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_transfers TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_transfers_user_id ON public.user_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transfers_status ON public.user_transfers(status);
CREATE INDEX IF NOT EXISTS idx_user_transfers_transfer_type ON public.user_transfers(transfer_type);
CREATE INDEX IF NOT EXISTS idx_user_transfers_reference_number ON public.user_transfers(reference_number);
CREATE INDEX IF NOT EXISTS idx_user_transfers_created_at ON public.user_transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_transfers_from_currency ON public.user_transfers(from_currency);
CREATE INDEX IF NOT EXISTS idx_user_transfers_to_currency ON public.user_transfers(to_currency);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_transfers_updated_at ON public.user_transfers;
CREATE TRIGGER trigger_user_transfers_updated_at
  BEFORE UPDATE ON public.user_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_transfers_updated_at();
