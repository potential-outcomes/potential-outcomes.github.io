// contexts/SimulationContext/types.ts

import { DataRow } from '@/types/types';
import { ExperimentalTestStatistic } from './testStatistics';
import { SimulationResult } from './SimulationResult';

export type { DataRow } from '@/types/types';

export { SimulationResult } from './SimulationResult';
export { ExperimentalTestStatistic } from './testStatistics';

export interface Column {
  name: string;
  color: string;
}

export interface UserDataState {
  rows: DataRow[];
  columns: Column[];
  colorStack: string[];
}

export type PValueType = 'two-tailed' | 'left-tailed' | 'right-tailed';

export interface ActionResult {
  success: boolean;
  error?: string;
  warning?: string;
}

export type WarningCondition = {
  check: (state: SimulationState) => boolean;
  message: string;
};

export interface ErrorState {
  message: string;
}

// Context interfaces
export interface SimulationDataContext {
  userData: UserDataState;
  setUserData: (data: UserDataState) => void;
  resetUserData: () => void;
  emptyUserData: () => void;
  addRow: () => void;
  deleteRow: (index: number) => void;
  updateCell: (rowIndex: number, columnIndex: number, value: number | null) => void;
  setAssignment: (rowIndex: number, assignment: number | null) => void;
  setBlock: (rowIndex: number, block: string | null) => void;
  renameColumn: (index: number, newName: string) => void;
  addColumn: (name: string) => void;
  removeColumn: (index: number) => void;
}

export interface SimulationSettingsContext {
  simulationSpeed: number;
  selectedTestStatistic: ExperimentalTestStatistic;
  totalSimulations: number;
  pValueType: PValueType;
  setSimulationSpeed: (speed: number) => void;
  setSelectedTestStatistic: (statistic: ExperimentalTestStatistic) => void;
  setTotalSimulations: (total: number) => ActionResult;
  setPValueType: (type: PValueType) => void;
}

export interface SimulationControlContext {
  isSimulating: boolean;
  startSimulation: () => ActionResult;
  pauseSimulation: () => ActionResult;
  clearSimulationData: () => ActionResult;
}

export interface SimulationResultsContext {
  simulationResults: SimulationResult[];
  pValue: number | null;
  observedStatistic: number | null;
}

export interface SimulationHistoryContext {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export interface SimulationContextType {
  data: SimulationDataContext;
  settings: SimulationSettingsContext;
  control: SimulationControlContext;
  results: SimulationResultsContext;
  history: SimulationHistoryContext;
  error: ErrorState | null;
}

// Action types (for use in reducer)
export type SimulationAction =
  | { type: 'SET_USER_DATA'; payload: UserDataState }
  | { type: 'RESET_USER_DATA' }
  | { type: 'EMPTY_USER_DATA' }
  | { type: 'ADD_ROW' }
  | { type: 'DELETE_ROW'; payload: number }
  | { type: 'UPDATE_CELL'; payload: { rowIndex: number; columnIndex: number; value: number | null } }
  | { type: 'SET_ASSIGNMENT'; payload: { rowIndex: number; assignment: number | null } }
  | { type: 'SET_BLOCK'; payload: { rowIndex: number; block: string | null } }
  | { type: 'SET_CONTROL_COLUMN'; payload: number }
  | { type: 'RENAME_COLUMN'; payload: { index: number; newName: string } }
  | { type: 'ADD_COLUMN'; payload: string }
  | { type: 'REMOVE_COLUMN'; payload: number }
  | { type: 'SET_SIMULATION_SPEED'; payload: number }
  | { type: 'SET_SELECTED_TEST_STATISTIC'; payload: ExperimentalTestStatistic }
  | { type: 'SET_TOTAL_SIMULATIONS'; payload: number }
  | { type: 'SET_P_VALUE_TYPE'; payload: PValueType }
  | { type: 'START_SIMULATION' }
  | { type: 'PAUSE_SIMULATION' }
  | { type: 'CLEAR_SIMULATION_DATA' }
  | { type: 'SET_SIMULATION_RESULTS'; payload: SimulationResult[] }
  | { type: 'SET_P_VALUE'; payload: number }
  | { type: 'SET_OBSERVED_STATISTIC'; payload: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// State type for the reducer
export interface SimulationState extends SimulationContextType {
  past: UserDataState[];
  future: UserDataState[];
}