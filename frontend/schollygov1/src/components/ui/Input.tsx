import React, { InputHTMLAttributes } from 'react';
import { motion } from 'motion/react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  errorText?: string;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  helperText?: string;
  /** Ref forwarded to the inner container div — used by callers to drive Framer Motion animations (e.g. shake) on the field wrapper. */
  containerRef?: React.Ref<HTMLDivElement>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, errorText, success, icon, iconPosition = 'left', helperText, disabled, id, containerRef, ...props }, ref) => {
    
    const baseInput = 'w-full text-sm rounded-input block transition-all duration-300 outline-none placeholder-slate-500 border-2 shadow-inner';
    
    // Determine padding based on icon presence
    const padding = icon 
      ? (iconPosition === 'left' ? 'py-3.5 pr-3.5 pl-11' : 'py-3.5 pl-3.5 pr-11')
      : 'p-3.5';

    // State classes
    let stateClasses = 'bg-bg-surface hover:bg-bg-surface-elevated/50 border-border-subtle focus:bg-bg-surface focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary text-text-primary';
    
    if (disabled) {
      stateClasses = 'bg-bg-surface opacity-60 cursor-not-allowed border-border-subtle text-text-muted';
    } else if (errorText) {
      stateClasses = 'bg-semantic-error/10 border-semantic-error/60 focus:ring-4 focus:ring-semantic-error/20 focus:border-semantic-error text-text-primary shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    } else if (success) {
      stateClasses = 'bg-bg-surface hover:bg-bg-surface-elevated/50 border-semantic-success/50 focus:bg-bg-surface focus:ring-4 focus:ring-semantic-success/20 focus:border-semantic-success text-text-primary';
    }

    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">
            {label}
          </label>
        )}
        
        {helperText && !errorText && (
          <p className="text-xs text-text-muted mb-3 font-medium">{helperText}</p>
        )}

        <motion.div ref={containerRef} className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!errorText}
            className={`${baseInput} ${padding} ${stateClasses}`}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-text-muted">
              {icon}
            </div>
          )}
        </motion.div>

        {errorText && (
          <p
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="text-xs text-semantic-error mt-2 font-medium animate-fade-in"
          >
            {errorText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
