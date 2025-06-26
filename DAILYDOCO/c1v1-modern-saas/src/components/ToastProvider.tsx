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
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={cn(
                'flex items-start gap-3 rounded-lg p-4 shadow-lg min-w-[300px] max-w-[500px]',
                'bg-white dark:bg-gray-900 border',
                {
                  'border-green-200 dark:border-green-800': item.type === 'success',
                  'border-red-200 dark:border-red-800': item.type === 'error',
                  'border-yellow-200 dark:border-yellow-800': item.type === 'warning',
                  'border-blue-200 dark:border-blue-800': item.type === 'info',
                }
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.type === 'success' && <CheckCircledIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
                {item.type === 'error' && <CrossCircledIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
                {item.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                {item.type === 'info' && <InfoCircledIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {item.title}
                </h4>
                {item.message && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => toast.removeToast(item.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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