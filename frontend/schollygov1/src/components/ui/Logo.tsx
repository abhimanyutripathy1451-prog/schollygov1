import React from 'react';
import logoUrl from '../../assets/logo.svg';

export const Logo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <img src={logoUrl} alt="SchoollyGo Logo" className={className} />
  );
};
