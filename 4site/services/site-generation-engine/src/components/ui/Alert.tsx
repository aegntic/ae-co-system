
import React from 'react';
import { Icon } from './Icon'; // Adjusted

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ message, type = 'info', className = '', onClose }) => {
  // Styles adapted for dark background portal
  const alertStyles = {
    base: "p-4 rounded-lg flex items-start text-sm",
    success: "bg-green-500/20 text-green-300 border border-green-500/40",
    error: "bg-red-500/20 text-red-300 border border-red-500/40",
    warning: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
    info: "bg-sky-500/20 text-sky-300 border border-sky-500/40",
  };

  const iconMap = {
    success: 'CheckCircle2',
    error: 'AlertTriangle',
    warning: 'AlertCircle',
    info: 'Info',
  }  as const; // Ensure type safety for iconMap keys


  return (
    <div className={`${alertStyles.base} ${alertStyles[type]} ${className}`} role="alert">
      <Icon name={iconMap[type]} size={20} className="mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex-grow">{message}</div>
      {onClose && (
        <button onClick={onClose} className="ml-4 -mr-1 -mt-1 p-1 rounded hover:bg-white/10 transition-colors">
          <Icon name="X" size={18} />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  );
};
