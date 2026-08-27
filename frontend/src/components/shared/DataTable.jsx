import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import EmptyState from './EmptyState';

export default function DataTable({ 
  columns, 
  data, 
  loading, 
  emptyMessage = "No data found",
  pagination,
  onPageChange,
  onSort,
  sortConfig
}) {
  if (loading) {
    return (
      <div className="w-full glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-surface-200 dark:border-surface-700">
                  {columns.map((col, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full glass-card p-8">
        <EmptyState title="No Data" message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="w-full glass-card overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={cn(
                    "px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300",
                    col.sortable && "cursor-pointer select-none hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortConfig?.key === col.key && (
                      <span className="text-primary-500">
                        {sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700/50">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-sm text-surface-700 dark:text-surface-300 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing <span className="font-medium text-surface-900 dark:text-surface-100">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-surface-900 dark:text-surface-100">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-surface-900 dark:text-surface-100">{pagination.total}</span> results
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {/* Simple page numbers for now */}
            <span className="text-sm px-2 font-medium">Page {pagination.page} of {pagination.pages}</span>

            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
