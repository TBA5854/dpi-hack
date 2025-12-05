import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = ({ children, className, variant = 'primary', ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
    secondary: "bg-white/50 text-blue-900 hover:bg-white/80 border border-white/60",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100/50",
  };

  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2", 
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};
