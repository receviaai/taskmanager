/*
  # Add recurring tasks support
  
  1. Changes
    - Add recurring task fields to tasks table:
      - `recurring` (boolean): Whether the task is recurring
      - `recurrence_pattern` (text): Daily, Weekly, Monthly, etc.
      - `recurrence_interval` (integer): Interval between recurrences
      - `recurrence_day` (integer): Day of week/month for recurrence
      - `recurrence_end_date` (timestamptz): When to stop recurring
      
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE tasks 
ADD COLUMN recurring boolean DEFAULT false,
ADD COLUMN recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN recurrence_interval integer CHECK (recurrence_interval > 0),
ADD COLUMN recurrence_day integer,
ADD COLUMN recurrence_end_date timestamptz;