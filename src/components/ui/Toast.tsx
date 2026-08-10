"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, Info } from "lucide-react";

// Toast types — each gets a different icon + color
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  // Show a toast message — auto-dismisses after 3s
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

// Hook to access the toast function from any component
export function useToast() {
  return useContext(ToastContext);
}

// Icon map — maps toast type to its visual indicator
const ICONS: Record<ToastType, ReactNode> = {
  success: <Check size={16} />,
  error: <X size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

// Color map — maps toast type to its accent color class
const COLORS: Record<ToastType, string> = {
  success: "text-green-400 bg-green-400/10 border-green-400/20",
  error: "text-red-400 bg-red-400/10 border-red-400/20",
  warning: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  info: "text-brand-purple bg-brand-purple/10 border-brand-purple/20",
};

// Counter for unique toast IDs
let toastCounter = 0;

// Provider wraps the app layout — renders toasts at the top of the screen
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container — fixed at top center, above everything */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-strong backdrop-blur-xl pointer-events-auto ${COLORS[t.type]}`}
            >
              {ICONS[t.type]}
              <span className="text-white">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
