/*
  # Update Transfers Table to Reference public.users

  1. Changes
    - Drop existing foreign key constraint on transfers.user_id that references auth.users
    - Add new foreign key constraint referencing public.users.id
    - Update bank_transfers and crypto_transfers service_role permissions
    - Update RLS policies for all transfer-related tables

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own transfers
    - Grant full permissions to service_role for edge function operations
*/

-- Step 1: Drop the existing foreign key constraint on transfers
ALTER TABLE public.transfers 
DROP CONSTRAINT IF EXISTS transfers_user_id_fkey;

-- Step 2: Add new foreign key referencing public.users.id
ALTER TABLE public.transfers
ADD CONSTRAINT transfers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Grant permissions to service_role on all transfer tables
GRANT ALL ON public.transfers TO service_role;
GRANT ALL ON public.bank_transfers TO service_role;
GRANT ALL ON public.crypto_transfers TO service_role;
GRANT USAGE, SELECT ON SEQUENCE transfers_id_seq TO service_role;

-- Step 4: Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bank_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crypto_transfers TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE transfers_id_seq TO authenticated;

-- Step 5: Drop existing RLS policies on transfers
DROP POLICY IF EXISTS "Users can view own transfers" ON public.transfers;
DROP POLICY IF EXISTS "Users can create own transfers" ON public.transfers;
DROP POLICY IF EXISTS "Users can update own transfers" ON public.transfers;
DROP POLICY IF EXISTS "Service role full access transfers" ON public.transfers;

-- Step 6: Create new RLS policies for transfers table
CREATE POLICY "Users can view own transfers"
  ON public.transfers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own transfers"
  ON public.transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transfers"
  ON public.transfers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 7: Drop existing RLS policies on bank_transfers
DROP POLICY IF EXISTS "Users can view own bank transfers" ON public.bank_transfers;
DROP POLICY IF EXISTS "Users can create bank transfers" ON public.bank_transfers;
DROP POLICY IF EXISTS "Service role full access bank_transfers" ON public.bank_transfers;

-- Step 8: Create new RLS policies for bank_transfers
CREATE POLICY "Users can view own bank transfers"
  ON public.bank_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = bank_transfers.transfer_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bank transfers"
  ON public.bank_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = bank_transfers.transfer_id
      AND t.user_id = auth.uid()
    )
  );

-- Step 9: Drop existing RLS policies on crypto_transfers
DROP POLICY IF EXISTS "Users can view own crypto transfers" ON public.crypto_transfers;
DROP POLICY IF EXISTS "Users can create crypto transfers" ON public.crypto_transfers;
DROP POLICY IF EXISTS "Service role full access crypto_transfers" ON public.crypto_transfers;

-- Step 10: Create new RLS policies for crypto_transfers
CREATE POLICY "Users can view own crypto transfers"
  ON public.crypto_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = crypto_transfers.transfer_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create crypto transfers"
  ON public.crypto_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = crypto_transfers.transfer_id
      AND t.user_id = auth.uid()
    )
  );
