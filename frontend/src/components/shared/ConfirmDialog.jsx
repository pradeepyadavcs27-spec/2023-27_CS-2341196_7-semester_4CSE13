import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type = 'danger', loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action" size="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          type === 'danger' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500"
        )}>
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white">{title}</h3>
          <p className="text-sm text-surface-500 mt-2">{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-6">
          <button onClick={onClose} disabled={loading} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={loading}
            className={cn("flex-1", type === 'danger' ? "btn-danger" : "btn-primary")}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
