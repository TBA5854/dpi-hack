import { cn } from '@/lib/utils';
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input 
      className={cn(
        "w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/80 transition-all placeholder:text-gray-400", 
        className
      )} 
      {...props}
    />
  );
};
