
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
  // Styles adjusted for potentially dark (portal) or light (generated site input) contexts.
  // The className prop allows overriding. Base is somewhat neutral.
  const baseStyle = "block w-full px-4 py-2.5 rounded-lg bg-background border border-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors duration-150 placeholder-muted-foreground text-foreground disabled:opacity-50";
  const errorStyle = error ? "border-destructive focus:border-destructive focus:ring-destructive" : "";

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>}
      <input
        id={id}
        className={`${baseStyle} ${errorStyle} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
};
