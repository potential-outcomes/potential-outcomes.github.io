// contexts/SimulationContext/SimulationProvider.tsx

import React, { createContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { simulationReducer } from './reducer';
import * as actions from './actions';
import { SimulationContextType, SimulationState, ActionResult, DataRow, SimulationResult, PValueType, ExperimentalTestStatistic } from './types';
import { createActionResult, calculatePValue, testStatistics, shuffleArray, filterValidRows } from './utils';

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Initial state
const initialState: SimulationState = {
  data: {
    userData: {
      rows: [{ data: [null, null], assignment: 0 }],
      controlColumnIndex: 0,
      columnNames: ["Control", "Treatment"],
    },
    setUserData: () => ({ success: false, error: 'Not implemented' }),
    clearUserData: () => ({ success: false, error: 'Not implemented' }),
    addRow: () => ({ success: false, error: 'Not implemented' }),
    deleteRow: () => ({ success: false, error: 'Not implemented' }),
    updateCell: () => ({ success: false, error: 'Not implemented' }),
    toggleAssignment: () => ({ success: false, error: 'Not implemented' }),
    setControlColumn: () => ({ success: false, error: 'Not implemented' }),
    renameColumn: () => ({ success: false, error: 'Not implemented' }),
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
    startSimulation: async () => ({ success: false, error: 'Not implemented' }),
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
};

export const SimulationProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const simulationSpeedRef = useRef<number>(state.settings.simulationSpeed);

  const dispatchWithResult = useCallback(<T extends any[]>(
    actionCreator: (...args: T) => ReturnType<typeof actions[keyof typeof actions]>
  ) => (...args: T): ActionResult => {
    return createActionResult(() => {
      dispatch(actionCreator(...args));
      return undefined;
    });
  }, []);

  const setSimulationSpeed = useCallback((speed: number): ActionResult => {
    return createActionResult(() => {
      simulationSpeedRef.current = speed;
      dispatch(actions.setSimulationSpeed(speed));
    });
  }, []);

  const setUserData = dispatchWithResult(actions.setUserData);
  const clearUserData = dispatchWithResult(actions.clearUserData);
  const addRow = dispatchWithResult(actions.addRow);
  const deleteRow = dispatchWithResult(actions.deleteRow);
  const updateCell = dispatchWithResult(actions.updateCell);
  const toggleAssignment = dispatchWithResult(actions.toggleAssignment);
  const setControlColumn = dispatchWithResult(actions.setControlColumn);
  const renameColumn = dispatchWithResult(actions.renameColumn);
  const setSelectedTestStatistic = dispatchWithResult(actions.setSelectedTestStatistic);
  const setTotalSimulations = dispatchWithResult(actions.setTotalSimulations);
  const setPValueType = dispatchWithResult(actions.setPValueType);
  const clearSimulationData = dispatchWithResult(actions.clearSimulationData);
  const undo = dispatchWithResult(actions.undo);
  const redo = dispatchWithResult(actions.redo);

  const simulate = useCallback((data: DataRow[]): SimulationResult => {
    const validData = filterValidRows(data);
    const shuffledAssignments = shuffleArray(validData.map(row => row.assignment));
    const permutedData = validData.map((row, index) => ({ ...row, assignment: shuffledAssignments[index] }));
    return new SimulationResult(permutedData);
  }, []);

  const dynamicDelay = useCallback((baseDelay: number): Promise<void> => {
    const adjustedDelay = baseDelay - (15 * simulationSpeedRef.current);
    return new Promise(resolve => setTimeout(resolve, Math.max(0, adjustedDelay)));
  }, []);

  const runSimulation = useCallback(async (
    data: DataRow[],
    iterations: number,
    existingResults: SimulationResult[],
    abortSignal: AbortSignal,
    onProgress: (simulationResults: SimulationResult[], pValue: number) => void
  ): Promise<SimulationResult[]> => {
    let simulationResults = [...existingResults];
  
    for (let i = simulationResults.length; i < iterations; i++) {
      if (abortSignal.aborted) {
        throw new Error('Simulation aborted');
      }
  
      const result = simulate(data);
      simulationResults.push(result);
  
      const currentPValue = calculatePValue(
        state.results.observedStatistic!,
        simulationResults.map(r => r.rows),
        state.settings.selectedTestStatistic,
        state.settings.pValueType
      );

      onProgress(simulationResults, currentPValue);
  
      await dynamicDelay(2000);
    }
  
    return simulationResults;
  }, [simulate, state.results.observedStatistic, state.settings.selectedTestStatistic, state.settings.pValueType, dynamicDelay]);
  
  const startSimulation = useCallback(async (): Promise<ActionResult> => {
    if (state.control.isSimulating) return { success: false, error: 'Simulation already in progress' };

    dispatch(actions.startSimulation());

    if (state.results.simulationResults.length >= state.settings.totalSimulations) {
      dispatch(actions.setSimulationResults([]));
      // wait
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const existingResults = state.results.simulationResults.slice();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const results = await runSimulation(
        state.data.userData.rows,
        state.settings.totalSimulations,
        existingResults,
        abortController.signal,
        (simulationResults, pValue) => {
          dispatch(actions.setSimulationResults(simulationResults));
          dispatch(actions.setPValue(pValue));
        }
      );

      dispatch(actions.setSimulationResults(results));
      const finalPValue = calculatePValue(
        state.results.observedStatistic!,
        results.map(r => r.rows),
        state.settings.selectedTestStatistic,
        state.settings.pValueType
      );
      dispatch(actions.setPValue(finalPValue));
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message !== 'Simulation aborted' ? error.message : 'Simulation was aborted' };
      }
      return { success: false, error: 'An unknown error occurred during simulation' };
    } finally {
      dispatch(actions.pauseSimulation());
      abortControllerRef.current = null;
    }
  }, [state.control.isSimulating, state.data.userData.rows, state.settings.totalSimulations, state.results.simulationResults, state.results.observedStatistic, state.settings.selectedTestStatistic, state.settings.pValueType, runSimulation]);

  const pauseSimulation = useCallback((): ActionResult => {
    return createActionResult(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      dispatch(actions.pauseSimulation());
    });
  }, []);

  useEffect(() => {
    const newObservedStatistic = testStatistics[state.settings.selectedTestStatistic].function(state.data.userData.rows);
    dispatch(actions.setObservedStatistic(newObservedStatistic));
  
    if (state.results.simulationResults) {
      const newPValue = calculatePValue(
        newObservedStatistic,
        state.results.simulationResults.map(r => r.rows),
        state.settings.selectedTestStatistic,
        state.settings.pValueType
      );
      dispatch(actions.setPValue(newPValue));
    }
  }, [state.data.userData.rows, state.settings.selectedTestStatistic, state.settings.pValueType, state.results.simulationResults]);

  const contextValue: SimulationContextType = {
    data: {
      ...state.data,
      setUserData,
      clearUserData,
      addRow,
      deleteRow,
      updateCell,
      toggleAssignment,
      setControlColumn,
      renameColumn,
    },
    settings: {
      ...state.settings,
      setSimulationSpeed,
      setSelectedTestStatistic,
      setTotalSimulations,
      setPValueType,
    },
    control: {
      ...state.control,
      startSimulation,
      pauseSimulation,
      clearSimulationData,
    },
    results: state.results,
    history: {
      ...state.history,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      undo,
      redo,
    },
  };

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
};