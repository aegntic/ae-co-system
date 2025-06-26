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
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={cn(
                'flex items-start gap-3 rounded-xl p-4 min-w-[320px] max-w-[520px]',
                'glass border',
                {
                  'border-neural-green/50': item.type === 'success',
                  'border-neural-pink/50': item.type === 'error',
                  'border-neural-purple/50': item.type === 'warning',
                  'border-neural-cyan/50': item.type === 'info',
                }
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.type === 'success' && <CheckCircledIcon className="w-5 h-5 text-neural-green neon-text" />}
                {item.type === 'error' && <CrossCircledIcon className="w-5 h-5 text-neural-pink neon-text" />}
                {item.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-neural-purple neon-text" />}
                {item.type === 'info' && <InfoCircledIcon className="w-5 h-5 text-neural-cyan neon-text" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm text-white">
                  {item.title}
                </h4>
                {item.message && (
                  <p className="mt-1 text-sm text-gray-400">
                    {item.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => toast.removeToast(item.id)}
                className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
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