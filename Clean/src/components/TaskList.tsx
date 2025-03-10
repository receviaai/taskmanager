import React from 'react';
import { CheckCircle, Clock, XCircle, Trash2, Edit, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  title: string;
  tasks: Task[];
  type: 'pending' | 'completed' | 'history';
  onDeleteTask?: (id: string) => void;
  onEditTask?: (task: Task) => void;
  paginated?: boolean;
}

export function TaskList({ title, tasks, type, onDeleteTask, onEditTask, paginated }: TaskListProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [visibleTasks, setVisibleTasks] = React.useState(10);

  const getTimeLeft = (task: Task) => {
    if (task.completed) return '0m';
    const endTime = new Date(task.due_date).getTime();
    const timeLeft = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(timeLeft / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDueDate = (dateStr: string) => {
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      return 'Invalid Date';
    }
    return parsedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  const displayedTasks = paginated 
    ? isExpanded 
      ? tasks.slice(0, visibleTasks)
      : []
    : tasks;

  const handleLoadMore = () => {
    setVisibleTasks(prev => prev + 10);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div 
        className={`flex items-center gap-4 mb-6 ${paginated ? 'cursor-pointer' : ''}`}
        onClick={() => paginated && setIsExpanded(!isExpanded)}
      >
        {type === 'pending' ? (
          <Clock className="w-6 h-6 text-yellow-600" />
        ) : (
          <CheckCircle className={`w-6 h-6 ${type === 'history' ? 'text-gray-600' : 'text-green-600'}`} />
        )}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        {paginated && (
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        )}
        <span className="ml-auto bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
          {tasks.length} tasks
        </span>
      </div>
      <div className={`space-y-4 ${paginated && !isExpanded ? 'hidden' : ''}`}>
        {displayedTasks.map((task) => (
          <div
            key={task.id}
            className="border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{task.title}</h3>
                {task.description && (
                  <p className="text-gray-600 mt-1 text-sm">{task.description}</p>
                )}
                <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                  <span>Due:</span>
                  <span>{formatDueDate(task.due_date)}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {type === 'pending' ? (
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-600 font-medium">{getTimeLeft(task)}</span>
                    {onEditTask && (
                      <button
                        onClick={() => onEditTask(task)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteTask && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : type === 'history' ? (
                  <span className="text-gray-600">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {displayedTasks.length === 0 && !paginated && (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {type === 'history' ? 'No historical tasks' : `No ${type} tasks`}
            </p>
          </div>
        )}
        {paginated && isExpanded && visibleTasks < tasks.length && (
          <button
            onClick={handleLoadMore}
            className="w-full py-2 px-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors mt-4"
          >
            Load More Tasks
          </button>
        )}
      </div>
    </div>
  );
}