import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, ArrowRight, Key, X } from 'lucide-react';
import { ApiKeys } from './ApiKeys';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (authError) {
        throw authError;
      }
      
      if (isLogin) {
        setIsAuthenticated(true);
      }
      onAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleShowApiKeys = () => {
    setShowApiKeys(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white z-0" />
        <div className="relative z-10">
        <div className="text-center">
          {isLogin ? (
            <div className="bg-indigo-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <LogIn className="h-8 w-8 text-indigo-600" />
            </div>
          ) : (
            <div className="bg-indigo-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-indigo-600" />
            </div>
          )}
          {isAuthenticated && (
            <button
              onClick={handleShowApiKeys}
              className="absolute top-4 right-4 text-indigo-600 hover:text-indigo-700 focus:outline-none"
            >
              <Key className="w-6 h-6" />
            </button>
          )}
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm bg-white shadow-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                autoComplete={isLogin ? "current-password" : "new-password"}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm bg-white shadow-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <span className="absolute right-0 inset-y-0 flex items-center pr-3">
                <div className="h-5 w-5 border-t-2 border-white border-solid rounded-full animate-spin" />
              </span>
            ) : (
              <span className="absolute right-0 inset-y-0 flex items-center pr-3">
                <ArrowRight className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
              </span>
            )}
            {isLogin ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        </div>
        
        {showApiKeys && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl relative">
              <button
                onClick={() => setShowApiKeys(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <ApiKeys />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}