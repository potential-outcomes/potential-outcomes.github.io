// contexts/SimulationContext/actions.ts

import { SimulationAction, UserDataState, ExperimentalTestStatistic, PValueType, SimulationResult } from './types';

export const setUserData = (userData: UserDataState): SimulationAction => ({
  type: 'SET_USER_DATA',
  payload: userData,
});

export const clearUserData = (): SimulationAction => ({
  type: 'CLEAR_USER_DATA',
});

export const addRow = (): SimulationAction => ({
  type: 'ADD_ROW',
});

export const deleteRow = (index: number): SimulationAction => ({
  type: 'DELETE_ROW',
  payload: index,
});

export const updateCell = (rowIndex: number, columnIndex: number, value: number | null): SimulationAction => ({
  type: 'UPDATE_CELL',
  payload: { rowIndex, columnIndex, value },
});

export const setAssignment = (rowIndex: number, assignment: number | null): SimulationAction => ({
  type: 'SET_ASSIGNMENT',
  payload: { rowIndex, assignment },
});

export const renameColumn = (index: number, newName: string): SimulationAction => ({
  type: 'RENAME_COLUMN',
  payload: { index, newName },
});

export const addColumn = (columnName: string): SimulationAction => ({
  type: 'ADD_COLUMN',
  payload: columnName,
});

export const removeColumn = (columnIndex: number): SimulationAction => ({
  type: 'REMOVE_COLUMN',
  payload: columnIndex,
});

export const setSimulationSpeed = (speed: number): SimulationAction => ({
  type: 'SET_SIMULATION_SPEED',
  payload: speed,
});

export const setSelectedTestStatistic = (statistic: ExperimentalTestStatistic): SimulationAction => ({
  type: 'SET_SELECTED_TEST_STATISTIC',
  payload: statistic,
});

export const setTotalSimulations = (total: number): SimulationAction => ({
  type: 'SET_TOTAL_SIMULATIONS',
  payload: total,
});

export const setPValueType = (type: PValueType): SimulationAction => ({
  type: 'SET_P_VALUE_TYPE',
  payload: type,
});

export const startSimulation = (): SimulationAction => ({
  type: 'START_SIMULATION',
});

export const pauseSimulation = (): SimulationAction => ({
  type: 'PAUSE_SIMULATION',
});

export const clearSimulationData = (): SimulationAction => ({
  type: 'CLEAR_SIMULATION_DATA',
});

export const setSimulationResults = (results: SimulationResult[]): SimulationAction => ({
  type: 'SET_SIMULATION_RESULTS',
  payload: results,
});

export const setPValue = (pValue: number): SimulationAction => ({
  type: 'SET_P_VALUE',
  payload: pValue,
});

export const setObservedStatistic = (statistic: number): SimulationAction => ({
  type: 'SET_OBSERVED_STATISTIC',
  payload: statistic,
});

export const undo = (): SimulationAction => ({
  type: 'UNDO',
});

export const redo = (): SimulationAction => ({
  type: 'REDO',
});