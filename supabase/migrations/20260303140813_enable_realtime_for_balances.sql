/*
  # Enable Realtime for Balance Tables

  1. Changes
    - Enables Supabase Realtime for usd_balances table
    - Enables Supabase Realtime for euro_balances table
    - Enables Supabase Realtime for cad_balances table
    - Enables Supabase Realtime for newcrypto_balances table

  2. Purpose
    - Allows frontend to receive live updates when balances change
    - Enables silent refresh of dashboard balances without polling
*/

ALTER PUBLICATION supabase_realtime ADD TABLE usd_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE euro_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE cad_balances;
ALTER PUBLICATION supabase_realtime ADD TABLE newcrypto_balances;