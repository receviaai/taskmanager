import React, { useState, useEffect } from 'react';
import { Clock, Bell, Plus, X, Calendar } from 'lucide-react';
import { Task, Webhook } from '../types';
import { updateTask, getAllWebhooks } from '../api';

interface TaskFormProps {
  onCreateTask: (
    title: string,
    description: string,
    dueDate: Date,
    webhookUrl?: string,
    webhookTitle?: string
  ) => void;
  onUpdateTask: (task: Task) => void;
  editingTask?: Task | null;
  onEditComplete?: () => void;
}

export function TaskForm({ onCreateTask, onUpdateTask, editingTask, onEditComplete }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookTitle, setWebhookTitle] = useState('');
  const [availableWebhooks, setAvailableWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize time to current time when form opens
  useEffect(() => {
    if (isOpen && !editingTask && !time) {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
  }, [isOpen, editingTask, time]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setWebhookUrl('');
    setWebhookTitle('');
  };

  // Load webhooks only when modal is opened to improve performance
  useEffect(() => {
    if (isOpen) {
      const loadWebhooks = async () => {
        if (availableWebhooks.length === 0) {
          setLoading(true);
          try {
            const webhooks = await getAllWebhooks();
            setAvailableWebhooks(webhooks.filter(w => w.enabled));
          } catch (error) {
            console.error('Failed to load webhooks:', error);
          } finally {
            setLoading(false);
          }
        }
      };
      loadWebhooks();
    }
  }, [isOpen, availableWebhooks.length]);

  useEffect(() => {
    if (editingTask) {
      setIsOpen(true);
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      
      const dueDate = new Date(editingTask.due_date);
      // Format date properly
      setDate(dueDate.toISOString().split('T')[0]);
      
      // Format time properly (handle timezone issues)
      const hours = String(dueDate.getHours()).padStart(2, '0');
      const minutes = String(dueDate.getMinutes()).padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      
      setWebhookUrl(editingTask.webhook_url || '');
      setWebhookTitle(editingTask.webhook_title || '');
    }
  }, [editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date || !time) {
      return; // Early validation check
    }

    try {
      // Create proper date object
      const dueDate = new Date(`${date}T${time}`);
      
      if (editingTask?.id) {
        // Update existing task
        onUpdateTask({
          ...editingTask,
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate.toISOString(),
          webhook_url: webhookUrl || null,
          webhook_title: webhookUrl ? webhookTitle || null : null
        });
        onEditComplete?.();
      } else {
        // Create new task
        onCreateTask(
          title.trim(),
          description.trim(),
          dueDate,
          webhookUrl,
          webhookTitle
        );
      }
      
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting task:', error);
      // Could add error handling UI here
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
    onEditComplete?.();
  };

  const getToday = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Create new task"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 py-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative animate-fade-in max-h-screen overflow-y-auto">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this task"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="task-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="task-date"
                      type="date"
                      value={date}
                      min={getToday()}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="task-time" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="task-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2 mb-1">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">Webhook (optional)</span>
                </label>
                
                <div className="mt-2">
                  <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-600 mb-1">
                    Webhook URL
                  </label>
                  <input
                    id="webhook-url"
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                
                {webhookUrl && (
                  <div className="mt-2">
                    <label htmlFor="webhook-title" className="block text-sm font-medium text-gray-600 mb-1">
                      Webhook Title (optional)
                    </label>
                    <input
                      id="webhook-title"
                      type="text"
                      value={webhookTitle}
                      onChange={(e) => setWebhookTitle(e.target.value)}
                      placeholder="Title for webhook notification"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                )}
                
                {availableWebhooks.length > 0 && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Select from saved webhooks
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      onChange={(e) => {
                        const selected = availableWebhooks.find(w => w.id === e.target.value);
                        if (selected) {
                          setWebhookUrl(selected.url);
                          setWebhookTitle(selected.name);
                        } else {
                          setWebhookUrl('');
                          setWebhookTitle('');
                        }
                      }}
                      value={availableWebhooks.find(w => w.url === webhookUrl)?.id || ''}
                    >
                      <option value="">-- Select webhook --</option>
                      {availableWebhooks.map(webhook => (
                        <option key={webhook.id} value={webhook.id}>
                          {webhook.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-lg transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}