// contexts/SimulationContext/hooks.ts

import { useContext } from 'react';
import { SimulationContext } from './SimulationProvider';
import {
  SimulationContextType,
  SimulationDataContext,
  SimulationSettingsContext,
  SimulationControlContext,
  SimulationResultsContext,
  SimulationHistoryContext
} from './types';

// Helper function to check context
function useSimulationContextCheck(): SimulationContextType {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('Simulation hooks must be used within a SimulationProvider');
  }
  return context;
}

// Hook to access the full simulation context
export function useFullSimulationContext(): SimulationContextType {
  return useSimulationContextCheck();
}

export function useLatestStatisticBarRef(): React.MutableRefObject<HTMLElement | null> {
  return useSimulationContextCheck().latestStatisticBarRef;
}

// Hook to access simulation data
export function useSimulationData(): SimulationDataContext {
  return useSimulationContextCheck().data;
}

// Hook to access simulation settings
export function useSimulationSettings(): SimulationSettingsContext {
  return useSimulationContextCheck().settings;
}

// Hook to access simulation control
export function useSimulationControl(): SimulationControlContext {
  return useSimulationContextCheck().control;
}

// Hook to access simulation results
export function useSimulationResults(): SimulationResultsContext {
  return useSimulationContextCheck().results;
}

export function useSimulationHistory(): SimulationHistoryContext {
  return useSimulationContextCheck().history;
}

export function useSimulationState() {
  const context = useSimulationContextCheck();
  const { userData } = context.data;
  const { simulationSpeed, selectedTestStatistic, totalSimulations, pValueType } = context.settings;
  const { isSimulating } = context.control;
  const { simulationResults, pValue, observedStatistic, simulationDataMatchesCurrent } = context.results;

  return {
    userData,
    simulationSpeed,
    selectedTestStatistic,
    totalSimulations,
    pValueType,
    isSimulating,
    simulationResults,
    pValue,
    observedStatistic,
    simulationDataMatchesCurrent
  };
}