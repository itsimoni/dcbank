/*
  # Add CHF Balance Column to Balance History

  1. Changes
    - Add `chf_balance` column to `balance_history` table if it doesn't exist

  2. Notes
    - CHF (Swiss Franc) is a commonly tracked currency
    - Default value is 0 for existing records
*/

-- Add CHF balance column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balance_history' AND column_name = 'chf_balance'
  ) THEN
    ALTER TABLE balance_history ADD COLUMN chf_balance numeric(20, 2) DEFAULT 0 NOT NULL;
  END IF;
END $$;