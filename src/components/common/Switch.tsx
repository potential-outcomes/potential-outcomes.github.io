import React, { memo } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Switch: React.FC<SwitchProps> = memo(({
  checked,
  onChange,
  disabled = false,
  className = '',
  ariaLabel = 'Toggle switch',
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  const baseClasses = 'relative inline-flex items-center w-10 h-5 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-light-primary dark:focus:ring-dark-primary';
  const cursorClasses = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';
  const backgroundClasses = checked
    ? 'bg-light-primary dark:bg-dark-primary'
    : 'bg-gray-300 dark:bg-gray-600';

  return (
    <div
      className={`${baseClasses} ${cursorClasses} ${backgroundClasses} ${className}`}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
    >
      <span
        className={`${
          checked ? 'translate-x-5' : 'translate-x-0'
        } inline-block w-5 h-5 transform transition-transform duration-300 ease-in-out rounded-full bg-white shadow-md hover:shadow-lg`}
      />
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => !disabled && onChange(!checked)}
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch;