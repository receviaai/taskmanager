export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  webhook_id?: string;
  webhook_url?: string;
  webhook_title?: string;
  created_at: string;
  completed: boolean;
  webhook_sent?: boolean;
  user_id: string;
  recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_interval?: number;
  recurrence_day?: number;
  recurrence_end_date?: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  description?: string;
  headers?: Record<string, string>;
  auth_type: 'none' | 'basic' | 'bearer' | 'custom';
  auth_token?: string;
  enabled: boolean;
  created_at: string;
  last_used?: string;
}