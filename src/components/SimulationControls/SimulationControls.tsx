// src/components/SimulationControls.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSimulationContext } from '@/contexts/SimulationContext';
import { validateTotalSimulations } from '@/contexts/SimulationContext/SimulationContext';
import { ExperimentalTestStatistic } from '@/types/types';
import { Icons } from '../common/Icons';
import { testStatistics } from '../../lib/testStatistics';

const StatDisplay = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-light-background-secondary dark:bg-dark-background-tertiary p-3 rounded-lg">
    <h4 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-1">{title}</h4>
    <p className="text-m font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
  </div>
);

export const SimulationControls: React.FC = () => {
  const {
    totalSimulations,
    setTotalSimulations,
    simulationSpeed,
    setSimulationSpeed,
    selectedTestStatistic,
    setSelectedTestStatistic,
    pValueType,
    setPValueType,
    isSimulating,
    simulationActions,
    simulationResults,
    observedStatistic,
    pValue
  } = useSimulationContext();

  const [inputTotalSimulations, setInputTotalSimulations] = useState(totalSimulations.toString());

  useEffect(() => {
    setInputTotalSimulations(totalSimulations.toString());
  }, [totalSimulations]);

  const isValidTotalSimulations = (value: string) => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && validateTotalSimulations(num);
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
    <div className="p-4 bg-light-background-secondary dark:bg-dark-background-secondary rounded-lg">
      <div className="space-y-4">
        {/* First row: Number of simulations and speed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="numTrials" className="font-semibold whitespace-nowrap">Number of trials:</label>
            <input
              id="numTrials"
              type="number"
              value={inputTotalSimulations}
              onChange={handleTotalSimulationsChange}
              onBlur={handleTotalSimulationsBlur}
              className={`flex-grow border w-full rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary ${
                !isValidTotalSimulations(inputTotalSimulations) ? 'border-red-500' : ''
              }`}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="simulationSpeed" className="font-semibold whitespace-nowrap">Speed:</label>
            <input
              id="simulationSpeed"
              type="range"
              min="1"
              max="100"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
              className="flex-grow h-2 bg-light-background-tertiary dark:bg-dark-background-tertiary rounded-lg appearance-none cursor-pointer"
              title={`${simulationSpeed}%`}
            />
          </div>
        </div>

        {/* Second row: Test statistic and p-value type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="testStatistic" className="font-semibold whitespace-nowrap">Test Statistic:</label>
            <select
              id="testStatistic"
              value={selectedTestStatistic}
              onChange={(e) => setSelectedTestStatistic(e.target.value as ExperimentalTestStatistic)}
              className="flex-grow border w-full rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
            >
              {Object.entries(testStatistics).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="pValueType" className="font-semibold whitespace-nowrap">P-value Type:</label>
            <select
              id="pValueType"
              value={pValueType}
              onChange={(e) => setPValueType(e.target.value as 'two-tailed' | 'left-tailed' | 'right-tailed')}
              className="flex-grow border rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
            >
              <option value="two-tailed">Two-tailed</option>
              <option value="left-tailed">Left-tailed</option>
              <option value="right-tailed">Right-tailed</option>
            </select>
          </div>
        </div>
        
        {/* Third row: Play/Pause and Clear buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={isSimulating ? simulationActions.pauseSimulation : simulationActions.proceedSimulation}
            className="flex-1 h-10 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background px-4 rounded hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-light dark:focus:ring-dark-primary-dark focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            {icon}
            <span>{text}</span>
          </button>
          <button
            onClick={simulationActions.clearSimulationData}
            className="flex-1 h-10 bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-primary dark:text-dark-text-primary px-4 rounded hover:bg-light-background-secondary dark:hover:bg-dark-background-secondary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <Icons.Clear size={20} />
            <span>Clear</span>
          </button>
        </div>
      </div>
      
      {/* Fourth row: All stat displays */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        <StatDisplay 
          title="Observed Statistic" 
          value={observedStatistic !== null ? observedStatistic.toFixed(4) : 'N/A'} 
        />
        <StatDisplay 
          title="P-value" 
          value={pValue !== null ? pValue.toFixed(4) : 'N/A'} 
        />
        <StatDisplay 
          title="Current Progress" 
          value={`${simulationResults ? simulationResults.length : 0} / ${totalSimulations}`} 
        />
      </div>
    </div>
  );
};

export default SimulationControls;