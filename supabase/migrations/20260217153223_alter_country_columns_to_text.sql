/*
  # Alter country columns to support full country names

  1. Changes
    - Change `country` column from `character(2)` to `text`
    - Change `bank_country` column from `character(2)` to `text`
    - Remove any length constraints

  2. Notes
    - This allows storing full country names instead of just 2-character codes
    - Existing data will be preserved
*/

-- Drop any check constraints that might enforce length
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'external_accounts_country_check'
    AND table_name = 'external_accounts'
  ) THEN
    ALTER TABLE public.external_accounts DROP CONSTRAINT external_accounts_country_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'external_accounts_bank_country_check'
    AND table_name = 'external_accounts'
  ) THEN
    ALTER TABLE public.external_accounts DROP CONSTRAINT external_accounts_bank_country_check;
  END IF;
END $$;

-- Change country column type from character(2) to text
ALTER TABLE public.external_accounts
  ALTER COLUMN country TYPE text;

-- Change bank_country column type from character(2) to text
ALTER TABLE public.external_accounts
  ALTER COLUMN bank_country TYPE text;
