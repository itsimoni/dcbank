/*
  # Create Transfers and Related Tables

  1. New Tables
    - `transfers`
      - `id` (serial, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `client_id` (text)
      - `from_currency` (text)
      - `to_currency` (text)
      - `from_amount` (numeric)
      - `to_amount` (numeric)
      - `exchange_rate` (numeric)
      - `status` (text)
      - `transfer_type` (text) - internal, bank_transfer, crypto_internal, crypto_external
      - `description` (text)
      - `reference_number` (text)
      - `fee_amount` (numeric)
      - `fee_currency` (text)
      - `processed_at` (timestamp)
      - `admin_notes` (text)
      - `status_reason` (text)
      - `rate_source` (text)
      - `rate_timestamp` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `bank_transfers`
      - Stores bank details for bank wire transfers
      - Linked to transfers table

    - `crypto_transfers`
      - Stores wallet details for external crypto transfers
      - Linked to transfers table

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS transfers (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text,
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  from_amount numeric NOT NULL DEFAULT 0,
  to_amount numeric NOT NULL DEFAULT 0,
  exchange_rate numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  transfer_type text NOT NULL DEFAULT 'internal',
  description text,
  reference_number text,
  fee_amount numeric DEFAULT 0,
  fee_currency text,
  processed_at timestamptz,
  admin_notes text,
  status_reason text,
  rate_source text,
  rate_timestamp timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own transfers"
  ON transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own transfers"
  ON transfers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own transfers"
  ON transfers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS bank_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id integer NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_holder_name text NOT NULL,
  account_number text NOT NULL,
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bank_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own bank transfers"
  ON bank_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transfers
      WHERE transfers.id = bank_transfers.transfer_id
      AND transfers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own bank transfers"
  ON bank_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers
      WHERE transfers.id = bank_transfers.transfer_id
      AND transfers.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS crypto_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id integer NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  network text NOT NULL,
  memo_tag text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crypto_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own crypto transfers"
  ON crypto_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transfers
      WHERE transfers.id = crypto_transfers.transfer_id
      AND transfers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own crypto transfers"
  ON crypto_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers
      WHERE transfers.id = crypto_transfers.transfer_id
      AND transfers.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_reference_number ON transfers(reference_number);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_type ON transfers(transfer_type);
CREATE INDEX IF NOT EXISTS idx_bank_transfers_transfer_id ON bank_transfers(transfer_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transfers_transfer_id ON crypto_transfers(transfer_id);
