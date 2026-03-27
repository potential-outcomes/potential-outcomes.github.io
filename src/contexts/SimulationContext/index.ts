// contexts/SimulationContext/index.ts

export { SimulationProvider, SimulationContext } from './SimulationProvider';
export { SimulationUrlSync } from './SimulationUrlSync';

export {
  useFullSimulationContext,
  useSimulationData,
  useSimulationSettings,
  useSimulationControl,
  useSimulationResults,
  useSimulationHistory,
  useSimulationState,
  useLatestStatisticBarRef,
  usePlotSettings,
} from './hooks';

export * from './actions';

export * from './types';

export {
  emptyRow,
  newRowId,
  newColumnId,
  ensureColumnIds,
  remapColumnIndexAfterMove,
  SIMULATION_DUMMY_ROW_ID,
  shuffleArray,
  filterValidRows,
  calculatePValue,
  validateSimulationSpeed,
  validateSelectedTestStatistic,
  validateTotalSimulations,
  validatePValueType,
  createActionResult,
  calculateColumnAverages,
  calculateColumnStandardDeviations,
  speedToDuration
} from './utils';

export {
  differenceInMeans,
  wilcoxonRankSum,
  testStatistics
} from './testStatistics';