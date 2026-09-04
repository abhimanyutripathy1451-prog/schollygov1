import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gamified' | 'interactive' | 'locked';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const base = 'rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col relative overflow-hidden transition-all duration-500';
    
    let variantClasses = '';
    let overlays = null;

    switch (variant) {
      case 'default':
        variantClasses = 'bg-bg-surface border border-white/[0.05] shadow-premium';
        break;
        
      case 'gamified':
        variantClasses = 'bg-bg-surface border border-brand-primary/25 shadow-[0_0_25px_rgba(250,204,21,0.08)] group';
        overlays = (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-orange-500/10 to-brand-primary/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
        );
        break;
        
      case 'interactive':
        variantClasses = 'bg-bg-app border border-white/[0.05] hover:border-brand-primary hover:bg-bg-surface-elevated/30 shadow-inner hover:shadow-[0_5px_15px_rgba(250,204,21,0.15)] cursor-pointer group active:scale-[0.98]';
        break;
        
      case 'locked':
        variantClasses = 'bg-bg-secondary border border-border-subtle/30 opacity-60 select-none cursor-not-allowed pointer-events-none filter grayscale-[50%]';
        break;
    }

    return (
      <div ref={ref} className={`${base} ${variantClasses} ${className}`} {...props}>
        {overlays}
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
