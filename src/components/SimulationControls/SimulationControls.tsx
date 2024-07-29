import React, { useState, useEffect, useRef } from 'react';
import { 
    useSimulationSettings,
    useSimulationData,
    useSimulationControl, 
    useSimulationState,
    testStatistics,
    ExperimentalTestStatistic
} from '@/contexts/SimulationContext';
import { ActionButton } from './ActionButton';
import { TreatmentEffectInput } from './TreatmentEffectInput';
import { Icons } from '../common/Icons';

export const SimulationControls: React.FC = () => {
  const {
    userData,
    setUserData
  } = useSimulationData();

    const {
        totalSimulations,
        simulationSpeed,
        selectedTestStatistic,
        pValueType,
        isSimulating,
        simulationResults
    } = useSimulationState();
      
    const {
        setTotalSimulations,
        setSimulationSpeed,
        setSelectedTestStatistic,
        setPValueType
    } = useSimulationSettings();
      
    const {
        startSimulation,
        pauseSimulation,
        clearSimulationData
    } = useSimulationControl();

    const [inputTotalSimulations, setInputTotalSimulations] = useState(totalSimulations.toString());
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInputTotalSimulations(totalSimulations.toString());
    }, [totalSimulations]);

    const isValidTotalSimulations = (value: string) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0;
    };

    const handleTotalSimulationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputTotalSimulations(e.target.value);
    };

    const handleTotalSimulationsBlur = () => {
        if (isValidTotalSimulations(inputTotalSimulations)) {
            setTotalSimulations(parseInt(inputTotalSimulations));
        } else {
            setInputTotalSimulations(totalSimulations.toString());
        }
    };

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
              
              return {
                data,
                assignment
              };
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

    const getSimulationButtonProps = (isSimulating: boolean, simulationResults: { length: number } | null, totalSimulations: number) => {
        if (isSimulating) {
            return { icon: <Icons.Pause size={20} />, text: 'Pause' };
        } else if (!simulationResults || simulationResults.length === 0) {
            return { icon: <Icons.Play size={20} />, text: 'Play' };
        } else if (simulationResults.length < totalSimulations) {
            return { icon: <Icons.Continue size={20} />, text: 'Continue' };
        } else {
            return { icon: <Icons.RewindPlay size={20} />, text: 'Restart' };
        }
    };

    const { icon, text } = getSimulationButtonProps(isSimulating, simulationResults, totalSimulations);

    return (
        <div className="flex flex-col space-y-4">
            <div className="space-y-2">
                <label htmlFor="numTrials" className="font-semibold block">Number of trials:</label>
                <input
                    id="numTrials"
                    type="number"
                    value={inputTotalSimulations}
                    onChange={handleTotalSimulationsChange}
                    onBlur={handleTotalSimulationsBlur}
                    className={`w-full border rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary ${
                        !isValidTotalSimulations(inputTotalSimulations) ? 'border-red-500' : ''
                    }`}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="simulationSpeed" className="font-semibold block">Speed:</label>
                <input
                    id="simulationSpeed"
                    type="range"
                    min="1"
                    max="100"
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                    className="w-full h-2 bg-light-background-tertiary dark:bg-dark-background-tertiary rounded-lg appearance-none cursor-pointer"
                    title={`${simulationSpeed}%`}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="testStatistic" className="font-semibold block">Test Statistic:</label>
                <select
                    id="testStatistic"
                    value={selectedTestStatistic}
                    onChange={(e) => setSelectedTestStatistic(e.target.value as ExperimentalTestStatistic)}
                    className="w-full border rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                >
                    {Object.entries(testStatistics).map(([key, { name }]) => (
                        <option key={key} value={key}>{name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label htmlFor="pValueType" className="font-semibold block">P-value Type:</label>
                <select
                    id="pValueType"
                    value={pValueType}
                    onChange={(e) => setPValueType(e.target.value as 'two-tailed' | 'left-tailed' | 'right-tailed')}
                    className="w-full border rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                >
                    <option value="two-tailed">Two-tailed</option>
                    <option value="left-tailed">Left-tailed</option>
                    <option value="right-tailed">Right-tailed</option>
                </select>
            </div>

            <div className="flex flex-col space-y-2">
                <button
                    onClick={isSimulating ? pauseSimulation : startSimulation}
                    className="w-full h-10 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background px-4 rounded hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-light dark:focus:ring-dark-primary-dark focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                    {icon}
                    <span>{text}</span>
                </button>
                <button
                    onClick={clearSimulationData}
                    className="w-full h-10 bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-primary dark:text-dark-text-primary px-4 rounded hover:bg-light-background-secondary dark:hover:bg-dark-background-secondary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                    <Icons.Clear size={20} />
                    <span>Clear</span>
                </button>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <ActionButton
              onClick={() => fileInputRef.current?.click()}
              icon={<Icons.Upload />}
              label="Load from .csv"
              primary
            />

            <TreatmentEffectInput />
        </div>
    );
};

export default SimulationControls;