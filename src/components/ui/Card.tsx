import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  level?: 1 | 2;
  onClick?: () => void;
}

export const Card = ({ children, className = '', level = 1, onClick }: CardProps) => {
  // Use explicit tailwind classes for background to ensure they override the base vext-card styles
  const bgClass = level === 1 ? 'bg-surface-lvl1' : 'bg-surface-lvl2';
  const borderClass = 'border border-surface-overlay';
  const hoverClass = onClick ? 'cursor-pointer hover:border-neon-cyan/30 transition-all' : '';
  
  return (
    <div 
      className={`p-6 rounded-md transition-all ${bgClass} ${borderClass} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
