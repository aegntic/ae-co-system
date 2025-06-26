import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@shared/hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Cross2Icon, CheckCircledIcon, ExclamationTriangleIcon, InfoCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

const ToastContext = createContext<ReturnType<typeof useToast> | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toast.toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={cn(
                'flex items-start gap-3 rounded-md p-4 shadow-lg min-w-[320px] max-w-[520px]',
                'bg-white dark:bg-slate-900 border',
                {
                  'border-emerald-200 dark:border-emerald-800': item.type === 'success',
                  'border-red-200 dark:border-red-800': item.type === 'error',
                  'border-amber-200 dark:border-amber-800': item.type === 'warning',
                  'border-blue-200 dark:border-blue-800': item.type === 'info',
                }
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.type === 'success' && <CheckCircledIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                {item.type === 'error' && <CrossCircledIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
                {item.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                {item.type === 'info' && <InfoCircledIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {item.title}
                </h4>
                {item.message && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {item.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => toast.removeToast(item.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}