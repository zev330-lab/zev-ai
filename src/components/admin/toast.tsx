'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type'], action?: Toast['action']) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success', action?: Toast['action']) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[80] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm animate-[slideIn_0.3s_ease] ${
              t.type === 'success' ? 'bg-green-600 text-white' :
              t.type === 'error' ? 'bg-red-600 text-white' :
              'bg-[var(--color-accent)] text-white'
            }`}
            style={{ animation: 'slideIn 0.3s ease' }}
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action?.onClick(); dismiss(t.id); }}
                className="font-semibold underline cursor-pointer"
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100 cursor-pointer">&times;</button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
