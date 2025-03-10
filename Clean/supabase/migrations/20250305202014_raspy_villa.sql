/*
  # Fix API Keys Table and Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper permissions
    - Add missing foreign key reference to auth.users

  2. Security
    - Enable RLS
    - Add comprehensive policies for CRUD operations
    - Ensure proper user isolation
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;

-- Ensure RLS is enabled
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
CREATE POLICY "Insert own API keys"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Select own API keys"
ON api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Update own API keys"
ON api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delete own API keys"
ON api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);