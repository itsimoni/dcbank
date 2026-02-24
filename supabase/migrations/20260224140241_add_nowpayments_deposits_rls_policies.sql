/*
  # Add RLS policies for nowpayments_deposits table

  1. Security Changes
    - Enable RLS on nowpayments_deposits table
    - Add policy for service role to have full access (for edge functions)
    - Add policy for authenticated users to view their own deposits
    - Add policy for authenticated users to insert their own deposits
*/

ALTER TABLE IF EXISTS nowpayments_deposits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nowpayments_deposits' AND policyname = 'Users can view own deposits'
  ) THEN
    CREATE POLICY "Users can view own deposits"
      ON nowpayments_deposits
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nowpayments_deposits' AND policyname = 'Users can insert own deposits'
  ) THEN
    CREATE POLICY "Users can insert own deposits"
      ON nowpayments_deposits
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nowpayments_deposits' AND policyname = 'Service role has full access'
  ) THEN
    CREATE POLICY "Service role has full access"
      ON nowpayments_deposits
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nowpayments_deposits' AND policyname = 'Users can update own deposits'
  ) THEN
    CREATE POLICY "Users can update own deposits"
      ON nowpayments_deposits
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
