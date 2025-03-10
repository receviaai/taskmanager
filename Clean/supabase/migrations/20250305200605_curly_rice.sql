/*
  # Task Management Schema Setup

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `due_date` (timestamptz, required)
      - `webhook_url` (text, optional)
      - `created_at` (timestamptz, auto)
      - `completed` (boolean, default false)
      - `webhook_sent` (boolean, default false)
      - `user_id` (uuid, required, references auth.users)

  2. Security
    - Enable RLS on tasks table
    - Add policies for:
      - Users can only read their own tasks
      - Users can only create tasks for themselves
      - Users can only update their own tasks
      - Users can only delete their own tasks
*/

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  webhook_sent boolean DEFAULT false,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT title_length CHECK (char_length(title) > 0)
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
END $$;

-- Create policies
CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'tasks_user_id_idx'
  ) THEN
    CREATE INDEX tasks_user_id_idx ON tasks(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'tasks_created_at_idx'
  ) THEN
    CREATE INDEX tasks_created_at_idx ON tasks(created_at DESC);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'tasks_due_date_idx'
  ) THEN
    CREATE INDEX tasks_due_date_idx ON tasks(due_date);
  END IF;
END $$;