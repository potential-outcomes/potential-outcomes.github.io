// src/components/PlotDisplay/PlotDisplay.tsx
'use client';

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PlotParams } from 'react-plotly.js';
import { Data, Layout } from 'plotly.js';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useTheme } from '../common/ThemeProvider';
import { 
  useSimulationState,
  useSimulationResults,
  useLatestStatisticBarRef,
  testStatistics,
} from '@/contexts/SimulationContext';

const Plot = dynamic<PlotParams>(() => import('react-plotly.js'), { ssr: false });

const StatDisplay: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-light-background-secondary dark:bg-dark-background-tertiary p-2 rounded-lg flex items-center justify-between min-w-0">
    <h4 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary truncate flex-shrink-0 mr-2">{title}</h4>
    <p className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary truncate min-w-0 flex-shrink text-right">
      {value}
    </p>
  </div>
);

interface Bin {
  start: number;
  end: number;
  count: number;
}

export const PlotDisplay: React.FC = () => {
  const plotRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { simulationResults, observedStatistic } = useSimulationResults();
  const { selectedTestStatistic, totalSimulations, pValue, isSimulating } = useSimulationState();
  const latestStatisticBarRef = useLatestStatisticBarRef();

  const calculatePlotData = useCallback((simulationData: number[], observedStat: number, theme: string) => {
    const numBins = 20;
    const minResult = Math.min(...simulationData, observedStat);
    const maxResult = Math.max(...simulationData, observedStat);
    const binSize = (maxResult - minResult) / (numBins - 1);

    // Initialize bins
    const bins: Bin[] = Array.from({ length: numBins }, (_, i) => ({
      start: minResult - (0.5 * binSize) + (i * binSize),
      end: minResult - (0.5 * binSize) + ((i + 1) * binSize),
      count: 0
    }));

    // Count data points in each bin
    simulationData.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minResult) / binSize), numBins - 1);
      if (bins[binIndex] === undefined) {
        bins[binIndex] = { start: minResult + (binIndex * binSize) - (0.5 * binSize), end: minResult + ((binIndex + 1) * binSize) - (0.5 * binSize), count: 0 };
      }
      bins[binIndex].count++;
    });

    const histogramTrace: Data = {
      x: bins.map(bin => (bin.start + bin.end) / 2),
      y: bins.map(bin => bin.count),
      type: 'bar',
      marker: {
        color: theme === 'light' ? 'rgba(66, 135, 245, 0.6)' : 'rgba(102, 187, 255, 0.6)',
        line: { color: theme === 'light' ? 'rgba(66, 135, 245, 1)' : 'rgba(102, 187, 255, 1)', width: 1 }
      },
      name: 'Simulated Differences',
    };

    const observedStatTrace: Data = {
      x: [observedStat, observedStat],
      y: [0, Math.max(...bins.map(bin => bin.count))],
      type: 'scatter',
      mode: 'lines',
      line: { color: theme === 'light' ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 102, 102, 0.7)', width: 2 },
      name: 'Observed Statistic',
    };

    return {
      plotData: [histogramTrace, observedStatTrace],
      minResult,
      maxResult,
      binSize,
      bins
    };
  }, []);

  const simulationData = useMemo(() => 
    simulationResults
      ? simulationResults.map(result => result.getTestStatistic(selectedTestStatistic))
      : [],
    [isSimulating, simulationResults.length, selectedTestStatistic]
  );

  const { plotData, minResult, maxResult, binSize, bins } = useMemo(() => 
    calculatePlotData(simulationData, observedStatistic || 0, theme),
    [isSimulating, simulationResults.length, calculatePlotData, simulationData, observedStatistic, theme]
  );

  const layout: Partial<Layout> = useMemo(() => ({
    autosize: true,
    xaxis: { 
      title: testStatistics[selectedTestStatistic].name,
      range: [minResult - (0.5 * binSize), maxResult + (0.5 * binSize)],
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
  }), [selectedTestStatistic, theme, minResult, maxResult]);

  const addBinRangeAttributes = useCallback(() => {
    if (plotRef.current) {
      const bars = plotRef.current.querySelectorAll('.bars .point');
      bars.forEach((bar, index) => {
        if (index < bins.length) {
          const { start, end } = bins[index];
          bar.setAttribute('data-bin-start', start.toString());
          bar.setAttribute('data-bin-end', end.toString());
        }
      });
    }
  }, [bins]);

  const latestStatistic = simulationResults && simulationResults.length > 0 ? simulationResults[simulationResults.length - 1].getTestStatistic(selectedTestStatistic) : null;
  // latestBinRef is used to highlight the latest bin in the plot
  const latestBinRef = useRef<SVGElement | null>(null);

  useEffect(() => {
    if (latestStatistic !== null && plotRef.current) {
      const bars = plotRef.current.querySelectorAll('.bars .point');
  
      // Check if any bars are found
      if (bars.length === 0) {
        console.warn('No bars found. Ensure the .bars .point selector is correct.');
        return;
      }
  
      const binIndex = Math.min(Math.floor((latestStatistic - minResult) / binSize), bins.length - 1);
      latestBinRef.current = bars[binIndex] as SVGElement;
  
      // Highlight the latest bin
      bars.forEach((bar, index) => {
        const path = bar.querySelector('path');
        
        if (!path) {
          console.warn(`No path found inside the bar at index ${index}`);
          return;
        }
  
        if (index === binIndex) {
          latestStatisticBarRef.current = path as unknown as HTMLElement;

          path.style.fill = 'rgba(80, 150, 235, 0.8)';
        }
      });
    }
  }, [latestStatistic, bins, minResult, binSize, theme]);
  

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow min-h-0" ref={plotRef}>
        <AutoSizer>
          {({ height, width }) => (
            <Plot
              data={plotData}
              layout={layout}
              config={{ responsive: true, autosizable: true }}
              style={{ width, height: height - 38 }}
              onAfterPlot={addBinRangeAttributes}
              onUpdate={addBinRangeAttributes}
            />
          )}
        </AutoSizer>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatDisplay 
          title="Observed Statistic" 
          value={observedStatistic !== null ? observedStatistic.toFixed(4) : 'N/A'} 
        />
        <StatDisplay 
          title="P-value"
          value={pValue !== null && !isNaN(pValue) ? pValue.toFixed(4) : 'N/A'}
        />
        <StatDisplay 
          title="Current Progress" 
          value={`${simulationResults ? simulationResults.length : 0} / ${totalSimulations}`} 
        />
      </div>
    </div>
  );
};

export default PlotDisplay;