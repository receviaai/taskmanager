/*
  # Add cascade delete for tasks

  1. Changes
    - Add ON DELETE CASCADE to tasks.webhook_id foreign key
    - This ensures when a task is deleted, all related data is properly cleaned up

  2. Security
    - No changes to RLS policies
*/

-- Drop existing foreign key constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_webhook_id_fkey;

-- Re-add with CASCADE
ALTER TABLE tasks 
ADD CONSTRAINT tasks_webhook_id_fkey 
FOREIGN KEY (webhook_id) 
REFERENCES webhooks(id) 
ON DELETE CASCADE;