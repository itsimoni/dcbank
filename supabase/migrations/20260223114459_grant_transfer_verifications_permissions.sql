/*
  # Grant permissions for transfer_verifications table

  1. Security Changes
    - Grant all permissions to service_role for edge function access
    - Grant necessary permissions to authenticated users
*/

GRANT ALL ON transfer_verifications TO service_role;
GRANT SELECT, INSERT, UPDATE ON transfer_verifications TO authenticated;
