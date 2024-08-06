import React, { useRef } from 'react';
import { Tooltip } from '../common/Tooltip';
import { Icons } from '../common/Icons';
import { 
  useSimulationState,
  useSimulationData,
  useSimulationHistory
} from '@/contexts/SimulationContext';
import ApplyEffectButton from './ApplyEffectButton';

const DataControls: React.FC = () => {
  const { userData, isSimulating } = useSimulationState();
  const { setUserData, clearUserData } = useSimulationData();
  const { undo, redo } = useSimulationHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isSimulating) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const lines = text.split('\n').filter(line => line.trim() !== '');
          
          const rows = lines.map(line => {
            const values = line.split(',').map(value => value.trim());
            const assignment = parseInt(values.pop() || '0', 10);
            const data = values.map(value => value === '' ? null : Number(value));
            
            return { data, assignment };
          });

          const dataColumnCount = Math.max(...rows.map(row => row.data.length));
          
          setUserData({
            rows: [...rows, { data: Array(dataColumnCount).fill(null), assignment: 0 }],
            controlColumnIndex: 0,
            columnNames: userData.columnNames
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="relative flex justify-end items-center space-x-1">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
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
      
      <ApplyEffectButton />
  
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

      <Tooltip content="Clear all data">
        <button
          onClick={clearUserData}
          className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200"
        >
          <Icons.Clear size={4} />
        </button>
      </Tooltip>
    </div>
  );
};

export default DataControls;