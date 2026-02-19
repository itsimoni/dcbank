/*
  # Create Comprehensive Crypto Transactions Table

  1. New Tables
    - `crypto_transactions`
      - `id` (uuid, primary key) - Unique transaction identifier
      - `user_id` (uuid, FK to users) - The user who initiated the transaction
      - `transaction_type` (text) - Type: 'deposit', 'withdrawal', 'transfer', 'payment'
      - `crypto_type` (text) - Cryptocurrency: BTC, ETH, USDT, etc.
      - `amount` (numeric) - Transaction amount in crypto
      - `amount_usd` (numeric) - Equivalent USD value at time of transaction
      - `network` (text) - Blockchain network used
      - `from_address` (text) - Sender wallet address
      - `to_address` (text) - Recipient wallet address
      - `tx_hash` (text) - Blockchain transaction hash
      - `confirmations` (integer) - Number of blockchain confirmations
      - `required_confirmations` (integer) - Required confirmations for completion
      - `status` (text) - Status: pending, processing, confirmed, completed, failed, cancelled
      - `fee_crypto` (numeric) - Network fee in crypto
      - `fee_usd` (numeric) - Network fee in USD
      - `reference` (text) - Internal reference number
      - `description` (text) - Transaction description/memo
      - `recipient_name` (text) - Recipient name for payments
      - `exchange_rate` (numeric) - Exchange rate at time of transaction
      - `priority` (text) - Transaction priority: low, medium, high
      - `estimated_completion` (timestamptz) - Estimated completion time
      - `completed_at` (timestamptz) - Actual completion time
      - `failed_reason` (text) - Reason for failure if failed
      - `metadata` (jsonb) - Additional transaction metadata
      - `created_at` (timestamptz) - When transaction was created
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `crypto_transactions` table
    - Users can view their own transactions
    - Admins can view and manage all transactions

  3. Indexes
    - Index on user_id for fast user lookups
    - Index on status for filtering
    - Index on crypto_type for currency filtering
    - Index on tx_hash for blockchain verification
    - Index on created_at for chronological queries
*/

CREATE TABLE IF NOT EXISTS public.crypto_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_type text NOT NULL DEFAULT 'payment',
  crypto_type text NOT NULL,
  amount numeric(24, 10) NOT NULL DEFAULT 0,
  amount_usd numeric(18, 2),
  network text NOT NULL DEFAULT 'Mainnet',
  from_address text,
  to_address text,
  tx_hash text,
  confirmations integer DEFAULT 0,
  required_confirmations integer DEFAULT 3,
  status text NOT NULL DEFAULT 'pending',
  fee_crypto numeric(24, 10) DEFAULT 0,
  fee_usd numeric(18, 2) DEFAULT 0,
  reference text,
  description text,
  recipient_name text,
  exchange_rate numeric(18, 6),
  priority text DEFAULT 'medium',
  estimated_completion timestamptz,
  completed_at timestamptz,
  failed_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT crypto_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT crypto_transactions_type_check CHECK (
    transaction_type IN ('deposit', 'withdrawal', 'transfer', 'payment', 'swap')
  ),
  CONSTRAINT crypto_transactions_crypto_check CHECK (
    crypto_type IN ('BTC', 'ETH', 'USDT', 'USDC', 'XRP', 'LTC', 'BNB', 'SOL', 'DOGE', 'ADA')
  ),
  CONSTRAINT crypto_transactions_status_check CHECK (
    status IN ('pending', 'processing', 'confirming', 'confirmed', 'completed', 'failed', 'cancelled', 'refunded')
  ),
  CONSTRAINT crypto_transactions_priority_check CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  )
);

CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user_id ON public.crypto_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON public.crypto_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_crypto_type ON public.crypto_transactions(crypto_type);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_tx_hash ON public.crypto_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created_at ON public.crypto_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_type ON public.crypto_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_reference ON public.crypto_transactions(reference);

ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crypto transactions"
  ON public.crypto_transactions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own crypto transactions"
  ON public.crypto_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all crypto transactions"
  ON public.crypto_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  );

CREATE POLICY "Admins can update crypto transactions"
  ON public.crypto_transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  );

CREATE POLICY "Admins can insert crypto transactions"
  ON public.crypto_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND (is_admin = true OR is_manager = true OR is_superiormanager = true)
    )
  );

CREATE OR REPLACE FUNCTION generate_crypto_reference()
RETURNS text AS $$
BEGIN
  RETURN 'CTX-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 8));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_crypto_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.reference IS NULL THEN
    NEW.reference = generate_crypto_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crypto_transactions_updated_at
  BEFORE UPDATE ON public.crypto_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_transactions_updated_at();

CREATE TRIGGER trigger_set_crypto_transactions_reference
  BEFORE INSERT ON public.crypto_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_transactions_updated_at();
