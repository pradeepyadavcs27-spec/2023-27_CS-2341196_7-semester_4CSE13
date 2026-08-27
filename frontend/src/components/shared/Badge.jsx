import React from 'react';
import { cn } from '../../lib/utils';

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    danger: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    default: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300 border-surface-200 dark:border-surface-700',
  };

  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium rounded-full border",
      variants[variant] || variants.default,
      className
    )}>
      {children}
    </span>
  );
}
