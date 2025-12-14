// contexts/SimulationContext/constants.ts

import {
  SimulationState,
  PValueType,
  ExperimentalTestStatistic,
} from "./types";

const BASE_DELAY = 1500;

export const DEFAULT_COLUMN_COLORS = [
  "text-purple-500",
  "text-blue-500",
  "text-yellow-500",
  "text-green-500",
];

const DEFAULT_USER_DATA = {
  rows: [
    {
      data: [null, null],
      assignment: null,
      block: null,
      assignmentOriginalIndex: null,
    },
  ],
  columns: [
    { name: "Control", color: DEFAULT_COLUMN_COLORS[0] },
    { name: "Treatment", color: DEFAULT_COLUMN_COLORS[1] },
  ],
  colorStack: DEFAULT_COLUMN_COLORS.slice(2),
  baselineColumn: 0,
  blockingEnabled: false,
};
// Initial state
export const INITIAL_STATE: SimulationState = {
  latestStatisticBarRef: { current: null },
  data: {
    userData: DEFAULT_USER_DATA,
    setUserData: () => ({ success: false, error: "Not implemented" }),
    resetUserData: () => ({ success: false, error: "Not implemented" }),
    emptyUserData: () => ({ success: false, error: "Not implemented" }),
    addRow: () => ({ success: false, error: "Not implemented" }),
    deleteRow: () => ({ success: false, error: "Not implemented" }),
    updateCell: () => ({ success: false, error: "Not implemented" }),
    setAssignment: () => ({ success: false, error: "Not implemented" }),
    setBlock: () => ({ success: false, error: "Not implemented" }),
    renameColumn: () => ({ success: false, error: "Not implemented" }),
    addColumn: () => ({ success: false, error: "Not implemented" }),
    removeColumn: () => ({ success: false, error: "Not implemented" }),
    setBaselineColumn: () => ({ success: false, error: "Not implemented" }),
    setBlockingEnabled: () => ({ success: false, error: "Not implemented" }),
  },
  settings: {
    simulationSpeed: 40,
    selectedTestStatistic: ExperimentalTestStatistic.DifferenceInMeans,
    totalSimulations: 1000,
    pValueType: "two-tailed" as PValueType,
    setSimulationSpeed: () => ({ success: false, error: "Not implemented" }),
    setSelectedTestStatistic: () => ({
      success: false,
      error: "Not implemented",
    }),
    setTotalSimulations: () => ({ success: false, error: "Not implemented" }),
    setPValueType: () => ({ success: false, error: "Not implemented" }),
  },
  control: {
    isSimulating: false,
    startSimulation: () => ({ success: false, error: "Not implemented" }),
    pauseSimulation: () => ({ success: false, error: "Not implemented" }),
    clearSimulationData: () => ({ success: false, error: "Not implemented" }),
  },
  results: {
    simulationResults: [],
    pValue: null,
    observedStatistic: null,
    simulationDataSnapshot: null,
  },
  history: {
    canUndo: false,
    canRedo: false,
    undo: () => ({ success: false, error: "Not implemented" }),
    redo: () => ({ success: false, error: "Not implemented" }),
  },
  past: [],
  future: [],
  error: null,
};
