// src/components/PlotDisplay/PlotDisplay.tsx
'use client';

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PlotParams } from 'react-plotly.js';
import { Data, Layout } from 'plotly.js';
import { useTheme } from '../common/ThemeProvider';
import { useSimulationContext } from '@/contexts/SimulationContext';
import { testStatistics } from '../../lib/testStatistics';

const PlotlyPlot = dynamic<PlotParams>(() => import('react-plotly.js'), { ssr: false });

export const PlotDisplay: React.FC = () => {
  const { theme } = useTheme();
  const { simulationResults, selectedTestStatistic, observedStatistic } = useSimulationContext();

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

  return (
    <div className="mb-4 w-full h-full h-min-[300px]">
      <PlotlyPlot
        data={plotData}
        layout={plotLayout}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default PlotDisplay;