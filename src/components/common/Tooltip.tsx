// src/components/Tooltip.tsx
import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-primary dark:text-dark-text-primary text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out whitespace-nowrap">
        {content}
      </span>
    </div>
  );
}