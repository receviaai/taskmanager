import React, { useState, useEffect } from 'react';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { WebhookManager } from './components/WebhookManager';
import { Auth } from './components/Auth';
import { Task } from './types';
import { Activity, LogOut, Key, Bell, X } from 'lucide-react';
import { createTask as createTaskApi, getAllTasks, updateTask, deleteTask } from './api';
import { supabase } from './lib/supabase';
import { ApiKeys } from './components/ApiKeys';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set());

  // Load deleted task IDs from localStorage on initial load
  useEffect(() => {
    try {
      const storedDeletedTaskIds = localStorage.getItem('deletedTaskIds');
      if (storedDeletedTaskIds) {
        const parsedIds = JSON.parse(storedDeletedTaskIds);
        if (Array.isArray(parsedIds)) {
          setDeletedTaskIds(new Set(parsedIds));
        }
      }
    } catch (e) {
      console.error('Failed to parse deleted task IDs:', e);
    }
  }, []);

  // Update localStorage when deleted task IDs change
  useEffect(() => {
    localStorage.setItem('deletedTaskIds', JSON.stringify(Array.from(deletedTaskIds)));
  }, [deletedTaskIds]);

  // Mark a task as deleted
  const markTaskAsDeleted = (id: string) => {
    setDeletedTaskIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.add(id);
      return newIds;
    });
  };

  // Update task
  const handleUpdateTask = async (task: Task) => {
    try {
      if (deletedTaskIds.has(task.id)) {
        console.log(`Cannot update task ${task.id} as it's been deleted`);
        return;
      }

      const updatedTask = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        webhook_url: task.webhook_url
      });

      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // The simplified webhook processing function - runs every minute
  const processWebhooks = async () => {
    console.log('Checking for tasks to process...');
    const now = Date.now();
    
    // 1. Get all pending tasks that are due and have webhooks
    const tasksToProcess = tasks.filter(task => 
      !task.completed && 
      task.webhook_url && 
      !deletedTaskIds.has(task.id) && 
      new Date(task.due_date).getTime() <= now
    );
    
    console.log(`Found ${tasksToProcess.length} tasks to process`);
    
    // 2. Process tasks one by one
    for (const task of tasksToProcess) {
      try {
        console.log(`Processing task ${task.id}: ${task.title}`);
        
        // Double check with database to ensure task still exists
        const { data: { user } } = await supabase.auth.getUser();
        const { data: taskExists, error } = await supabase
          .from('tasks')
          .select('id')
          .eq('id', task.id)
          .eq('user_id', user.id)
          .single();
        
        // If task no longer exists in database, remove from state
        if (error || !taskExists) {
          console.log(`Task ${task.id} no longer exists in the database, removing from state`);
          markTaskAsDeleted(task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
          continue;
        }
        
        // If task was deleted during processing, skip
        if (deletedTaskIds.has(task.id)) {
          console.log(`Task ${task.id} was deleted during processing, skipping webhook`);
          continue;
        }
        
        // 3. Mark as completed first in database
        await updateTask(task.id, {
          completed: true,
          webhook_sent: true
        });
        
        // 4. Update the UI
        setTasks(prev =>
          prev.map(t => t.id === task.id ? { ...t, completed: true, webhook_sent: true } : t)
        );

        // 5. Send the webhook
        console.log(`Sending webhook for task ${task.id}`);
        await fetch(task.webhook_url, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'task_completed',
            task: {
              title: task.title,
              description: task.description,
              due_date: task.due_date
            }
          })
        });
        
        console.log(`Successfully processed task ${task.id}`);
      } catch (error) {
        console.error(`Failed to process webhook for task ${task.id}:`, error);
      }
    }
    
    // 6. Auto-complete tasks without webhooks
    const tasksToAutoComplete = tasks.filter(task => 
      !task.completed && 
      !task.webhook_url && 
      !deletedTaskIds.has(task.id) &&
      new Date(task.due_date).getTime() <= now
    );
    
    console.log(`Auto-completing ${tasksToAutoComplete.length} tasks without webhooks`);
    
    for (const task of tasksToAutoComplete) {
      try {
        await updateTask(task.id, { completed: true });
        setTasks(prev =>
          prev.map(t => t.id === task.id ? { ...t, completed: true } : t)
        );
        console.log(`Auto-completed task ${task.id}`);
      } catch (error) {
        console.error(`Failed to auto-complete task ${task.id}:`, error);
      }
    }
  };

  // Run webhook processor every minute
  useEffect(() => {
    if (!session?.user) return;
    
    // Run webhook processor every minute
    const intervalId = setInterval(processWebhooks, 60000);
    
    // Also run once immediately when tasks load or change
    if (tasks.length > 0) {
      processWebhooks();
    }
    
    return () => clearInterval(intervalId);
  }, [tasks, session, deletedTaskIds]);

  // Handle task deletion
  const handleDeleteTask = async (id: string) => {
    try {
      console.log(`Deleting task ${id}`);
      
      // 1. Mark as deleted in our tracking system immediately
      markTaskAsDeleted(id);
      
      // 2. Remove from UI state
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // 3. Delete from database
      await deleteTask(id);
      
      console.log(`Task ${id} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Reload tasks if the deletion failed
      getAllTasks().then(setTasks);
    }
  };

  // Authentication effects
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load tasks when session changes
  useEffect(() => {
    if (session?.user) {
      getAllTasks().then(setTasks);
    } else {
      setTasks([]);
    }
  }, [session]);

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Create a new task - simplified without recurring functionality
  const createTask = async (
    title: string,
    description: string,
    dueDate: Date,
    webhookUrl?: string,
    webhookTitle?: string
  ) => {
    try {
      const newTask = await createTaskApi(
        title,
        description,
        dueDate,
        webhookUrl,
        webhookTitle
      );
      setTasks((prev) => [...prev, newTask]);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // Filter tasks for display
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => {
    if (!task.completed) return false;
    const daysSinceCompletion = (Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCompletion < 1;
  });
  const recentCompletedTasks = completedTasks.slice(0, 10);
  const historicalTasks = tasks.filter((task) => {
    if (!task.completed) return false;
    const daysSinceCompletion = (Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCompletion >= 1;
  });
  const sortedHistoricalTasks = historicalTasks.sort((a, b) => 
    new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  );

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="h-10 w-10 border-t-3 border-indigo-600 border-solid rounded-full animate-spin" />
      </div>
    );
  }

  // Auth screen
  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <header className="bg-white rounded-xl shadow-sm mb-8 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">AI Task Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWebhooks(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </button>
            <button
              onClick={() => setShowApiKeys(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API Keys</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <TaskList
            title="Pending Tasks"
            tasks={pendingTasks}
            type="pending"
            onDeleteTask={handleDeleteTask}
            onEditTask={setEditingTask}
          />
          <TaskList
            title="Completed Tasks"
            tasks={recentCompletedTasks}
            type="completed"
          />
        </div>

        {sortedHistoricalTasks.length > 0 && (
          <div className="mb-8">
            <TaskList
              title="Task History"
              tasks={sortedHistoricalTasks}
              type="history"
              paginated
            />
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <TaskForm 
            onCreateTask={createTask} 
            editingTask={editingTask}
            onUpdateTask={handleUpdateTask}
            onEditComplete={() => setEditingTask(null)}
          />
        </div>
      </div>
      
      {showApiKeys && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">API Keys</h2>
              <button
                onClick={() => setShowApiKeys(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ApiKeys />
          </div>
        </div>
      )}
      
      {showWebhooks && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Webhook Management</h2>
              <button
                onClick={() => setShowWebhooks(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <WebhookManager />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;