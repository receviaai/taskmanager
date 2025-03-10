/*
  # Create API Keys Table and Policies

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `key` (text, unique)
      - `name` (text)
      - `created_at` (timestamptz)
      - `last_used` (timestamptz)
      - `active` (boolean)

  2. Security
    - Enable RLS on api_keys table
    - Add policies for authenticated users to:
      - Create their own API keys
      - View their own API keys
      - Update their own API keys
      - Delete their own API keys

  3. Indexes
    - Index on user_id for faster lookups
    - Unique index on key
*/

-- Create API keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz,
  active boolean DEFAULT true,
  CONSTRAINT name_length CHECK (char_length(name) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_idx ON api_keys(key);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;

-- Create policies
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