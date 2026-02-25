/*
  # Create User Payments Table

  1. New Tables
    - `user_payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, foreign key to auth.users)
      - `payments` (numeric, default 0) - pending payment amount
      - `on_hold` (numeric, default 0) - on hold amount
      - `paid` (numeric, default 0) - paid amount
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_payments` table
    - Add policy for authenticated users to read their own data
    - Add policy for service role to manage all data
*/

CREATE TABLE IF NOT EXISTS user_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  payments numeric DEFAULT 0,
  on_hold numeric DEFAULT 0,
  paid numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment data"
  ON user_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment data"
  ON user_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment data"
  ON user_payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payment data"
  ON user_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);