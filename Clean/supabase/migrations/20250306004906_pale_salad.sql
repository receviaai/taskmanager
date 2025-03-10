/*
  # Create webhooks table and migrate webhook data

  1. New Tables
    - `webhooks`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `url` (text, required)
      - `description` (text)
      - `headers` (jsonb)
      - `auth_type` (text)
      - `auth_token` (text)
      - `enabled` (boolean)
      - `user_id` (uuid, references users)
      - `created_at` (timestamp)
      - `last_used` (timestamp)

  2. Changes to Tasks Table
    - Add `webhook_id` column referencing webhooks table

  3. Security
    - Enable RLS on webhooks table
    - Add policies for CRUD operations
*/

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  url text NOT NULL CHECK (url ~ '^https?://'),
  description text,
  headers jsonb DEFAULT '{}',
  auth_type text CHECK (auth_type IN ('none', 'basic', 'bearer', 'custom')),
  auth_token text,
  enabled boolean DEFAULT true,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz,
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
  ON webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add webhook_id to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS webhook_id uuid REFERENCES webhooks(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS webhooks_user_id_idx ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS tasks_webhook_id_idx ON tasks(webhook_id);

-- Migrate existing webhook data with proper null handling
DO $$
DECLARE
  task_record RECORD;
  webhook_id uuid;
BEGIN
  FOR task_record IN 
    SELECT DISTINCT ON (webhook_url, user_id)
      webhook_url,
      webhook_title,
      user_id
    FROM tasks 
    WHERE webhook_url IS NOT NULL 
      AND webhook_url != ''
  LOOP
    INSERT INTO webhooks (
      name,
      url,
      user_id
    ) 
    VALUES (
      COALESCE(
        NULLIF(task_record.webhook_title, ''),
        'Webhook ' || COALESCE(
          substring(task_record.webhook_url from '^(?:https?://)?(?:www\.)?([^/?#]+)'),
          'Endpoint'
        )
      ),
      task_record.webhook_url,
      task_record.user_id
    )
    ON CONFLICT (user_id, name) DO NOTHING;
  END LOOP;

  -- Update tasks with new webhook_id references
  UPDATE tasks t
  SET webhook_id = w.id
  FROM webhooks w
  WHERE t.webhook_url = w.url
  AND t.user_id = w.user_id;
END $$;