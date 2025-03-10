/*
  # Recreate API keys policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper permissions

  2. Security
    - Enable RLS on api_keys table
    - Add policies for:
      - INSERT: Users can create their own API keys
      - SELECT: Users can view their own API keys
      - UPDATE: Users can update their own API keys
      - DELETE: Users can delete their own API keys
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
  DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
  DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
  DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
END $$;

-- Enable RLS (in case it's not enabled)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can create their own API keys"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own API keys"
ON api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
ON api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
ON api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);