/*
  # Create Email Verification System

  1. New Tables
    - `email_verifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text, the email to verify)
      - `token` (text, unique verification token)
      - `expires_at` (timestamptz, token expiration time)
      - `verified_at` (timestamptz, when email was verified)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `email_verifications` table
    - Add policies for service role access (edge functions)
    - Add policy for users to read their own verification status

  3. Notes
    - Tokens expire after 24 hours
    - Once verified, users can proceed to KYC
*/

CREATE TABLE IF NOT EXISTS email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  verified_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification status"
  ON email_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verifications"
  ON email_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
END $$;