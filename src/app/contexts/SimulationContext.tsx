// src/contexts/SimulationContext.tsx
'use client';

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

/**
 * Represents a row of data in the simulation.
 */
export type DataRow = {
  treatment: number | null;
  control: number | null;
  assignment: 0 | 1;
  isNewRow?: boolean;
};

/**
 * Represents the shape of the simulation context.
 */
interface SimulationContextType {
  data: DataRow[];
  simulationData: DataRow[] | null;
  isSimulating: boolean;
  addRow: () => void;
  deleteRow: (index: number) => void;
  updateCell: (rowIndex: number, field: 'treatment' | 'control', value: number | null) => void;
  setData: (newData: DataRow[]) => void;
  toggleAssignment: (rowIndex: number) => void;
  undo: () => void;
  redo: () => void;
  treatmentColumnName: string;
  controlColumnName: string;
  setTreatmentColumnName: (name: string) => void;
  setControlColumnName: (name: string) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  setSimulationData: (data: DataRow[]) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

/**
 * Creates a new empty row for the simulation data.
 */
export const createNewRow = (): DataRow => ({
  treatment: null,
  control: null,
  assignment: 0,
  isNewRow: true
});

export const MAX_COLUMN_NAME_LENGTH = 20;

/**
 * Provider component for the SimulationContext.
 */
export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataRow[]>([createNewRow()]);
  const [history, setHistory] = useState<DataRow[][]>([]);
  const [future, setFuture] = useState<DataRow[][]>([]);
  const [treatmentColumnName, setTreatmentColumnName] = useState("Treatment");
  const [controlColumnName, setControlColumnName] = useState("Control");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState<DataRow[] | null>(null);

  /**
   * Pushes the current state to history.
   */
  const pushToHistory = useCallback((oldData: DataRow[]) => {
    setHistory((prev) => [...prev, oldData]);
    setFuture([]);
  }, []);

  /**
   * Adds a new row to the data.
   */
  const addRow = useCallback(() => {
    pushToHistory(data);
    setData((prevData) => [...prevData, createNewRow()]);
  }, [data, pushToHistory]);

  /**
   * Deletes a row from the data.
   */
  const deleteRow = useCallback((index: number) => {
    pushToHistory(data);
    setData((prevData) => prevData.filter((_, i) => i !== index || prevData[i].isNewRow));
  }, [data, pushToHistory]);

  /**
   * Updates a cell in the data.
   */
  const updateCell = useCallback((rowIndex: number, field: 'treatment' | 'control', value: number | null) => {
    pushToHistory(data);
    setData((prevData) => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], [field]: value };

      if (newData[rowIndex].isNewRow && (value !== null)) {
        newData[rowIndex].isNewRow = false;
        newData[rowIndex].assignment = field === 'treatment' ? 1 : 0;
      }

      return newData;
    });
  }, [data, pushToHistory]);

  /**
   * Toggles the assignment of a row.
   */
  const toggleAssignment = useCallback((rowIndex: number) => {
    pushToHistory(data);
    setData((prevData) => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], assignment: newData[rowIndex].assignment === 1 ? 0 : 1 };

      if (newData[rowIndex].isNewRow) {
        newData[rowIndex].isNewRow = false;
      }
      return newData;
    });
  }, [data, pushToHistory]);

  /**
   * Undoes the last action.
   */
  const undo = useCallback(() => {
    if (history.length > 0) {
      const prevState = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setFuture((prev) => [data, ...prev]);
      setData(prevState);
    }
  }, [data, history]);

  /**
   * Redoes the last undone action.
   */
  const redo = useCallback(() => {
    if (future.length > 0) {
      const nextState = future[0];
      setFuture((prev) => prev.slice(1));
      setHistory((prev) => [...prev, data]);
      setData(nextState);
    }
  }, [data, future]);

  /**
   * Sets new data and pushes the old data to history.
   */
  const setDataWithHistory = useCallback((newData: DataRow[]) => {
    pushToHistory(data);
    setData(newData);
  }, [data, pushToHistory]);

  /**
   * Starts the simulation.
   */
  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    setSimulationData(data);
  }, [data]);

  /**
   * Stops the simulation.
   */
  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    setSimulationData(null);
  }, []);

  /**
   * Sets new simulation data.
   */
  const setSimulationDataWithUpdate = useCallback((newData: DataRow[]) => {
    setSimulationData(newData);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === 'z') {
          event.preventDefault();
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <SimulationContext.Provider
      value={{
        data,
        simulationData,
        isSimulating,
        addRow,
        deleteRow,
        updateCell,
        setData: setDataWithHistory,
        toggleAssignment,
        undo,
        redo,
        treatmentColumnName,
        controlColumnName,
        setTreatmentColumnName,
        setControlColumnName,
        startSimulation,
        stopSimulation,
        setSimulationData: setSimulationDataWithUpdate
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

/**
 * Hook to use the SimulationContext.
 */
export const useSimulationContext = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
};