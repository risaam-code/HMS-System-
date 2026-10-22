import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  addToast: (
    optionsOrMsg: string | { title?: string; message: string; type?: string },
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ title, message, type: 'success' }),
    [toast]
  );
  const error = useCallback(
    (message: string, title?: string) => toast({ title, message, type: 'danger' }),
    [toast]
  );
  const warning = useCallback(
    (message: string, title?: string) => toast({ title, message, type: 'warning' }),
    [toast]
  );
  const info = useCallback(
    (message: string, title?: string) => toast({ title, message, type: 'info' }),
    [toast]
  );
  const addToast = useCallback(
    (
      optionsOrMsg: string | { title?: string; message: string; type?: string },
      type: 'success' | 'error' | 'warning' | 'info' = 'info'
    ) => {
      if (typeof optionsOrMsg === 'object') {
        const tType = optionsOrMsg.type === 'error' ? 'danger' : (optionsOrMsg.type as ToastType) || 'info';
        toast({ title: optionsOrMsg.title, message: optionsOrMsg.message, type: tType });
      } else {
        if (type === 'success') success(optionsOrMsg);
        else if (type === 'error') error(optionsOrMsg);
        else if (type === 'warning') warning(optionsOrMsg);
        else info(optionsOrMsg);
      }
    },
    [toast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg bg-white transition-all transform ease-out',
              t.type === 'success' && 'border-emerald-200 text-slate-800',
              t.type === 'danger' && 'border-rose-200 text-slate-800',
              t.type === 'warning' && 'border-amber-200 text-slate-800',
              t.type === 'info' && 'border-blue-200 text-slate-800'
            )}
            role="alert"
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
            {t.type === 'danger' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}

            <div className="flex-1 space-y-0.5">
              {t.title && <h5 className="text-xs font-semibold text-slate-900">{t.title}</h5>}
              <p className="text-xs text-slate-600">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
