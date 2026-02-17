/*
  # Create external_accounts table

  1. New Tables
    - `external_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `account_name` (text) - User-friendly nickname for the account
      - `bank_name` (text) - Name of the bank
      - `account_number` (text, nullable) - Account number
      - `routing_number` (text, nullable) - Routing number (ACH)
      - `account_type` (text, nullable) - Checking or Savings
      - `currency` (text) - Currency code
      - `is_verified` (boolean) - Legacy verification flag
      - `created_at` (timestamptz) - Creation timestamp
      - `account_holder_name` (text, nullable) - Full name on account
      - `country` (text, nullable) - Country name
      - `bank_country` (text, nullable) - Bank country name
      - `payment_rail` (text) - ACH, SEPA, SWIFT, WIRE, FPS, OTHER
      - `iban` (text, nullable) - International Bank Account Number
      - `swift_bic` (text, nullable) - SWIFT/BIC code
      - `routing_type` (text, nullable) - Type of routing number
      - `last4` (text, nullable) - Last 4 digits of account
      - `masked_account` (text, nullable) - Masked account display
      - `verification_status` (text) - pending, verified, failed, rejected, requires_action
      - `verification_method` (text, nullable) - How it was verified
      - `verified_at` (timestamptz, nullable) - When it was verified
      - `verification_attempts` (int) - Number of verification attempts
      - `failure_reason` (text, nullable) - Why verification failed
      - `is_default` (boolean) - Is this the default account
      - `is_active` (boolean) - Is this account active
      - `last_used_at` (timestamptz, nullable) - Last time used
      - `deleted_at` (timestamptz, nullable) - Soft delete timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `provider` (text, nullable) - Payment provider
      - `provider_account_id` (text, nullable) - Provider account ID
      - `provider_item_id` (text, nullable) - Provider item ID
      - `provider_status` (text, nullable) - Provider status
      - `last_sync_at` (timestamptz, nullable) - Last sync with provider

  2. Security
    - Enable RLS on `external_accounts` table
    - Add policies for authenticated users to manage their own accounts
*/

-- Create external_accounts table
CREATE TABLE IF NOT EXISTS public.external_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  account_name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NULL,
  routing_number text NULL,
  account_type text NULL DEFAULT 'Checking'::text,
  currency text NULL DEFAULT 'USD'::text,
  is_verified boolean NULL DEFAULT false,
  created_at timestamptz NULL DEFAULT now(),
  account_holder_name text NULL,
  country text NULL,
  bank_country text NULL,
  payment_rail text NOT NULL DEFAULT 'SWIFT'::text,
  iban text NULL,
  swift_bic text NULL,
  routing_type text NULL,
  last4 text NULL,
  masked_account text NULL,
  verification_status text NOT NULL DEFAULT 'pending'::text,
  verification_method text NULL,
  verified_at timestamptz NULL,
  verification_attempts integer NOT NULL DEFAULT 0,
  failure_reason text NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz NULL,
  deleted_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  provider text NULL,
  provider_account_id text NULL,
  provider_item_id text NULL,
  provider_status text NULL,
  last_sync_at timestamptz NULL,
  CONSTRAINT external_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT external_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT external_accounts_payment_rail_check CHECK (
    payment_rail = ANY (ARRAY['ACH'::text, 'SEPA'::text, 'SWIFT'::text, 'WIRE'::text, 'FPS'::text, 'OTHER'::text])
  ),
  CONSTRAINT external_accounts_verification_status_check CHECK (
    verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'failed'::text, 'rejected'::text, 'requires_action'::text])
  ),
  CONSTRAINT external_accounts_last4_check CHECK (
    (last4 IS NULL) OR (last4 ~ '^[A-Za-z0-9]{4}$'::text)
  ),
  CONSTRAINT external_accounts_identifiers_check CHECK (
    (
      (payment_rail = 'ACH'::text AND routing_number IS NOT NULL)
      OR (payment_rail = 'SEPA'::text AND iban IS NOT NULL)
      OR (payment_rail = 'SWIFT'::text AND swift_bic IS NOT NULL AND (iban IS NOT NULL OR account_number IS NOT NULL))
      OR (payment_rail = ANY (ARRAY['WIRE'::text, 'FPS'::text, 'OTHER'::text]) AND (iban IS NOT NULL OR account_number IS NOT NULL))
    )
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS external_accounts_user_id_idx ON public.external_accounts USING btree (user_id);
CREATE INDEX IF NOT EXISTS external_accounts_user_status_idx ON public.external_accounts USING btree (user_id, verification_status);
CREATE INDEX IF NOT EXISTS external_accounts_user_active_idx ON public.external_accounts USING btree (user_id, is_active);
CREATE INDEX IF NOT EXISTS external_accounts_user_default_idx ON public.external_accounts USING btree (user_id, is_default);

-- Create unique index for one default per user
CREATE UNIQUE INDEX IF NOT EXISTS external_accounts_one_default_per_user ON public.external_accounts USING btree (user_id)
WHERE (is_default = true AND deleted_at IS NULL);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_external_accounts_set_updated_at
  BEFORE UPDATE ON public.external_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.external_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own external accounts"
  ON public.external_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own external accounts"
  ON public.external_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own external accounts"
  ON public.external_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own external accounts"
  ON public.external_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
