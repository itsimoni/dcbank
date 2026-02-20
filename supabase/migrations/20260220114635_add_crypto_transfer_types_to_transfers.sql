/*
  # Add Crypto Transfer Types to Transfers Table

  1. Changes
    - Drops the existing `transfers_transfer_type_check` constraint
    - Creates a new constraint that includes:
      - `internal` (fiat currency exchange)
      - `bank_transfer` (external bank transfer)
      - `crypto_internal` (crypto-to-crypto exchange)
      - `crypto_external` (crypto withdrawal to external wallet)

  2. Purpose
    - Enables the transfers table to store crypto internal and external transfers
    - Maintains data integrity with proper type validation
*/

ALTER TABLE public.transfers
DROP CONSTRAINT IF EXISTS transfers_transfer_type_check;

ALTER TABLE public.transfers
ADD CONSTRAINT transfers_transfer_type_check CHECK (
  transfer_type = ANY (ARRAY[
    'internal'::text,
    'bank_transfer'::text,
    'crypto_internal'::text,
    'crypto_external'::text
  ])
);