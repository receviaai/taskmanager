/*
  # Create tasks table with RLS policies

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `due_date` (timestamptz)
      - `webhook_url` (text, optional)
      - `created_at` (timestamptz)
      - `completed` (boolean)
      - `webhook_sent` (boolean)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on tasks table
    - Add policies for authenticated users to:
      - Read their own tasks
      - Create new tasks
      - Update their own tasks
*/

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  due_date timestamptz NOT NULL,
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  webhook_sent boolean DEFAULT false,
  user_id uuid REFERENCES auth.users NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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