import React, { useState, useEffect, useRef } from 'react';
import { 
    useSimulationSettings,
    useSimulationData,
    useSimulationControl, 
    useSimulationState,
    testStatistics,
    ExperimentalTestStatistic,
    ActionResult
} from '@/contexts/SimulationContext';
import { ActionButton } from './ActionButton';
import { Icons } from '../common/Icons';
import ActionResultFeedback from '@/components/common/ActionResultFeedback';

export const SimulationControls: React.FC = () => {
  const {
    userData
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
  const [simulationActionResult, setSimulationActionResult] = useState<ActionResult | null>(null);
  const [clearActionResult, setClearActionResult] = useState<ActionResult | null>(null);

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
      const result = setTotalSimulations(parseInt(inputTotalSimulations));
      if (!result.success) {
        setInputTotalSimulations(totalSimulations.toString());
      }
    } else {
      setInputTotalSimulations(totalSimulations.toString());
    }
  };

  const getSimulationButtonProps = (isSimulating: boolean, simulationResults: { length: number } | null, totalSimulations: number) => {
    if (isSimulating) {
      return { icon: <Icons.Pause size={5} />, text: 'Pause' };
    } else if (!simulationResults || simulationResults.length === 0) {
      return { icon: <Icons.Play size={5} />, text: 'Play' };
    } else if (simulationResults.length < totalSimulations) {
      return { icon: <Icons.Continue size={5} />, text: 'Continue' };
    } else {
      return { icon: <Icons.RewindPlay size={5} />, text: 'Restart' };
    }
  };

  const { icon, text } = getSimulationButtonProps(isSimulating, simulationResults, totalSimulations);

  // Filter test statistics based on number of columns
  const availableTestStatistics = Object.entries(testStatistics).filter(([_, { supportsMultipleTreatments }]) => {
    return userData.columns.length <= 2 || supportsMultipleTreatments;
  });

  // Update selected test statistic if it's no longer valid
  useEffect(() => {
    if (!availableTestStatistics.some(([key]) => key === selectedTestStatistic)) {
      setSelectedTestStatistic(availableTestStatistics[0][0] as ExperimentalTestStatistic);
    }
  }, [userData.columns.length, selectedTestStatistic, setSelectedTestStatistic]);

  const handleSimulationAction = async () => {
    if (simulationResults && simulationResults.length == totalSimulations) {
        clearSimulationData();
    }
    const result = isSimulating ? pauseSimulation() : startSimulation();
    setSimulationActionResult(result);
  };

  const handleClearSimulation = () => {
    const result = clearSimulationData();
    setClearActionResult(result);
  };

  return (
    <div className="flex flex-col space-y-4">

            <div className="space-y-2">
                <label htmlFor="testStatistic" className="font-semibold block">Test Statistic:</label>
                <select
                    id="testStatistic"
                    value={selectedTestStatistic}
                    onChange={(e) => setSelectedTestStatistic(e.target.value as ExperimentalTestStatistic)}
                    className="w-full border rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                >
                    {availableTestStatistics.map(([key, { name }]) => (
                        <option key={key} value={key}>{name}</option>
                    ))}
                </select>
            </div>

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

            <div className="flex flex-col space-y-2">
                <button
                onClick={handleSimulationAction}
                className="w-full h-10 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background px-4 rounded hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-light dark:focus:ring-dark-primary-dark focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                {icon}
                <span>{text}</span>
                </button>
                <ActionResultFeedback actionResult={simulationActionResult} />
                
                <button
                onClick={handleClearSimulation}
                className="w-full h-10 bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-primary dark:text-dark-text-primary px-4 rounded hover:bg-light-background-secondary dark:hover:bg-dark-background-secondary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                <Icons.Clear size={5} />
                <span>Clear</span>
                </button>
                <ActionResultFeedback actionResult={clearActionResult} />
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
        </div>
    );
};

export default SimulationControls;