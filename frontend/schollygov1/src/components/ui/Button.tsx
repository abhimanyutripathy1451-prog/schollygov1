import React, { ButtonHTMLAttributes } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, fullWidth = false, children, disabled, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app cursor-pointer';
    
    // Sizing
    const sizeClasses = {
      sm: 'px-4 py-2 text-xs rounded-lg',
      md: 'px-5 py-3.5 text-sm rounded-xl',
      lg: 'px-8 py-4 text-base rounded-2xl'
    };
    
    // Variants
    const variants = {
      primary: 'bg-brand-primary text-bg-app border-b-[4px] border-brand-primary hover:border-brand-hover hover:bg-brand-hover',
      secondary: 'bg-bg-surface hover:bg-bg-surface-elevated border-2 border-border-subtle hover:border-brand-primary/50 text-white shadow-inner',
      ghost: 'bg-transparent text-text-secondary hover:text-white hover:bg-bg-surface-elevated/50',
      destructive: 'bg-semantic-error/10 border border-semantic-error/30 text-semantic-error hover:bg-semantic-error/30 hover:border-semantic-error hover:text-red-300'
    };

    // Disabled and Loading states
    const disabledClasses = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : '';
    const widthClasses = fullWidth ? 'w-full' : '';

    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${disabledClasses} ${widthClasses} ${className}`;

    // Motion settings
    const motionProps = {
      whileHover: (!shouldReduceMotion && !disabled && !isLoading) ? { y: -2, scale: 1.02 } : {},
      whileTap: (!disabled && !isLoading) ? { scale: 0.98 } : {}
    };

    // Glow effect for primary variant (only if motion is not reduced)
    const primaryGlow = (variant === 'primary' && !shouldReduceMotion && !disabled && !isLoading) 
      ? 'shadow-[0_5px_15px_rgba(250,204,21,0.2)] hover:shadow-[0_8px_20px_rgba(250,204,21,0.3)]' 
      : '';

    return (
      <motion.button
        ref={ref}
        className={`${combinedClasses} ${primaryGlow}`.trim()}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...motionProps}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
