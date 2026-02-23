/*
  # Create Transfer Verifications Table

  1. New Tables
    - `transfer_verifications`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, references auth.users) - User who initiated the transfer
      - `verification_token` (text, unique) - Unique token for email verification
      - `transfer_type` (text) - Type: internal, bank_transfer, crypto_internal, crypto_external
      - `transfer_data` (jsonb) - Complete transfer data to execute upon verification
      - `status` (text) - pending, verified, expired, cancelled
      - `expires_at` (timestamptz) - When the verification expires (30 minutes)
      - `verified_at` (timestamptz) - When user verified
      - `created_at` (timestamptz) - When verification was created
      - `ip_address` (text) - IP address of the request
      - `user_agent` (text) - Browser/device info

  2. Security
    - Enable RLS on `transfer_verifications` table
    - Users can only view their own verifications
    - Insert only via authenticated users
*/

CREATE TABLE IF NOT EXISTS transfer_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_token text UNIQUE NOT NULL,
  transfer_type text NOT NULL CHECK (transfer_type IN ('internal', 'bank_transfer', 'crypto_internal', 'crypto_external')),
  transfer_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  email_sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_transfer_verifications_user_id ON transfer_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_verifications_token ON transfer_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_transfer_verifications_status ON transfer_verifications(status);
CREATE INDEX IF NOT EXISTS idx_transfer_verifications_expires_at ON transfer_verifications(expires_at);

ALTER TABLE transfer_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfer verifications"
  ON transfer_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfer verifications"
  ON transfer_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending verifications"
  ON transfer_verifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);
