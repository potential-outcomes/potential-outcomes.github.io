import React, { useState } from 'react';
import { Tooltip } from '../common/Tooltip';
import { Icons } from '../common/Icons';

import { 
  useSimulationState,
  UserDataState,
  useSimulationData
} from '@/contexts/SimulationContext';

export function TreatmentEffectInput() {
  const {
    userData,
    isSimulating
  } = useSimulationState();

  const {
    setUserData
  } = useSimulationData();
  const [effect, setEffect] = useState<number>(0);

  const applyTreatmentEffect = (effect: number) => {
    if (isSimulating) return;
  
    const newData: UserDataState = {
      ...userData,
      rows: userData.rows.map((row, rowIndex) => {
        if (rowIndex === userData.rows.length - 1) return row;
  
        const newData = [...row.data];
        
        const referenceIndex = row.assignment;
        const otherIndex = 1 - referenceIndex;
  
        if (newData[referenceIndex] !== null) {
          const referenceValue = newData[referenceIndex] as number;
          newData[otherIndex] = referenceValue + (referenceIndex === 0 ? effect : -effect);
        } else if (newData[otherIndex] !== null) {
          const otherValue = newData[otherIndex] as number;
          newData[referenceIndex] = otherValue + (referenceIndex === 0 ? -effect : effect);
        }
  
        return {
          ...row,
          data: newData
        };
      })
    };
  
    setUserData(newData);
  };

  return (
    <div className="rounded-lg flex items-center justify-center space-x-2 bg-light-background-secondary dark:bg-dark-background-secondary py-4 px-2">
      <span className="font-small text-light-text-primary dark:text-dark-text-primary">Constant Treatment Effect:</span>
      <input
        type="number"
        value={effect}
        onChange={(e) => setEffect(Number(e.target.value))}
        className="w-16 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
      />
      <Tooltip content="Set unobserved cells to reflect the null hypothesis effect.">
        <button
          onClick={() => applyTreatmentEffect(effect)}
          className="flex items-center h-10 space-x-2 px-3 py-2 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background rounded-md hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-dark dark:focus:ring-dark-primary-light transition-colors duration-200"
        >
          <span>Apply</span>
        </button>
      </Tooltip>
    </div>
  );
}