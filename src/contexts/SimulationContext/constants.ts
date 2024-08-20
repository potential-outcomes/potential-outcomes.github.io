// contexts/SimulationContext/constants.ts

import { SimulationState, PValueType, ExperimentalTestStatistic } from './types';

// Initial state
export const INITIAL_STATE: SimulationState = {
    data: {
      userData: {
        rows: [{ data: [null, null], assignment: null , block: null}],
        columns: [{name: "Control", color: 'text-purple-500' }, {name: "Treatment", color: "text-blue-500"}],
        colorStack: ['text-yellow-500', 'text-green-500']
      },
      setUserData: () => ({ success: false, error: 'Not implemented' }),
      resetUserData: () => ({ success: false, error: 'Not implemented' }),
      emptyUserData: () => ({success: false, error: 'Not implemented'}),
      addRow: () => ({ success: false, error: 'Not implemented' }),
      deleteRow: () => ({ success: false, error: 'Not implemented' }),
      updateCell: () => ({ success: false, error: 'Not implemented' }),
      setAssignment: () => ({ success: false, error: 'Not implemented' }),
      setBlock: () => ({ success: false, error: 'Not implemented' }),
      renameColumn: () => ({ success: false, error: 'Not implemented' }),
      addColumn: () => ({ success: false, error: 'Not implemented' }),
      removeColumn: () => ({ success: false, error: 'Not implemented' }),
    },
    settings: {
      simulationSpeed: 50,
      selectedTestStatistic: ExperimentalTestStatistic.DifferenceInMeans,
      totalSimulations: 1000,
      pValueType: 'two-tailed' as PValueType,
      setSimulationSpeed: () => ({ success: false, error: 'Not implemented' }),
      setSelectedTestStatistic: () => ({ success: false, error: 'Not implemented' }),
      setTotalSimulations: () => ({ success: false, error: 'Not implemented' }),
      setPValueType: () => ({ success: false, error: 'Not implemented' }),
    },
    control: {
      isSimulating: false,
      startSimulation: () => ({ success: false, error: 'Not implemented' }),
      pauseSimulation: () => ({ success: false, error: 'Not implemented' }),
      clearSimulationData: () => ({ success: false, error: 'Not implemented' }),
    },
    results: {
      simulationResults: [],
      pValue: null,
      observedStatistic: null,
    },
    history: {
      canUndo: false,
      canRedo: false,
      undo: () => ({ success: false, error: 'Not implemented' }),
      redo: () => ({ success: false, error: 'Not implemented' }),
    },
    past: [],
    future: [],
    error: null
  };