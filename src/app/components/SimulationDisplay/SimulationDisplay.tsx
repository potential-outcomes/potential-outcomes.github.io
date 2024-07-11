// src/components/SimulationDisplay.tsx
'use client';

import React, { useCallback } from 'react';
import { useSimulationContext, SimulationResult } from '../../contexts/SimulationContext';
import { testStatistics, TestStatisticType } from '../../contexts/testStatistics';
import { Icons } from '../Icons';
import dynamic from 'next/dynamic';
import { useTheme } from '../ThemeProvider';

import { PlotParams } from 'react-plotly.js';
import { Data, Layout } from 'plotly.js';
const Plot = dynamic<PlotParams>(() => import('react-plotly.js'), { ssr: false });

export default function SimulationDisplay() {
  const {
    simulationResults,
    isSimulating,
    pValue,
    simulationSpeed,
    setSimulationSpeed,
    totalSimulations,
    setTotalSimulations,
    selectedTestStatistic,
    setSelectedTestStatistic,
    observedStatistic,
    simulationActions,
    pValueType,
    setPValueType
  } = useSimulationContext();
  const { theme } = useTheme();

  const calculatePlotData = useCallback((simulationData: number[], observedStat: number, theme: string) => {
    const numBins = 20;
    const minResult = Math.min(...simulationData, observedStat) - 1;
    const maxResult = Math.max(...simulationData, observedStat) + 1;
    const binSize = (maxResult - minResult) / numBins;

    const maxFrequency = Math.max(...Object.values(
      simulationData.reduce((acc, val) => {
        const bin = Math.floor((val - minResult) / binSize);
        acc[bin] = (acc[bin] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    ), 0);

    return [
      {
        x: simulationData,
        type: 'histogram',
        marker: {
          color: theme === 'light' ? 'rgba(66, 135, 245, 0.6)' : 'rgba(102, 187, 255, 0.6)',
          line: { color: theme === 'light' ? 'rgba(66, 135, 245, 1)' : 'rgba(102, 187, 255, 1)', width: 1 }
        },
        xbins: { start: minResult, end: maxResult, size: binSize },
        name: 'Simulated Differences',
      },
      {
        x: [observedStat, observedStat],
        y: [0, maxFrequency + 1],
        type: 'scatter',
        mode: 'lines',
        line: { color: theme === 'light' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 102, 102, 0.7)', width: 2 },
        name: 'Observed Difference',
      }
    ] as Data[];
  }, []);

  const plotLayout: Partial<Layout> = {
    xaxis: { 
      title: testStatistics[selectedTestStatistic].name,
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
    margin: { l: 45, r: 35, b: 35, t: 0 },
    autosize: true,
  };

  const simulationData = simulationResults
    ? simulationResults.map(result => result.getTestStatistic(selectedTestStatistic))
    : [];
  const plotData = calculatePlotData(simulationData, observedStatistic || 0, theme);

  const getSimulationButtonProps = (isSimulating: boolean, simulationResults: SimulationResult[] | null, totalSimulations: number) => {
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
        <div className="space-y-4">
          {/* First row: Number of simulations and speed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="numTrials" className="font-semibold whitespace-nowrap">Number of trials:</label>
              <input
                id="numTrials"
                type="number"
                value={totalSimulations}
                onChange={(e) => setTotalSimulations(Math.max(0, parseInt(e.target.value)))}
                className="flex-grow border w-full rounded px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-background dark:bg-dark-background focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary"
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
                onChange={(e) => setSelectedTestStatistic(e.target.value as TestStatisticType)}
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
    </div>
  );
}