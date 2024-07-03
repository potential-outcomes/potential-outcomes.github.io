// app/contexts/SimulationContext.tsx
'use client';

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

export type DataRow = {
  treatment: number | null;
  control: number | null;
  assignment: 0 | 1;
  isNewRow?: boolean;
};

interface SimulationContextType {
  data: DataRow[];
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
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const createNewRow = (): DataRow => ({
  treatment: null,
  control: null,
  assignment: 0,
  isNewRow: true
});

export const MAX_COLUMN_NAME_LENGTH = 20;

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataRow[]>([createNewRow()]);
  const [history, setHistory] = useState<DataRow[][]>([]);
  const [future, setFuture] = useState<DataRow[][]>([]);
  const [treatmentColumnName, setTreatmentColumnName] = useState("Treatment");
  const [controlColumnName, setControlColumnName] = useState("Control");

  const pushToHistory = useCallback((oldData: DataRow[]) => {
    setHistory(prev => [...prev, oldData]);
    setFuture([]);
  }, []);

  const addRow = useCallback(() => {
    pushToHistory(data);
    setData(prevData => [...prevData, createNewRow()]);
  }, [data, pushToHistory]);

  const deleteRow = useCallback((index: number) => {
    pushToHistory(data);
    setData(prevData => prevData.filter((_, i) => i !== index || prevData[i].isNewRow));
  }, [data, pushToHistory]);

  const updateCell = useCallback((rowIndex: number, field: 'treatment' | 'control', value: number | null) => {
    pushToHistory(data);
    setData(prevData => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], [field]: value };
      
      if (newData[rowIndex].isNewRow && (value !== null)) {
        newData[rowIndex].isNewRow = false;
        newData.push(createNewRow());
      }
      
      return newData;
    });
  }, [data, pushToHistory]);

  const toggleAssignment = useCallback((rowIndex: number) => {
    pushToHistory(data);
    setData(prevData => {
      const newData = [...prevData];
      newData[rowIndex] = { ...newData[rowIndex], assignment: newData[rowIndex].assignment === 1 ? 0 : 1 };
      return newData;
    });
  }, [data, pushToHistory]);

  const undo = useCallback(() => {
    if (history.length > 0) {
      const prevState = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setFuture(prev => [data, ...prev]);
      setData(prevState);
    }
  }, [data, history]);

  const redo = useCallback(() => {
    if (future.length > 0) {
      const nextState = future[0];
      setFuture(prev => prev.slice(1));
      setHistory(prev => [...prev, data]);
      setData(nextState);
    }
  }, [data, future]);

  const setDataWithHistory = useCallback((newData: DataRow[]) => {
    pushToHistory(data);
    setData(newData);
  }, [data, pushToHistory]);

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
        setControlColumnName
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export const useSimulationContext = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
};