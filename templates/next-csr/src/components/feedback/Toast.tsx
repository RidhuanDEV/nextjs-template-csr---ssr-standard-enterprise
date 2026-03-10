'use client';

import { useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useToastStore, type Toast as ToastType } from '@/store/toast.store';

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-center rounded-lg p-4 shadow-lg',
        {
          'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100':
            toast.type === 'success',
          'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100': toast.type === 'error',
          'bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100': toast.type === 'info',
          'bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100':
            toast.type === 'warning',
        }
      )}
    >
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-3 inline-flex shrink-0 rounded-md p-1 hover:opacity-70"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
