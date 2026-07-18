import { useState, useCallback, useMemo, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SLIDE_UP, SPRING } from '../../lib/animations';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduced = useReducedMotion();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
      timersRef.current.set(id, timer);
    },
    [],
  );

  const contextValue = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismiss(toast.id)}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const typeStyles: Record<Toast['type'], string> = {
  success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  error: 'bg-red-500/20 border-red-500/30 text-red-300',
  info: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
};

function ToastItem({
  toast,
  onDismiss,
  reduced,
}: {
  toast: Toast;
  onDismiss: () => void;
  reduced: boolean;
}) {
  return (
    <motion.div
      {...(reduced ? {} : SLIDE_UP)}
      transition={SPRING.snappy}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl ${typeStyles[toast.type]}`}
      role="status"
    >
      <span className="text-sm">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </motion.div>
  );
}
