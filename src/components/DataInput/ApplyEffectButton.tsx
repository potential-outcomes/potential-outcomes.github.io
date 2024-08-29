import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tooltip } from '../common/Tooltip';
import { Icons } from '../common/Icons';
import { Switch } from '../common/Switch';
import { useSimulationState, useSimulationData } from '@/contexts/SimulationContext';

interface ApplyEffectButtonProps {
  disabled?: boolean;
}

const ApplyEffectButton: React.FC<ApplyEffectButtonProps> = ({ disabled = false }) => {
  const { userData, isSimulating } = useSimulationState();
  const { setUserData } = useSimulationData();
  const [showEffectPopup, setShowEffectPopup] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [baselineColumn, setBaselineColumn] = useState<number>(0);
  const [effectSizes, setEffectSizes] = useState<{ [key: number]: string }>({});
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isWandActive, setIsWandActive] = useState(false);

  useEffect(() => {
    const initialEffectSizes: { [key: number]: string } = {};
    userData.columns.forEach((_, index) => {
      if (index !== baselineColumn) {
        initialEffectSizes[index] = '0';
      }
    });
    setEffectSizes(initialEffectSizes);
  }, [userData.columns, baselineColumn]);

  useEffect(() => {
    const newWandState = userData.rows.some(row => {
      if (row.assignment === null) return false;
      const nonNullCount = row.data.filter(cell => cell !== null).length;
      return nonNullCount === 1;
    });
    setIsWandActive(newWandState);
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

  const handleEffectSizeChange = (column: number, value: string) => {
    setEffectSizes(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const isEffectSizesValid = useMemo(() => {
    return Object.values(effectSizes).every(value => {
      if (value === '' || value === '-') return false;
      const numValue = parseFloat(value);
      return !isNaN(numValue);
    });
  }, [effectSizes]);

  const applyTreatmentEffect = () => {
    if (isSimulating || !isEffectSizesValid) return;

    const newData = {
      ...userData,
      rows: userData.rows.map(row => {
        if (row.assignment === null) return row;

        const knownColumnIndex = row.data.findIndex(value => value !== null);
        if (knownColumnIndex === -1) return row;

        const newData = [...row.data];
        const knownValue = newData[knownColumnIndex] as number;
        const baselineValue = knownValue - parseFloat(effectSizes[knownColumnIndex] || '0');

        return {
          ...row,
          data: newData.map((value, index) => {
            if (index === knownColumnIndex) return knownValue;
            if (overwriteExisting || value === null) {
              return baselineValue + parseFloat(effectSizes[index] || '0');
            }
            return value;
          })
        };
      })
    };

    setUserData(newData);
    setShowEffectPopup(false);
  };

  const handleBaselineColumnChange = (newBaselineColumn: number) => {
    setBaselineColumn(newBaselineColumn);
    setEffectSizes(sizes => {
      const newSizes = { ...sizes };
      delete newSizes[newBaselineColumn];
      if (!(newBaselineColumn in newSizes)) {
        newSizes[baselineColumn] = '0';
      }
      return newSizes;
    });
  };

  const wandColorClass = isWandActive ? 'text-yellow-700' : 'text-light-text-secondary dark:text-dark-text-secondary';
  const wandHoverClass = isWandActive ? 'hover:text-yellow-700' : 'hover:text-light-primary dark:hover:text-dark-primary';

  return (
    <div className="relative inline mx-0">
      <Tooltip content={!isWandActive ? `Fill empty cells based on constant effect` : ''}>
        <button 
          className={`inline-flex items-center transition-all duration-200 ease-in-out rounded-md ${
            isWandActive ? 'bg-yellow-200/90 hover:opacity-90' : ''
          }`}
          onClick={() => {
            if (!disabled) {
              setShowEffectPopup(prev => !prev);
            }
          }}
          ref={buttonRef}
          style={{ width: isWandActive ? 'auto' : '32px' }}
        >
          <div
            className={`p-1 ${wandColorClass} ${wandHoverClass} ${isWandActive ? '' : 'focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary'} rounded transition-colors duration-200 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={disabled}
          >
            <Icons.MagicWand size={4} />
          </div>

          {isWandActive && (
            <div
              className="whitespace-nowrap text-xs px-2 text-yellow-800 transition-colors duration-200 focus:outline-none"
            >
              Fill based on constant effect
            </div>
          )}
        </button>
      </Tooltip>

      {showEffectPopup && (
        <div 
          ref={popupRef}
          className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 w-96 border border-gray-200 dark:border-gray-700"
        >
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                Baseline Column
              </label>
              <select
                value={baselineColumn}
                onChange={(e) => handleBaselineColumnChange(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-base border rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
              >
                {userData.columns.map((column, index) => (
                  <option key={index} value={index}>{column.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                Effect columns
              </label>
              <ul className="space-y-2">
                {userData.columns.map((column, index) => (
                  index !== baselineColumn && (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="text-base text-light-text-primary dark:text-dark-text-primary w-1/2 truncate">{column.name}</span>
                      <input
                        type="text"
                        value={effectSizes[index] || ''}
                        onChange={(e) => handleEffectSizeChange(index, e.target.value)}
                        className="w-1/2 px-2 py-1.5 text-base border rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
                        placeholder="Effect size"
                      />
                    </li>
                  )
                ))}
              </ul>
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
              <Tooltip content={isEffectSizesValid ? '' : 'Please enter valid effect sizes for all columns'}>
                <button
                  onClick={applyTreatmentEffect}
                  disabled={disabled || !isEffectSizesValid}
                  className={`!w-full px-3 py-2 text-white text-base rounded-md focus:outline-none focus:ring-2 transition-colors duration-200 ${
                    disabled || !isEffectSizesValid
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-light-primary dark:bg-dark-primary hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:ring-light-primary-dark dark:focus:ring-dark-primary-light'
                  }`}
                >
                  Apply Effect
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyEffectButton;