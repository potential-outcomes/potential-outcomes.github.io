// contexts/SimulationContext/index.ts

export { SimulationProvider, SimulationContext } from './SimulationProvider';

export {
  useFullSimulationContext,
  useSimulationData,
  useSimulationSettings,
  useSimulationControl,
  useSimulationResults,
  useSimulationHistory,
  useSimulationState
} from './hooks';

export * from './actions';

export * from './types';

export {
  emptyRow,
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