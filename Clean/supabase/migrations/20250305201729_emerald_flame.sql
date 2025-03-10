/*
  # Add RLS policies for API keys table

  1. Security Changes
    - Enable RLS on api_keys table if not already enabled
    - Add policies for:
      - Creating API keys (authenticated users can create their own keys)
      - Reading API keys (users can only read their own keys)
      - Updating API keys (users can only update their own keys)
      - Deleting API keys (users can only delete their own keys)

  2. Notes
    - All policies ensure users can only access their own API keys
    - Each policy is created only if it doesn't already exist
    - Uses DO blocks to safely check for existing policies
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create insert policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND policyname = 'Users can create their own API keys'
  ) THEN
    CREATE POLICY "Users can create their own API keys"
    ON api_keys
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create select policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND policyname = 'Users can view their own API keys'
  ) THEN
    CREATE POLICY "Users can view their own API keys"
    ON api_keys
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create update policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND policyname = 'Users can update their own API keys'
  ) THEN
    CREATE POLICY "Users can update their own API keys"
    ON api_keys
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create delete policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND policyname = 'Users can delete their own API keys'
  ) THEN
    CREATE POLICY "Users can delete their own API keys"
    ON api_keys
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;