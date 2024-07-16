// useSimulationContext.ts

import { useContext } from 'react';
import { SimulationContext } from './SimulationContext';

export const useSimulationContext = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
};