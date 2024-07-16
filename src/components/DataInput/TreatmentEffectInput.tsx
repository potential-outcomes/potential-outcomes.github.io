import React, { useState } from 'react';
import { Tooltip } from '../common/Tooltip';
import { Icons } from '../common/Icons';

interface TreatmentEffectInputProps {
    onApply: (effect: number) => void;
  }
  
export function TreatmentEffectInput({ onApply }: TreatmentEffectInputProps) {
  const [effect, setEffect] = useState<number>(0);

  const handleApply = () => {
    if (!isNaN(effect)) {
      onApply(effect);
    } else {
      alert("Please enter a valid number for the treatment effect.");
    }
  };

  return (
    <div className="mt-1  rounded-b-lg flex items-center justify-center space-x-4 bg-light-background-secondary dark:bg-dark-background-secondary py-4 px-3">
      <span className="font-small text-light-text-primary dark:text-dark-text-primary">Treatment Effect Under Null:</span>
      <input
        type="number"
        value={effect}
        onChange={(e) => setEffect(Number(e.target.value))}
        className="w-16 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
      />
      <Tooltip content="Set unobserved cells to reflect the null hypothesis effect.">
        <button
          onClick={handleApply}
          className="flex items-center h-10 space-x-2 px-3 py-2 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background rounded-md hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-dark dark:focus:ring-dark-primary-light transition-colors duration-200"
        >
          <Icons.MagicWand />
          <span>Apply Effect</span>
        </button>
      </Tooltip>
    </div>
  );
}