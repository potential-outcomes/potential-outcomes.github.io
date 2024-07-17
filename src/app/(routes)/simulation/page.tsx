'use client';

import React, { useState } from 'react';
import { SimulationProvider } from '../../../contexts/SimulationContext';
import DataInput from '../../../components/DataInput/DataInput';
import PlotDisplay from '@/components/PlotDisplay/PlotDisplay';
import SimulationControls from '@/components/SimulationControls/SimulationControls';

type LayoutType = 'side-by-side' | 'top-bottom';

const ToggleButton: React.FC<{ onClick: () => void; isTopBottom: boolean }> = ({ onClick, isTopBottom }) => (
  <button
    onClick={onClick}
    className="fixed top-4 right-40 z-10 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background px-3 py-2 rounded-md shadow-md hover:bg-light-primary-dark dark:hover:bg-dark-primary-light transition-colors duration-200"
  >
    {isTopBottom ? 'Side-by-Side Layout' : 'Top-Bottom Layout'}
  </button>
);

export default function SimulationPage() {
  const [layoutType, setLayoutType] = useState<LayoutType>('side-by-side');

  const toggleLayout = () => {
    setLayoutType(prev => prev === 'side-by-side' ? 'top-bottom' : 'side-by-side');
  };

  return (
    <SimulationProvider>
      <ToggleButton onClick={toggleLayout} isTopBottom={layoutType === 'top-bottom'} />
      {layoutType === 'side-by-side' ? (
        <div className="flex flex-col lg:flex-row gap-4 p-3 bg-light-background-secondary dark:bg-dark-background-secondary min-h-screen">
          <div className="w-full lg:w-1/2">
            <div className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-6 border border-light-background-tertiary dark:border-dark-background-tertiary">
              <DataInput />
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-6 border border-light-background-tertiary dark:border-dark-background-tertiary">
              <PlotDisplay />
              <SimulationControls />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen p-3 bg-light-background-secondary dark:bg-dark-background-secondary">
          <div className="flex flex-col lg:flex-row gap-4 mb-4 h-1/2">
            <div className="w-full lg:w-1/2 h-full">
              <div className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-4 border border-light-background-tertiary dark:border-dark-background-tertiary h-full overflow-auto">
                <DataInput />
              </div>
            </div>
            <div className="w-full lg:w-1/2 h-full">
              <div className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-4 border border-light-background-tertiary dark:border-dark-background-tertiary h-full overflow-auto">
                <SimulationControls />
              </div>
            </div>
          </div>
          <div className="flex-grow h-1/2">
            <div className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-4 border border-light-background-tertiary dark:border-dark-background-tertiary h-full">
              <PlotDisplay />
            </div>
          </div>
        </div>
      )}
    </SimulationProvider>
  );
}