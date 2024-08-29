import React, { useRef } from 'react';
import { Tooltip } from '../common/Tooltip';
import { Icons } from '../common/Icons';
import {
  useSimulationData,
  useSimulationHistory
} from '@/contexts/SimulationContext';
import ApplyEffectButton from './ApplyEffectButton';

interface DataControlsProps {
  toggleBlocking: () => void;
  isBlockingEnabled: boolean;
  disabled?: boolean;
}

const DataControls: React.FC<DataControlsProps> = ({ toggleBlocking, isBlockingEnabled, disabled = false }) => {
  const { resetUserData, emptyUserData } = useSimulationData();
  const { undo, redo } = useSimulationHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buttonClass = (isActive: boolean = false) => `
    p-1 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200
    ${isActive
      ? 'text-light-primary dark:text-dark-primary'
      : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <div className="flex justify-between items-center w-full m-1">
      <div className="flex items-center space-x-2">
        <ApplyEffectButton disabled={disabled} />
        <Tooltip content={isBlockingEnabled ? "Disable blocking" : "Enable blocking"}>
          <button
            onClick={disabled ? undefined : toggleBlocking}
            className={buttonClass(isBlockingEnabled)}
            disabled={disabled}
          >
            <Icons.Blocking size={4} />
          </button>
        </Tooltip>
      </div>
      <div className="flex justify-end items-center space-x-1">
        <input
          type="file"
          accept=".csv"
          // onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
          disabled={disabled}
        />
        <Tooltip content="Load data from CSV file">
          <button
            onClick={disabled ? undefined : () => fileInputRef.current?.click()}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Upload size={4} />
          </button>
        </Tooltip>

        <Tooltip content="Undo (Cmd+Z / Ctrl+Z)">
          <button
            onClick={disabled ? undefined : undo}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Undo size={4} />
          </button>
        </Tooltip>
        <Tooltip content="Redo (Cmd+Shift+Z / Ctrl+Y)">
          <button
            onClick={disabled ? undefined : redo}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Redo size={4} />
          </button>
        </Tooltip>

        <Tooltip content="Empty rows">
          <button
            onClick={disabled ? undefined : emptyUserData}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Clear size={4} />
          </button>
        </Tooltip>

        <Tooltip content="Reset data input">
          <button
            onClick={disabled ? undefined : resetUserData}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Reset size={4} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default DataControls;