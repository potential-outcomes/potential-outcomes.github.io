import React, { useState } from 'react';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: Position;
  delay?: number;
  className?: string;
  arrowClassName?: string;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
  arrowClassName = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (content === '') {
    return <>{children}</>;
  }

  const showTooltip = () => {
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default: // top
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-light-background-tertiary dark:border-b-dark-background-tertiary border-r-transparent border-l-transparent border-t-transparent';
      case 'left':
        return 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-l-light-background-tertiary dark:border-l-dark-background-tertiary border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-r-light-background-tertiary dark:border-r-dark-background-tertiary border-t-transparent border-b-transparent border-l-transparent';
      default: // top
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-light-background-tertiary dark:border-t-dark-background-tertiary border-r-transparent border-l-transparent border-b-transparent';
    }
  };

  return (
    <div
      className={`relative inline ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-10 px-3 py-2 text-sm rounded-md bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-primary dark:text-dark-text-primary whitespace-nowrap ${getPositionClasses()}`}
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 ${getArrowClasses()} ${arrowClassName}`}
          />
        </div>
      )}
    </div>
  );
}