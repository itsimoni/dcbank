/*
  # Add Service Role Policies for Transfers

  1. Security Changes
    - Add INSERT policy for service_role on transfers table
    - Add INSERT policy for service_role on bank_transfers table
    - These allow edge functions to create transfer records

  2. Notes
    - Service role is used by edge functions to create transfers
    - RLS policies restrict access while allowing server-side operations
*/

CREATE POLICY "Service role can insert transfers"
  ON transfers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select transfers"
  ON transfers
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update transfers"
  ON transfers
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert bank_transfers"
  ON bank_transfers
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select bank_transfers"
  ON bank_transfers
  FOR SELECT
  TO service_role
  USING (true);