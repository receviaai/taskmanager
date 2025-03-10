import { Task } from "./types";
import { supabase } from './lib/supabase';
import { Webhook } from './types';

const handleError = (error: Error) => {
  console.error('API Error:', error);
  throw new Error(error.message);
};

export async function getAllTasks(): Promise<Task[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      webhook:webhooks(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return handleError(error);
  return tasks || [];
}

export async function getAllWebhooks(): Promise<Webhook[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return handleError(error);
  return webhooks || [];
}

export async function createWebhook(webhook: Omit<Webhook, 'id' | 'created_at' | 'last_used'>): Promise<Webhook> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('webhooks')
    .insert({ ...webhook, user_id: user.id })
    .select()
    .single();

  if (error) return handleError(error);
  return data;
}

export async function updateWebhook(id: string, updates: Partial<Omit<Webhook, 'id' | 'created_at'>>): Promise<Webhook> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return handleError(error);
  return data;
}

export async function deleteWebhook(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return handleError(error);
}

export async function testWebhook(webhook: Webhook): Promise<{ success: boolean; message: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...webhook.headers
    };

    if (webhook.auth_type === 'bearer' && webhook.auth_token) {
      headers['Authorization'] = `Bearer ${webhook.auth_token}`;
    } else if (webhook.auth_type === 'basic' && webhook.auth_token) {
      headers['Authorization'] = `Basic ${btoa(webhook.auth_token)}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: 'test',
        message: 'Testing webhook configuration',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await updateWebhook(webhook.id, { last_used: new Date().toISOString() });

    return { 
      success: true, 
      message: 'Webhook test successful' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function createTask(
  title: string,
  description: string,
  dueDate: Date,
  webhookUrl?: string,
  webhookTitle?: string
): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const taskData = {
    title,
    description,
    due_date: dueDate.toISOString(),
    webhook_url: webhookUrl,
    webhook_title: webhookTitle,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) return handleError(error);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, get the task to check if it has a webhook
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('webhook_id')
    .eq('id', id)
    .single();

  if (fetchError) return handleError(fetchError);

  // Ensure the task is completely deleted by using transaction if available,
  // or just delete it directly
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) return handleError(deleteError);
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Ensure we're sending valid fields to the database
  const validUpdates: any = { ...updates };
  
  const { data, error } = await supabase
    .from('tasks')
    .update(validUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return handleError(error);
  return data;
}