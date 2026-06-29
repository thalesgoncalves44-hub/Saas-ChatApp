'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'rounded-lg px-4 py-3 shadow-lg border text-sm flex items-start justify-between gap-3 animate-in slide-in-from-right',
              t.variant === 'success' && 'bg-green-900 border-green-700 text-green-100',
              t.variant === 'error' && 'bg-red-900 border-red-700 text-red-100',
              t.variant === 'warning' && 'bg-yellow-900 border-yellow-700 text-yellow-100',
              (!t.variant || t.variant === 'default') && 'bg-gray-800 border-gray-700 text-gray-100'
            )}
          >
            <div>
              <div className="font-semibold">{t.title}</div>
              {t.description && <div className="text-xs opacity-80 mt-0.5">{t.description}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
