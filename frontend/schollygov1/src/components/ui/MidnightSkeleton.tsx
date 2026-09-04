import React from 'react';

interface MidnightSkeletonProps {
  className?: string;
}

export const MidnightSkeleton: React.FC<MidnightSkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`bg-bg-surface-elevated animate-pulse rounded-lg border border-border-subtle ${className}`}
      aria-hidden="true"
    />
  );
};
