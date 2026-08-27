import React from 'react';
import { FileSearch } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EmptyState({ icon: Icon = FileSearch, title, message, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 w-full", className)}>
      <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">{title}</h3>
      {message && <p className="text-sm text-surface-500 max-w-sm mx-auto">{message}</p>}
      
      {action && (
        <button onClick={action.onClick} className="mt-6 btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}
