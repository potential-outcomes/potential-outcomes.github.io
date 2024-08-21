import React, { useState, useEffect } from 'react';

interface InputCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  delayedPlaceholder: string;
}

const InputCell: React.FC<InputCellProps> = ({ value, onChange, delayedPlaceholder }) => {
  const [placeholder, setPlaceholder] = useState("?");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setPlaceholder(delayedPlaceholder);
      setIsTransitioning(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [delayedPlaceholder]);

  return (
    <div className="relative w-full h-full z-0 pointer-events-none">
      <input
        type="number"
        value={value === null ? '' : value}
        onChange={(e) => {
          const newValue = e.target.value ? Number(e.target.value) : null;
          onChange(newValue);
        }}
        className={`
          w-full h-full px-6 py-1 text-center relative z-0 pointer-events-auto
          bg-light-background-secondary dark:bg-[rgb(40,50,65)]
          focus:outline-none focus:ring-0
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        `}
        placeholder={placeholder}
      />
    </div>
  );
};

export default InputCell;