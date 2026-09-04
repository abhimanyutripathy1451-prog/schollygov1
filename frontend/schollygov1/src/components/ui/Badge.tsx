import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'rank' | 'milestone' | 'active' | 'error' | 'info' | 'default';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', icon, className = '', children, ...props }) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider shrink-0';
  
  const variants = {
    rank: 'bg-semantic-rank/10 text-semantic-rank border border-semantic-rank/30 rounded-full',
    milestone: 'bg-gradient-to-br from-brand-primary to-orange-400 text-bg-app border border-brand-primary shadow-[0_0_10px_rgba(250,204,21,0.4)] rounded-xl',
    active: 'bg-semantic-success/10 text-semantic-success border border-semantic-success/30 rounded-full',
    error: 'bg-semantic-error/10 text-semantic-error border border-semantic-error/30 rounded-full',
    info: 'bg-semantic-info/10 text-semantic-info border border-semantic-info/30 rounded-full',
    default: 'bg-bg-surface-elevated text-text-secondary border border-border-subtle rounded-full'
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
