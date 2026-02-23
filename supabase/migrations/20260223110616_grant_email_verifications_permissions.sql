/*
  # Grant permissions on email_verifications table

  1. Security
    - Grant all permissions to service_role for edge functions
    - Grant necessary permissions to authenticated users
*/

GRANT ALL ON email_verifications TO service_role;
GRANT ALL ON email_verifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_verifications TO anon;