// src/components/SimulationDisplay.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import dynamic from 'next/dynamic';
import { useTheme } from './ThemeProvider';

import { PlotParams } from 'react-plotly.js';
import { Data, Layout } from 'plotly.js';
const Plot = dynamic<PlotParams>(() => import('react-plotly.js'), { ssr: false });

export default function SimulationDisplay() {
  const { data } = useSimulationContext();
  const { theme } = useTheme();
  const [numTrials, setNumTrials] = useState(1000);
  const [simulationResults, setSimulationResults] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [observedStatistic, setObservedStatistic] = useState<number | null>(null);
  const [currentSimulation, setCurrentSimulation] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(50);
  const [totalNumTrials, setTotalNumTrials] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const simulationResultsRef = useRef<number[]>([]);
  const simulationSpeedRef = useRef(50);

  useEffect(() => {
    setObservedStatistic(calculateDifferenceInMeans(data, true));
  }, [data]);

  useEffect(() => {
    simulationSpeedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  const calculateDifferenceInMeans = useCallback((dataset: typeof data, useOriginalAssignment = false) => {
    let treatedSum = 0, controlSum = 0, treatedCount = 0, controlCount = 0;

    dataset.forEach((row) => {
      if (row.isNewRow) return;
      const assignment = useOriginalAssignment ? row.assignment : Math.random() < 0.5 ? 1 : 0;
      if (assignment === 1) {
        treatedSum += row.treatment ?? 0;
        treatedCount++;
      } else {
        controlSum += row.control ?? 0;
        controlCount++;
      }
    });

    const treatedMean = treatedCount > 0 ? treatedSum / treatedCount : 0;
    const controlMean = controlCount > 0 ? controlSum / controlCount : 0;

    return treatedMean - controlMean;
  }, []);

  const runSimulation = useCallback((keepExisting = false) => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const startingResults = keepExisting ? simulationResultsRef.current : [];
    const targetTrials = startingResults.length + numTrials;
    setTotalNumTrials(targetTrials);
    const updateFrequency = Math.max(1, Math.floor(Math.sqrt(numTrials) / 10));

    const simulate = async () => {
      try {
        let results = [...startingResults];
        let currentTrial = startingResults.length;

        while (currentTrial < targetTrials) {
          if (signal.aborted) break;

          const result = calculateDifferenceInMeans(data, false);
          results.push(result);
          currentTrial++;

          if (currentTrial % updateFrequency === 0 || currentTrial === targetTrials) {
            simulationResultsRef.current = results;
            setSimulationResults(results);
            setCurrentSimulation(currentTrial);
            await new Promise(resolve => setTimeout(resolve, 200 - (simulationSpeedRef.current * 2)));
          }
        }
      } catch (error) {
        console.error("Simulation error:", error);
      } finally {
        setIsSimulating(false);
      }
    };

    simulate();
  }, [data, numTrials, calculateDifferenceInMeans]);

  const stopSimulation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSimulating(false);
  }, []);

  const clearSimulation = useCallback(() => {
    setSimulationResults([]);
    simulationResultsRef.current = [];
    setCurrentSimulation(0);
    setTotalNumTrials(0);
  }, []);

  const handleClearOrStop = useCallback(() => {
    if (isSimulating) {
      stopSimulation();
    } else {
      clearSimulation();
    }
  }, [isSimulating, stopSimulation, clearSimulation]);

  const numBins = 20;
  const minResult = Math.min(...simulationResults, 0) - 1;
  const maxResult = Math.max(...simulationResults, 0) + 1;
  const binSize = (maxResult - minResult) / numBins;

  const binEdges = Array.from({ length: numBins + 1 }, (_, i) => minResult + i * binSize);
  const frequencyMap = binEdges.slice(0, -1).reduce((acc, edge, index) => {
    const nextEdge = binEdges[index + 1];
    acc[edge] = simulationResults.filter(result => result >= edge && result < nextEdge).length;
    return acc;
  }, {} as { [key: number]: number });
  const maxFrequency = Math.max(...Object.values(frequencyMap), 0);

  const plotData: Data[] = [
    {
      x: simulationResults,
      type: 'histogram',
      marker: {
        color: theme === 'light' ? 'rgba(66, 135, 245, 0.6)' : 'rgba(102, 187, 255, 0.6)',
        line: { color: theme === 'light' ? 'rgba(66, 135, 245, 1)' : 'rgba(102, 187, 255, 1)', width: 1 }
      },
      xbins: { start: minResult, end: maxResult, size: binSize },
      name: 'Simulated Differences',
    },
    {
      x: [observedStatistic, observedStatistic],
      y: [0, maxFrequency + 1],
      type: 'scatter',
      mode: 'lines',
      line: { color: theme === 'light' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 102, 102, 0.7)', width: 2 },
      name: 'Observed Difference',
    }
  ];



  const plotLayout: Partial<Layout> = {
    // title: { text: 'Simulation Results', font: { size: 24, color: theme === 'light' ? 'black' : 'white' } },
    xaxis: { 
      title: 'Difference in Means',
      tickmode: 'auto',
      nticks: 10,
      tickfont: { color: theme === 'light' ? 'black' : 'white' },
      titlefont: { color: theme === 'light' ? 'black' : 'white' },
    },
    yaxis: { 
      title: 'Frequency',
      tickmode: 'auto',
      nticks: 10,
      tickfont: { color: theme === 'light' ? 'black' : 'white' },
      titlefont: { color: theme === 'light' ? 'black' : 'white' },
    },
    bargap: 0.05,
    showlegend: true,
    legend: { x: 0.7, y: 1, font: { color: theme === 'light' ? 'black' : 'white' } },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 45, r: 35, b: 35, t:0 },
    autosize: true,
  };

  const pValue = observedStatistic !== null && simulationResults.length > 0
    ? simulationResults.filter(result => Math.abs(result) >= Math.abs(observedStatistic)).length / simulationResults.length
    : null;

    const StatDisplay = ({ title, value }: { title: string; value: string | number }) => (
      <div className="bg-light-background-secondary dark:bg-dark-background-tertiary p-3 rounded-lg">
        <h4 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-1">{title}</h4>
        <p className="text-m font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
      </div>
    );

      return (
        <div className="text-light-text-primary dark:text-dark-text-primary p-0">
          <div className="mb-4" style={{ width: '100%', height: '60vh' }}>
            <Plot
              data={plotData}
              layout={plotLayout}
              config={{ responsive: true }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <div className="p-4 bg-light-background-secondary dark:bg-dark-background-secondary rounded-lg">
            {/* <h3 className="text-xl font-semibold mb-4">Simulation Controls</h3> */}
            <div className="space-y-4">
              {/* Row 1: Number of trials and slider */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-auto flex items-center space-x-2">
                  <label htmlFor="numTrials" className="font-semibold whitespace-nowrap">Number of trials:</label>
                  <input
                    id="numTrials"
                    type="number"
                    value={numTrials}
                    onChange={(e) => setNumTrials(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border rounded px-3 py-2 w-24 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
                  />
                </div>
                <div className="w-full sm:flex-grow flex items-center space-x-2">
                  <label htmlFor="simulationSpeed" className="font-semibold whitespace-nowrap">Speed:</label>
                  <input
                    id="simulationSpeed"
                    type="range"
                    min="1"
                    max="100"
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                    className="w-full h-2 bg-light-background-tertiary dark:bg-dark-background-tertiary rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Row 2: Buttons */}
              <div className="flex flex-wrap justify-left gap-2">
                <button
                  onClick={() => runSimulation(false)}
                  disabled={isSimulating}
                  className="w-[calc(33.33%-0.5rem)] h-10 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background px-4 rounded hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-light dark:focus:ring-dark-primary-dark focus:ring-offset-2 disabled:bg-light-background-tertiary dark:disabled:bg-dark-background-tertiary disabled:text-light-text-tertiary dark:disabled:text-dark-text-tertiary"
                >
                  {isSimulating ? 'Simulating...' : 'Simulate'}
                </button>
                {simulationResults.length > 0 && (
                  <button
                    onClick={() => runSimulation(true)}
                    disabled={isSimulating}
                    className="w-[calc(33.33%-0.5rem)] h-10 bg-light-secondary dark:bg-dark-secondary text-light-background dark:text-dark-background px-4 rounded hover:bg-light-secondary-dark dark:hover:bg-dark-secondary-light focus:outline-none focus:ring-2 focus:ring-light-secondary-light dark:focus:ring-dark-secondary-dark focus:ring-offset-2 disabled:bg-light-background-tertiary dark:disabled:bg-dark-background-tertiary disabled:text-light-text-tertiary dark:disabled:text-dark-text-tertiary"
                  >
                    Keep Simulating
                  </button>
                )}
                <button
                  onClick={handleClearOrStop}
                  className={`w-[calc(33.33%-0.5rem)] h-10 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isSimulating
                      ? 'bg-light-error dark:bg-dark-error text-light-background dark:text-dark-background hover:bg-light-error-dark dark:hover:bg-dark-error-light focus:ring-light-error-light dark:focus:ring-dark-error-dark'
                      : 'bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-primary dark:text-dark-text-primary hover:bg-light-background-secondary dark:hover:bg-dark-background-secondary focus:ring-light-primary dark:focus:ring-dark-primary'
                  }`}
                >
                  {isSimulating ? 'Stop Simulating' : 'Clear'}
                </button>
              </div>
            </div>
            
            {/* Statistics display */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <StatDisplay title="Observed Statistic" value={observedStatistic !== null ? observedStatistic.toFixed(4) : 'N/A'} />
              <StatDisplay title="P-value" value={pValue !== null ? pValue.toFixed(4) : 'N/A'} />
              <StatDisplay title="Total Simulations" value={simulationResults.length} />
              <StatDisplay title="Current Progress" value={isSimulating ? `${currentSimulation} / ${totalNumTrials}` : 'Not running'} />
            </div>
          </div>
        </div>
      );
}