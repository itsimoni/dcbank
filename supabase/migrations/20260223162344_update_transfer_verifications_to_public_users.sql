/*
  # Update transfer_verifications to reference public.users

  1. Changes
    - Drop existing foreign key constraint on transfer_verifications.user_id
    - Add new foreign key constraint referencing public.users.id
    - Update RLS policies for transfer_verifications

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Grant permissions to service_role
*/

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.transfer_verifications 
DROP CONSTRAINT IF EXISTS transfer_verifications_user_id_fkey;

-- Step 2: Add new foreign key referencing public.users.id
ALTER TABLE public.transfer_verifications
ADD CONSTRAINT transfer_verifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Grant permissions to service_role
GRANT ALL ON public.transfer_verifications TO service_role;

-- Step 4: Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.transfer_verifications TO authenticated;

-- Step 5: Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own transfer verifications" ON public.transfer_verifications;
DROP POLICY IF EXISTS "Users can create transfer verifications" ON public.transfer_verifications;
DROP POLICY IF EXISTS "Service role full access" ON public.transfer_verifications;

-- Step 6: Create new RLS policies
CREATE POLICY "Users can view own transfer verifications"
  ON public.transfer_verifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create transfer verifications"
  ON public.transfer_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transfer verifications"
  ON public.transfer_verifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 7: Add useful indexes
CREATE INDEX IF NOT EXISTS idx_transfer_verifications_user_id ON public.transfer_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_verifications_status ON public.transfer_verifications(status);
CREATE INDEX IF NOT EXISTS idx_transfer_verifications_expires_at ON public.transfer_verifications(expires_at);

-- Step 8: Add indexes to transfers table
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON public.transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_type ON public.transfers(transfer_type);
CREATE INDEX IF NOT EXISTS idx_transfers_reference_number ON public.transfers(reference_number);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON public.transfers(created_at DESC);

-- Step 9: Add indexes to bank_transfers table
CREATE INDEX IF NOT EXISTS idx_bank_transfers_transfer_id ON public.bank_transfers(transfer_id);

-- Step 10: Add indexes to crypto_transfers table
CREATE INDEX IF NOT EXISTS idx_crypto_transfers_transfer_id ON public.crypto_transfers(transfer_id);
