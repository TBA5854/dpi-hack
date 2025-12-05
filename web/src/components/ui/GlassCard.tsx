import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassCard = ({ children, className, ...props }: GlassCardProps) => {
  return (
    <div 
      className={cn(
        "glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-lg", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};
