import React from 'react';
import { cn } from '../../lib/utils';

export function CardSkeleton({ className }) {
  return (
    <div className={cn("glass-card p-6 animate-pulse", className)}>
      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-surface-200 dark:border-surface-700 animate-pulse">
      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/4"></div>
      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/4"></div>
      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/4"></div>
      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/4"></div>
    </div>
  );
}

export function ChartSkeleton({ className }) {
  return (
    <div className={cn("glass-card p-6 animate-pulse flex flex-col justify-between", className)}>
      <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-1/4 mb-6"></div>
      <div className="flex-1 w-full flex items-end gap-2">
        {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
          <div key={i} className="flex-1 bg-surface-200 dark:bg-surface-700 rounded-t" style={{ height: `${h}%` }}></div>
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-1/2">
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-full mb-2"></div>
          <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-surface-200 dark:bg-surface-700"></div>
      </div>
      <div className="mt-4 h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/3"></div>
    </div>
  );
}
