import React from 'react';

interface AvatarContainerProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isEditing?: boolean;
}

export const AvatarContainer: React.FC<AvatarContainerProps> = ({ src, alt = 'Avatar', size = 'md', className = '', isEditing = false }) => {
  const sizes = {
    sm: 'w-10 h-10 rounded-lg',
    md: 'w-16 h-16 rounded-[1.25rem]',
    lg: 'w-20 h-20 rounded-[1.25rem]',
    xl: 'w-24 h-24 md:w-28 md:h-28 rounded-[1.25rem]'
  };

  const interactiveClasses = isEditing 
    ? 'cursor-pointer hover:scale-110 hover:-rotate-6 transition-all duration-300' 
    : '';

  return (
    <div className={`${sizes[size]} shrink-0 bg-bg-surface-elevated/80 flex items-center justify-center border-2 border-brand-primary/50 shadow-inner overflow-hidden backdrop-blur-sm ${interactiveClasses} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-text-muted">?</div>
      )}
    </div>
  );
};
