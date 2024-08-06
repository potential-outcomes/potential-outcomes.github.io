import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div
      className={`relative inline-block w-8 h-4 transition-colors duration-200 ease-in-out rounded-full focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-light-primary dark:focus-within:ring-dark-primary ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
    >
      <div
        className={`absolute left-0 top-0 w-full h-full rounded-full transition-colors duration-200 ease-in-out ${
          checked
            ? 'bg-light-primary dark:bg-dark-primary'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />
      <div
        className={`absolute left-0 top-0 w-4 h-4 transform transition-transform duration-200 ease-in-out rounded-full bg-white shadow-md ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => !disabled && onChange(!checked)}
        disabled={disabled}
      />
    </div>
  );
};

export default Switch;