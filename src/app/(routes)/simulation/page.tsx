'use client';

import React from 'react';
import { SimulationProvider } from '../../../contexts/SimulationContext';
import DataInput from '@/components/DataInput/DataInput';
import PlotDisplay from '@/components/PlotDisplay/PlotDisplay';
import SimulationControls from '@/components/SimulationControls/SimulationControls';

const SimulationPage: React.FC = () => {
  return (
    <SimulationProvider>
      <div className="flex flex-col min-h-screen py-3 px-1 sm:px-2 md:px-3 lg:px-4">
        <div className="flex-grow flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-4">
          <div className="w-full lg:w-1/3 flex flex-col">
            <Card className="flex-shrink-0">
              <SimulationControls />
            </Card>
          </div>
          <div className="w-full lg:w-2/3 flex flex-col">
            <Card className="flex-shrink-0 max-h-[50%]">
              <DataInput />
            </Card>
            <Card className="flex-grow mt-4 min-h-[300px] max-h-[500px]">
              <PlotDisplay />
            </Card>
          </div>
        </div>
      </div>
    </SimulationProvider>
  );
};

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-2 sm:p-3 md:p-4 border border-light-background-tertiary dark:border-dark-background-tertiary ${className}`}>
    {children}
  </div>
);

export default SimulationPage;