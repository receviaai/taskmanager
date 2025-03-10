import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
  active: boolean;
}

export function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading API keys:', error);
      return;
    }

    setApiKeys(keys || []);
    setLoading(false);
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const key = crypto.randomUUID().replace(/-/g, '') + 
                  crypto.randomUUID().replace(/-/g, '');

      const { error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName.trim(),
          key,
          user_id: user.id
        });

      if (error) throw error;
      
      setNewKeyName('');
      await loadApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      return;
    }

    loadApiKeys();
  };

  const copyToClipboard = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 border-t-2 border-indigo-600 border-solid rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex justify-center items-center h-10 w-10 rounded-lg bg-indigo-100">
          <Key className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">API Keys</h2>
      </div>

      <form onSubmit={createApiKey} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="API Key Name"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!newKeyName.trim()}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Key</span>
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors shadow-sm hover:shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{apiKey.name}</h3>
                  <button
                    onClick={() => deleteApiKey(apiKey.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                    aria-label="Delete API key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto bg-gray-50 p-2 rounded-lg">
                  <code className="text-sm font-mono text-gray-700 break-all whitespace-nowrap">
                    {apiKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(apiKey.key)}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-auto"
                    aria-label="Copy to clipboard"
                  >
                    {copied === apiKey.key ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
                  {apiKey.last_used && (
                    <span>Last used: {new Date(apiKey.last_used).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {apiKeys.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
            <Key className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p>No API keys yet. Generate one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}