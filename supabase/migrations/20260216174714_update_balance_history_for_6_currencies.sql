/*
  # Update Balance History Table for 6 Currencies
  
  1. Changes
    - Add btc_balance column
    - Add eth_balance column
    - Add usdt_balance column
    - Drop unused currency columns (GBP, JPY, AUD, CHF)
    - Rename total_value to total_value_usd
*/

-- Add crypto balance columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balance_history' AND column_name = 'btc_balance'
  ) THEN
    ALTER TABLE balance_history ADD COLUMN btc_balance numeric(18, 8) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balance_history' AND column_name = 'eth_balance'
  ) THEN
    ALTER TABLE balance_history ADD COLUMN eth_balance numeric(18, 8) DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balance_history' AND column_name = 'usdt_balance'
  ) THEN
    ALTER TABLE balance_history ADD COLUMN usdt_balance numeric(20, 6) DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Rename total_value to total_value_usd if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balance_history' AND column_name = 'total_value'
  ) THEN
    ALTER TABLE balance_history RENAME COLUMN total_value TO total_value_usd;
  END IF;
END $$;

-- Add total_value_usd if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balance_history' AND column_name = 'total_value_usd'
  ) THEN
    ALTER TABLE balance_history ADD COLUMN total_value_usd numeric(30, 8) DEFAULT 0 NOT NULL;
  END IF;
END $$;