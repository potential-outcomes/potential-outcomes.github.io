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
}

const DataControls: React.FC<DataControlsProps> = ({ toggleBlocking, isBlockingEnabled }) => {
  const { resetUserData, emptyUserData } = useSimulationData();
  const { undo, redo } = useSimulationHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center space-x-2">
        <ApplyEffectButton />
        <Tooltip content={isBlockingEnabled ? "Disable blocking" : "Enable blocking"}>
          <button
            onClick={toggleBlocking}
            className={`p-1 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200 ${
              isBlockingEnabled
                ? 'text-light-primary dark:text-dark-primary'
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary'
            }`}
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
        />
        <Tooltip content="Load data from CSV file">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200"
          >
            <Icons.Upload size={4} />
          </button>
        </Tooltip>
        
        <Tooltip content="Undo (Cmd+Z / Ctrl+Z)">
          <button
            onClick={undo}
            className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200"
          >
            <Icons.Undo size={4} />
          </button>
        </Tooltip>
        <Tooltip content="Redo (Cmd+Shift+Z / Ctrl+Y)">
          <button
            onClick={redo}
            className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200"
          >
            <Icons.Redo size={4} />
          </button>
        </Tooltip>

        <Tooltip content="Empty rows">
          <button
            onClick={emptyUserData}
            className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200"
          >
            <Icons.Clear size={4} />
          </button>
        </Tooltip>

        <Tooltip content="Reset data input">
          <button
            onClick={resetUserData}
            className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200"
          >
            <Icons.Reset size={4} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default DataControls;