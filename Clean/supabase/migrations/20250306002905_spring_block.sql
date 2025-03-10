/*
  # Add webhook titles
  
  1. Changes
    - Add webhook_title column to tasks table
    
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE tasks 
ADD COLUMN webhook_title text;