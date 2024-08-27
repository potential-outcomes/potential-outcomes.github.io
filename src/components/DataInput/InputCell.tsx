import React, { useState, useEffect } from 'react';

interface InputCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  delayedPlaceholder: string;
  disabled?: boolean;
}

const InputCell: React.FC<InputCellProps> = ({ value, onChange, delayedPlaceholder, disabled = false }) => {
  const [placeholder, setPlaceholder] = useState("?");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlaceholder(delayedPlaceholder);
    }, 400);

    return () => clearTimeout(timer);
  }, [delayedPlaceholder]);

  return (
    <div className={`relative w-full h-full z-0 ${disabled ? 'pointer-events-none' : ''}`}>
      <input
        type="number"
        value={value === null ? '' : value}
        onChange={(e) => {
          if (!disabled) {
            const newValue = e.target.value ? Number(e.target.value) : null;
            onChange(newValue);
          }
        }}
        onWheel={(e) => (e.target as HTMLElement).blur()}
        className={`
          w-full h-full px-6 py-1 text-center relative z-0
          bg-light-background-secondary dark:bg-[rgb(40,50,65)]
          focus:outline-none focus:ring-0
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'pointer-events-auto'}
        `}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export default InputCell;