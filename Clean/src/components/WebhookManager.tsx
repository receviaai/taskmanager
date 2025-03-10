import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Check, X, RefreshCw, Edit2, Power, ExternalLink, Menu } from 'lucide-react';
import { Webhook } from '../types';
import { getAllWebhooks, createWebhook, updateWebhook, deleteWebhook } from '../api';

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const webhooks = await getAllWebhooks();
      setWebhooks(webhooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      setError('Failed to load webhooks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWebhook = (webhookId: string) => {
    setEditingWebhookId(webhookId);
    setIsAddingWebhook(false);
  };

  const handleCancelEdit = () => {
    setEditingWebhookId(null);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        await deleteWebhook(webhookId);
        await loadWebhooks();
      } catch (error) {
        console.error('Failed to delete webhook:', error);
        setError('Failed to delete webhook. Please try again.');
      }
    }
  };

  const handleAddWebhook = () => {
    setIsAddingWebhook(true);
    setEditingWebhookId(null);
  };

  const handleCancelAdd = () => {
    setIsAddingWebhook(false);
  };

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 border-t-2 border-indigo-600 border-solid rounded-full animate-spin mb-4" />
          <p className="text-gray-600 text-sm">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 mb-2 text-sm">
          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="line-clamp-2">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Webhook Management</h2>
              <p className="text-xs sm:text-sm text-gray-500">Configure notifications for external systems</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadWebhooks}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh webhooks"
              aria-label="Refresh webhooks"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleAddWebhook}
              className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm font-medium transition-colors shadow-sm"
              disabled={isAddingWebhook}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Add Webhook</span>
            </button>
          </div>
        </div>
      </div>

      {isAddingWebhook && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 relative">
          <div className="border-b border-gray-200 pb-3 mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Create New Webhook</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Connect your application to external services</p>
          </div>
          <WebhookForm
            onSave={() => {
              setIsAddingWebhook(false);
              loadWebhooks();
            }}
            onCancel={handleCancelAdd}
          />
        </div>
      )}

      <div className="grid gap-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            {editingWebhookId === webhook.id ? (
              <div>
                <div className="border-b border-gray-200 pb-3 mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Edit Webhook</h3>
                </div>
                <WebhookForm
                  webhook={webhook}
                  onSave={() => {
                    setEditingWebhookId(null);
                    loadWebhooks();
                  }}
                  onCancel={handleCancelEdit}
                />
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mr-2 break-all">{webhook.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${webhook.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {webhook.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-start text-xs sm:text-sm text-gray-500">
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <a 
                        href={webhook.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-600 hover:text-indigo-800 hover:underline break-all"
                      >
                        {webhook.url}
                      </a>
                    </div>
                    {webhook.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-2 border-t border-gray-100 pt-2">{webhook.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 sm:ml-4 self-end sm:self-start">
                    <button
                      onClick={() => handleEditWebhook(webhook.id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit webhook"
                      aria-label="Edit webhook"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete webhook"
                      aria-label="Delete webhook"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {webhooks.length === 0 && !isAddingWebhook && (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
            <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto px-4">Webhooks allow you to receive real-time notifications when events occur in your system.</p>
            <button
              onClick={handleAddWebhook}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              Add Your First Webhook
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// WebhookForm component extracted outside the main component to improve readability
const WebhookForm = ({ 
  webhook, 
  onSave, 
  onCancel 
}: { 
  webhook?: Webhook; 
  onSave: () => void; 
  onCancel: () => void 
}) => {
  const [formState, setFormState] = useState({
    name: webhook?.name || '',
    url: webhook?.url || '',
    description: webhook?.description || '',
    enabled: webhook?.enabled ?? true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Update form state when webhook prop changes
  useEffect(() => {
    if (webhook) {
      setFormState({
        name: webhook.name,
        url: webhook.url,
        description: webhook.description || '',
        enabled: webhook.enabled
      });
    }
  }, [webhook]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleEnabled = () => {
    setFormState(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formState.url.startsWith('http://') && !formState.url.startsWith('https://')) {
      setFormError('URL must start with http:// or https://');
      return;
    }
    
    try {
      setIsSaving(true);
      if (webhook) {
        await updateWebhook(webhook.id, {
          name: formState.name,
          url: formState.url,
          description: formState.description,
          enabled: formState.enabled
        });
      } else {
        await createWebhook({
          name: formState.name,
          url: formState.url,
          description: formState.description,
          auth_type: 'none',
          enabled: formState.enabled
        });
      }
      onSave();
    } catch (error) {
      console.error('Failed to save webhook:', error);
      setFormError('Failed to save webhook. Please check your inputs and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs sm:text-sm">
          {formError}
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="webhook-name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="webhook-name"
            type="text"
            name="name"
            value={formState.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
            placeholder="Webhook name"
          />
        </div>

        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="webhook-url" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">URL</label>
          <input
            id="webhook-url"
            type="url"
            name="url"
            value={formState.url}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
            placeholder="https://example.com/webhook"
          />
        </div>
      </div>

      <div>
        <label htmlFor="webhook-description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          id="webhook-description"
          name="description"
          value={formState.description}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm h-16 sm:h-20"
          placeholder="Optional description"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div 
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${formState.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
            onClick={handleToggleEnabled}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formState.enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            {formState.enabled ? 'Webhook Enabled' : 'Webhook Disabled'}
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100 mt-4 sm:mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-white border-solid rounded-full animate-spin" />
              <span>{webhook ? 'Saving...' : 'Creating...'}</span>
            </>
          ) : (
            <>{webhook ? 'Save Changes' : 'Create Webhook'}</>
          )}
        </button>
      </div>
    </form>
  );
};