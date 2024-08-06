import React, { useState, useRef, useEffect } from 'react';
import { Tooltip } from '../common/Tooltip';
import { Icons } from '../common/Icons';
import { Switch } from '../common/Switch';
import { useSimulationState, useSimulationData } from '@/contexts/SimulationContext';

const ApplyEffectButton: React.FC = () => {
  const { userData, isSimulating } = useSimulationState();
  const { setUserData } = useSimulationData();
  const [effect, setEffect] = useState<number>(0);
  const [showEffectPopup, setShowEffectPopup] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [noEffectColumn, setNoEffectColumn] = useState<number>(0);
  const [effectColumns, setEffectColumns] = useState<number[]>([1]);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isWandActive, setIsWandActive] = useState(false);
  const prevWandStateRef = useRef(false);

  const checkWandCondition = (rows: typeof userData.rows): boolean => {
    return rows.some((row, index) => {
      if (index === rows.length - 1) return false; // Ignore the last row
      const nonNullCount = row.data.filter(cell => cell !== null).length;
      return nonNullCount === 1 && row.data[row.assignment] !== null;
    });
  };

  useEffect(() => {
    const newWandState = checkWandCondition(userData.rows);
    setIsWandActive(newWandState);

    if (newWandState && !prevWandStateRef.current) {
      // Flash effect
      setIsWandActive(false);
      setTimeout(() => setIsWandActive(true), 100);
    }

    prevWandStateRef.current = newWandState;
  }, [userData.rows]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEffectPopup &&
          popupRef.current &&
          !popupRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)) {
        setShowEffectPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEffectPopup]);

  const applyTreatmentEffect = () => {
    if (isSimulating) return;
  
    const newData = {
      ...userData,
      rows: userData.rows.map((row, rowIndex) => {
        if (rowIndex === userData.rows.length - 1) return row;
  
        const newData = [...row.data];
  
        if (row.assignment === noEffectColumn && newData[noEffectColumn] !== null) {
          const referenceValue = newData[noEffectColumn] as number;
          effectColumns.forEach(effectCol => {
            if (overwriteExisting || newData[effectCol] === null) {
              newData[effectCol] = referenceValue + effect;
            }
          });
        } else if (effectColumns.includes(row.assignment) && newData[row.assignment] !== null) {
          const effectValue = newData[row.assignment] as number;
          if (overwriteExisting || newData[noEffectColumn] === null) {
            newData[noEffectColumn] = effectValue - effect;
          }
        }
  
        return { ...row, data: newData };
      })
    };
  
    setUserData(newData);
    setShowEffectPopup(false);
  };

  const handleEffectColumnToggle = (index: number) => {
    setEffectColumns(prev => {
      if (prev.includes(index)) {
        // Prevent unchecking if it's the last effect column
        if (prev.length === 1) return prev;
        return prev.filter(col => col !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleNoEffectColumnChange = (newNoEffectColumn: number) => {
    setNoEffectColumn(newNoEffectColumn);
    // If the new no-effect column was previously an effect column, remove it
    setEffectColumns(prev => {
      const updated = prev.filter(col => col !== newNoEffectColumn);
      // If removing the column leaves no effect columns, add the first available column
      if (updated.length === 0) {
        const firstAvailable = userData.columnNames.findIndex((_, index) => index !== newNoEffectColumn);
        return [firstAvailable];
      }
      return updated;
    });
  };

  const wandColorClass = isWandActive ? 'text-yellow-400' : 'text-light-text-secondary dark:text-dark-text-secondary';
  const wandHoverClass = isWandActive ? 'hover:text-yellow-500' : 'hover:text-light-primary dark:hover:text-dark-primary';

  return (
    <>
      <Tooltip content="Apply constant effect to unobserved">
        <button
          ref={buttonRef}
          onClick={() => setShowEffectPopup(!showEffectPopup)}
          className={`p-1 ${wandColorClass} ${wandHoverClass} focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200`}
        >
          <Icons.MagicWand size={18} />
        </button>
      </Tooltip>
  
      {showEffectPopup && (
        <div 
          ref={popupRef}
          className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 w-72 border border-gray-200 dark:border-gray-700"
        >
          <div className="p-3 space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                No effect column
              </label>
              <select
                value={noEffectColumn}
                onChange={(e) => handleNoEffectColumnChange(Number(e.target.value))}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
              >
                {userData.columnNames.map((name, index) => (
                  <option key={index} value={index}>{name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                Effect columns
              </label>
              <div className="flex flex-wrap gap-2">
                {userData.columnNames.map((name, index) => (
                  index !== noEffectColumn && (
                    <label key={index} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={effectColumns.includes(index)}
                        onChange={() => handleEffectColumnToggle(index)}
                        className="form-checkbox h-3 w-3 text-light-primary dark:text-dark-primary rounded focus:ring-light-primary dark:focus:ring-dark-primary"
                      />
                      <span className="text-xs text-light-text-primary dark:text-dark-text-primary">{name}</span>
                    </label>
                  )
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">
                Effect Size:
              </label>
              <input
                type="number"
                value={effect}
                onChange={(e) => setEffect(Number(e.target.value))}
                className="flex-grow px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
                placeholder="Enter size"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-light-text-primary dark:text-dark-text-primary">
                Overwrite existing entries
              </span>
              <Switch
                checked={overwriteExisting}
                onChange={setOverwriteExisting}
              />
            </div>
            <div className="pt-2">
              <button
                onClick={applyTreatmentEffect}
                className="w-full px-3 py-1.5 bg-light-primary dark:bg-dark-primary text-white text-sm rounded-md hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-dark dark:focus:ring-dark-primary-light transition-colors duration-200"
              >
                Apply Effect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApplyEffectButton;