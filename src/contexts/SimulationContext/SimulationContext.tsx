// SimulationContext.tsx

'use client';

import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { testStatistics } from '@/lib/testStatistics';

import { DataRow, ExperimentalTestStatistic, UserDataState } from '@/types/types';



export class SimulationResult {
  rows: DataRow[];
  private _testStatistics: { [key in ExperimentalTestStatistic]?: number };

  constructor(rows: DataRow[], initialTestStatistics: { [key in ExperimentalTestStatistic]?: number } = {}) {
    this.rows = rows;
    this._testStatistics = initialTestStatistics;
  }

  getTestStatistic(testStatType: ExperimentalTestStatistic): number {
    if (this._testStatistics[testStatType] === undefined) {
      this._testStatistics[testStatType] = testStatistics[testStatType].function(this.rows);
    }
    return this._testStatistics[testStatType]!;
  }
}

export type Setter<T> = React.Dispatch<React.SetStateAction<T>>;
export type PValueType = 'two-tailed' | 'left-tailed' | 'right-tailed';

// Custom setter type with validation
type ValidatedSetter<T> = (value: T | ((prev: T) => T)) => void;

export interface SimulationContextType {
  // Mutable states
  userData: UserDataState;
  simulationSpeed: number;
  setSimulationSpeed: ValidatedSetter<number>;
  selectedTestStatistic: ExperimentalTestStatistic;
  setSelectedTestStatistic: ValidatedSetter<ExperimentalTestStatistic>;
  totalSimulations: number;
  setTotalSimulations: ValidatedSetter<number>;
  pValueType: PValueType;
  setPValueType: ValidatedSetter<PValueType>;

  // Read-only states
  simulationResults: SimulationResult[] | null;
  isSimulating: boolean;
  pValue: number | null;
  observedStatistic: number | null;

  // Actions
  dataActions: {
    setUserData: (newData: UserDataState | ((prevData: UserDataState) => UserDataState)) => void;
    addRow: () => void;
    deleteRow: (index: number) => void;
    updateCell: (rowIndex: number, columnIndex: number, value: number | null) => void;
    toggleAssignment: (rowIndex: number) => void;
    setControlColumn: (index: number) => void;
    renameColumn: (index: number, newName: string) => void;
    undo: () => void;
    redo: () => void;
  };
  simulationActions: {
    proceedSimulation: () => void;
    pauseSimulation: () => void;
    clearSimulationData: () => void;
  };
}

export const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Validation functions
export const validateSimulationSpeed = (speed: number): boolean => speed >= 1 && speed <= 100;
export const validateSelectedTestStatistic = (stat: ExperimentalTestStatistic): boolean => Object.values(ExperimentalTestStatistic).includes(stat);
export const validateTotalSimulations = (total: number): boolean => total >= 1 && total <= 10000;
export const validatePValueType = (type: PValueType): boolean => ['two-tailed', 'left-tailed', 'right-tailed'].includes(type);

// Custom setter creator
const createValidatedSetter = <T,>(setter: Setter<T>, validator: (value: T) => boolean): ValidatedSetter<T> => {
  return (value: T | ((prev: T) => T)) => {
    setter(prev => {
      const newValue = typeof value === 'function' ? (value as Function)(prev) : value;
      return validator(newValue) ? newValue : prev;
    });
  };
};

const createNewRow = (columnCount: number, assignment: number): DataRow => ({
  data: Array(columnCount).fill(null),
  assignment,
});

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const calculatePValue = (
  originalTestStatistic: number,
  simulationResults: SimulationResult[],
  testStatistic: ExperimentalTestStatistic,
  pValueType: PValueType
): number => {
  const totalSimulations = simulationResults.length;
  let extremeCount = 0;

  switch (pValueType) {
    case 'two-tailed':
      extremeCount = simulationResults.filter(result => Math.abs(result.getTestStatistic(testStatistic)) >= Math.abs(originalTestStatistic)).length;
      break;
    case 'left-tailed':
      extremeCount = simulationResults.filter(result => result.getTestStatistic(testStatistic) <= originalTestStatistic).length;
      break;
    case 'right-tailed':
      extremeCount = simulationResults.filter(result => result.getTestStatistic(testStatistic) >= originalTestStatistic).length;
      break;
  }

  return extremeCount / totalSimulations;
};

const filterValidRows = (rows: DataRow[]): DataRow[] => {
  return rows.slice(0, -1).filter(row => row.data.every(value => value !== null));
};

function useAsyncState<T>(initialState: T): [T, (newState: T | ((prevState: T) => T)) => Promise<T>] {
  const [state, setState] = useState<T>(initialState);
  const cbRef = useRef<((value: T) => void) | null>(null);

  const setStateAsync = useCallback((newState: T | ((prevState: T) => T)): Promise<T> => {
    return new Promise(resolve => {
      setState(prevState => {
        const nextState = typeof newState === 'function'
          ? (newState as (prevState: T) => T)(prevState)
          : newState;
        cbRef.current = () => resolve(nextState);
        return nextState;
      });
    });
  }, []);

  useEffect(() => {
    if (cbRef.current) {
      cbRef.current(state);
      cbRef.current = null;
    }
  }, [state]);

  return [state, setStateAsync];
}

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const initialUserDataState: UserDataState = {
    rows: [createNewRow(2, 0)],
    controlColumnIndex: 0,
    columnNames: ["Control", "Treatment"]
  };
  const [userData, setUserData] = useState<UserDataState>(initialUserDataState);
  const [simulationSpeed, setSimulationSpeedState] = useState(50);
  const [selectedTestStatistic, setSelectedTestStatisticState] = useState<ExperimentalTestStatistic>(ExperimentalTestStatistic.DifferenceInMeans);
  const [totalSimulations, setTotalSimulationsState] = useState(1000);
  const [pValueType, setPValueTypeState] = useState<PValueType>('two-tailed');
  const [simulationResults, setSimulationResults] = useState<SimulationResult[] | null>(null);
  const [isSimulating, setIsSimulatingAsync] = useAsyncState(false);
  const [pValue, setPValue] = useState<number | null>(null);
  const [observedStatistic, setObservedStatistic] = useState<number | null>(null);
  const [past, setPast] = useState<UserDataState[]>([]);
  const [future, setFuture] = useState<UserDataState[]>([]);
  const previousDataRef = useRef<UserDataState>(initialUserDataState);

  // Create validated setters
  const setSimulationSpeed = createValidatedSetter(setSimulationSpeedState, validateSimulationSpeed);
  const setSelectedTestStatistic = createValidatedSetter(setSelectedTestStatisticState, validateSelectedTestStatistic);
  const setTotalSimulations = createValidatedSetter(setTotalSimulationsState, validateTotalSimulations);
  const setPValueType = createValidatedSetter(setPValueTypeState, validatePValueType);

  const abortControllerRef = useRef<AbortController | null>(null);
  const simulationSpeedRef = useRef(simulationSpeed);

  useEffect(() => {
    simulationSpeedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  useEffect(() => {
    const validRows = filterValidRows(userData.rows);
    const newObservedStatistic = testStatistics[selectedTestStatistic].function(validRows);
    setObservedStatistic(newObservedStatistic);

    if (simulationResults) {
      const newPValue = calculatePValue(newObservedStatistic, simulationResults, selectedTestStatistic, pValueType);
      setPValue(newPValue);
    }
  }, [userData, selectedTestStatistic, pValueType, simulationResults]);

  const setUserDataWithHistory = useCallback((newData: UserDataState | ((prevData: UserDataState) => UserDataState)) => {
    console.log('Setting user data:', newData);
    
    setUserData(prevData => {
      console.log('setting user data DIRECT:');
      const nextData = typeof newData === 'function' ? newData(prevData) : newData;
      
      if (JSON.stringify(prevData) !== JSON.stringify(nextData)) {
        previousDataRef.current = prevData;
        
        queueMicrotask(() => {
          setPast(prev => {
            if (prev.length === 0 || JSON.stringify(prev[prev.length - 1]) !== JSON.stringify(previousDataRef.current)) {
              console.log('Updating past');
              return [...prev, previousDataRef.current];
            }
            return prev;
          });
          setFuture([]);
        });
      }
      
      return nextData;
    });
  }, []);

  const addRow = useCallback(() => {
    console.log('Adding row');
    setUserDataWithHistory(prevData => ({
      ...prevData,
      rows: [...prevData.rows, createNewRow(prevData.columnNames.length, 0)]
    }));
  }, []);

  const deleteRow = useCallback((index: number) => {
    console.log('Deleting row:', index);
    setUserDataWithHistory(prevData => ({
      ...prevData,
      rows: prevData.rows.filter((_, i) => i !== index)
    }));
  }, []);

  const updateCell = useCallback((rowIndex: number, columnIndex: number, value: number | null) => {
    console.log('Updating cell:', rowIndex, columnIndex, value);
    setUserDataWithHistory(prevData => {
      const newRows = [...prevData.rows];
      const toBeActivated = rowIndex === prevData.rows.length - 1 && value !== null;
      if (JSON.stringify(newRows[rowIndex].data[columnIndex]) !== JSON.stringify(value)) {
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          assignment: toBeActivated ? columnIndex : newRows[rowIndex].assignment,
          data: [
            ...newRows[rowIndex].data.slice(0, columnIndex),
            value,
            ...newRows[rowIndex].data.slice(columnIndex + 1)
          ]
        };
        if (toBeActivated) {
          newRows.push(createNewRow(prevData.columnNames.length, 0));
        }
        return { ...prevData, rows: newRows };
      }
      return prevData;
    });
  }, []);

  const toggleAssignment = useCallback((rowIndex: number) => {
    console.log('Toggling assignment for row:', rowIndex);
    setUserDataWithHistory(prevData => {
      const newRows = prevData.rows.map((row, index) => 
        index === rowIndex
          ? { 
              ...row, 
              assignment: (row.assignment + 1) % prevData.columnNames.length
            }
          : row
      );

      if (rowIndex === prevData.rows.length - 1) {
        newRows.push(createNewRow(prevData.columnNames.length, 0));
      }

      return { ...prevData, rows: newRows };
    });
  }, []);

  const setControlColumn = useCallback((index: number) => {
    console.log('Setting control column:', index);
    setUserDataWithHistory(prevData => ({
      ...prevData,
      controlColumnIndex: index
    }));
  }, []);

  const renameColumn = useCallback((index: number, newName: string) => {
    console.log('Renaming column:', index, newName);  
    setUserDataWithHistory(prevData => ({
      ...prevData,
      columnNames: prevData.columnNames.map((name, i) => i === index ? newName : name)
    }));
  }, []);

  const undo = useCallback(() => {
    if (past.length > 0) {
      console.log('Past:', past);
      const newPast = [...past];
      const previousState = newPast.pop()!;
      setPast(newPast);
      setFuture(prev => [userData, ...prev]);
      setUserData(previousState);
    }
  }, [past, userData]);

  const redo = useCallback(() => {
    if (future.length > 0) {
      const newFuture = [...future];
      const nextState = newFuture.shift()!;
      setFuture(newFuture);
      setPast(prev => [...prev, userData]);
      setUserData(nextState);
    }
  }, [future, userData]);

  const simulate = useCallback((
    data: DataRow[]
  ): SimulationResult => {
    const validData = filterValidRows(data);
    const shuffledAssignments = shuffleArray(validData.map(row => row.assignment));
    const permutedData = validData.map((row, index) => ({ ...row, assignment: shuffledAssignments[index] }));
    
    return new SimulationResult(permutedData);
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
  
      const currentPValue = calculatePValue(observedStatistic!, simulationResults, selectedTestStatistic, pValueType);

      onProgress(simulationResults, currentPValue);
  
      await new Promise(resolve => setTimeout(resolve, 1700 - (10 * simulationSpeedRef.current)));
    }
  
    return simulationResults;
  }, [simulate, pValueType, observedStatistic, selectedTestStatistic]);

  const proceedSimulation = useCallback(async () => {
    if (simulationResults && simulationResults.length >= totalSimulations) {
      setSimulationResults(null);
      setPValue(null);
    }

    if (isSimulating) return;

    await setIsSimulatingAsync(true);

    const existingResults = simulationResults || [];

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const results = await runSimulation(
        userData.rows,
        totalSimulations,
        existingResults,
        abortController.signal,
        (simulationResults, pValue) => {
          setSimulationResults(simulationResults);
          setPValue(pValue);
        }
      );

      setSimulationResults(results);
      const finalPValue = calculatePValue(observedStatistic!, results, selectedTestStatistic, pValueType);
      setPValue(finalPValue);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message !== 'Simulation aborted') {
          console.error('Simulation error:', error.message);
        }
      } else {
        console.error('An unknown error occurred during simulation');
      }
    } finally {
      await setIsSimulatingAsync(false);
      abortControllerRef.current = null;
    }
  }, [isSimulating, userData.rows, totalSimulations, runSimulation, pValueType, observedStatistic, simulationResults, selectedTestStatistic, setIsSimulatingAsync, setSimulationResults, setPValue, calculatePValue]);

  const pauseSimulation = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    await setIsSimulatingAsync(false);
  }, [setIsSimulatingAsync]);

  const clearSimulationData = useCallback(() => {
    setSimulationResults(null);
    setPValue(null);
  }, [setSimulationResults, setPValue]);

  const contextValue: SimulationContextType = {
    userData,
    simulationSpeed,
    setSimulationSpeed,
    selectedTestStatistic,
    setSelectedTestStatistic,
    totalSimulations,
    setTotalSimulations,
    pValueType,
    setPValueType,
    simulationResults,
    isSimulating,
    pValue,
    observedStatistic,
    dataActions: {
      setUserData: setUserDataWithHistory,
      addRow,
      deleteRow,
      updateCell,
      toggleAssignment,
      setControlColumn,
      renameColumn,
      undo,
      redo,
    },
    simulationActions: {
      proceedSimulation,
      pauseSimulation,
      clearSimulationData,
    },
  };

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
}

// useSimulationContext hook
// export const useSimulationContext = () => {
//   const context = useContext(SimulationContext);
//   if (context === undefined) {
//     throw new Error('useSimulationContext must be used within a SimulationProvider');
//   }
//   return context;
// };