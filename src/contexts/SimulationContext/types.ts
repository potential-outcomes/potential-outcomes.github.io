// contexts/SimulationContext/types.ts

import { DataRow } from "@/types/types";
import { ExperimentalTestStatistic } from "./testStatistics";
import { SimulationResult } from "./SimulationResult";

export type { DataRow } from "@/types/types";

export { SimulationResult } from "./SimulationResult";
export { ExperimentalTestStatistic } from "./testStatistics";

export interface Column {
  id: string;
  name: string;
  color: string;
}

export interface UserDataState {
  rows: DataRow[];
  columns: Column[];
  colorStack: string[];
  baselineColumn: number;
  blockingEnabled: boolean;
}

export interface UserDataSnapshot {
  rows: DataRow[];
  baselineColumn: number;
  blockingEnabled: boolean;
}

export type PValueType = "two-tailed" | "left-tailed" | "right-tailed";

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
  reorderRows: (activeIndex: number, overIndex: number) => void;
  reorderColumns: (activeIndex: number, overIndex: number) => void;
  updateCell: (
    rowIndex: number,
    columnIndex: number,
    value: number | null
  ) => void;
  setAssignment: (rowIndex: number, assignment: number | null) => void;
  setBlock: (rowIndex: number, block: string | null) => void;
  renameColumn: (index: number, newName: string) => void;
  addColumn: (name: string) => void;
  removeColumn: (index: number) => void;
  setBaselineColumn: (columnIndex: number) => void;
  setBlockingEnabled: (enabled: boolean) => void;
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
  simulationDataSnapshot: UserDataSnapshot | null;
  simulationDataMatchesCurrent: boolean; // Computed in provider
}

export interface SimulationResultsState {
  simulationResults: SimulationResult[];
  pValue: number | null;
  observedStatistic: number | null;
  simulationDataSnapshot: UserDataSnapshot | null;
}
export interface SimulationHistoryContext {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

export type PlotThresholdDirection = "leq" | "geq";

export interface PlotSettingsContext {
  thresholdDirection: PlotThresholdDirection;
  thresholdInput: string;
  setThresholdDirection: (direction: PlotThresholdDirection) => void;
  setThresholdInput: (input: string) => void;
}

/** Payload for restoring shareable config from the URL (excludes simulation outputs). */
export interface HydrateFromUrlPayload {
  userData: UserDataState;
  settings: {
    simulationSpeed: number;
    selectedTestStatistic: ExperimentalTestStatistic;
    totalSimulations: number;
    pValueType: PValueType;
  };
  plot: {
    thresholdDirection: PlotThresholdDirection;
    thresholdInput: string;
  };
}

export interface SimulationContextType {
  data: SimulationDataContext;
  settings: SimulationSettingsContext;
  plot: PlotSettingsContext;
  control: SimulationControlContext;
  results: SimulationResultsContext;
  history: SimulationHistoryContext;
  latestStatisticBarRef: React.MutableRefObject<HTMLElement | null>;
  error: ErrorState | null;
  /** Apply URL-parsed config in one shot; clears results and undo history. */
  hydrateFromUrl: (payload: HydrateFromUrlPayload) => void;
}

// Action types (for use in reducer)
export type SimulationAction =
  | { type: "SET_USER_DATA"; payload: UserDataState }
  | { type: "RESET_USER_DATA" }
  | { type: "EMPTY_USER_DATA" }
  | { type: "ADD_ROW" }
  | { type: "DELETE_ROW"; payload: number }
  | {
      type: "REORDER_ROWS";
      payload: { activeIndex: number; overIndex: number };
    }
  | {
      type: "REORDER_COLUMNS";
      payload: { activeIndex: number; overIndex: number };
    }
  | {
      type: "UPDATE_CELL";
      payload: { rowIndex: number; columnIndex: number; value: number | null };
    }
  | {
      type: "SET_ASSIGNMENT";
      payload: { rowIndex: number; assignment: number | null };
    }
  | { type: "SET_BLOCK"; payload: { rowIndex: number; block: string | null } }
  | { type: "SET_BASELINE_COLUMN"; payload: number }
  | { type: "SET_CONTROL_COLUMN"; payload: number }
  | { type: "RENAME_COLUMN"; payload: { index: number; newName: string } }
  | { type: "ADD_COLUMN"; payload: string }
  | { type: "REMOVE_COLUMN"; payload: number }
  | { type: "SET_SIMULATION_SPEED"; payload: number }
  | { type: "SET_SELECTED_TEST_STATISTIC"; payload: ExperimentalTestStatistic }
  | { type: "SET_TOTAL_SIMULATIONS"; payload: number }
  | { type: "SET_P_VALUE_TYPE"; payload: PValueType }
  | { type: "SET_BLOCKING_ENABLED"; payload: boolean }
  | { type: "START_SIMULATION" }
  | { type: "PAUSE_SIMULATION" }
  | { type: "CLEAR_SIMULATION_DATA" }
  | { type: "SET_SIMULATION_RESULTS"; payload: SimulationResult[] }
  | { type: "SET_P_VALUE"; payload: number }
  | { type: "SET_OBSERVED_STATISTIC"; payload: number }
  | { type: "SET_SIMULATION_DATA_SNAPSHOT"; payload: UserDataSnapshot }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "HYDRATE_FROM_URL"; payload: HydrateFromUrlPayload }
  | { type: "SET_PLOT_THRESHOLD_DIRECTION"; payload: PlotThresholdDirection }
  | { type: "SET_PLOT_THRESHOLD_INPUT"; payload: string };

// State type for the reducer
export interface SimulationState
  extends Omit<SimulationContextType, "results"> {
  results: SimulationResultsState;
  past: UserDataState[];
  future: UserDataState[];
}
