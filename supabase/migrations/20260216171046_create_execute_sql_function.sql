/*
  # Create SQL Execution Function

  1. Functions
    - `execute_sql` - Allows authenticated users to execute SQL queries
      - This is a powerful function that should be used carefully
      - Only accessible by admin users for security reasons

  2. Security
    - Function is SECURITY DEFINER to allow execution with elevated privileges
    - Only accessible by users with admin role in accounts table
*/

-- Create function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM accounts
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) INTO is_admin;

  -- Only allow admins to execute queries
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can execute SQL queries';
  END IF;

  -- Execute the query and return results as JSON
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query) INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;