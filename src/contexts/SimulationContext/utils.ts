// contexts/SimulationContext/utils.ts

import { DataRow, ActionResult, SimulationResult } from './types';
import { ExperimentalTestStatistic, testStatistics } from './testStatistics';

// Utility function to create a new row
export const emptyRow = (columnCount: number): DataRow => ({
  data: Array(columnCount).fill(null),
  assignment: null,
  block: null,
});

export const calculateColumnAverages = (rows: DataRow[]): (number | null)[] => {
  const groups = rows.reduce((acc, row, index) => {
    // Skip the last row if it's unactivated
    if (index === rows.length - 1 && row.data.every(cell => cell === null)) return acc;

    row.data.forEach((value, colIndex) => {
      if (value !== null && row.assignment === colIndex) {
        if (!acc[colIndex]) acc[colIndex] = [];
        acc[colIndex].push(value);
      }
    });
    return acc;
  }, {} as Record<number, number[]>);

  return rows[0].data.map((_, index) => {
    const group = groups[index] || [];
    return group.length > 0 ? group.reduce((sum, value) => sum + value, 0) / group.length : null;
  });
};

export const calculateColumnStandardDeviations = (rows: DataRow[]): (number | null)[] => {
  const groups = rows.reduce((acc, row, index) => {
    // Skip the last row if it's unactivated
    if (index === rows.length - 1 && row.data.every(cell => cell === null)) return acc;

    row.data.forEach((value, colIndex) => {
      if (value !== null && row.assignment === colIndex) {
        if (!acc[colIndex]) acc[colIndex] = [];
        acc[colIndex].push(value);
      }
    });
    return acc;
  }, {} as Record<number, number[]>);

  return rows[0].data.map((_, index) => {
    const group = groups[index] || [];
    if (group.length === 0) return null;

    const average = group.reduce((sum, value) => sum + value, 0) / group.length;
    const squaredDifferences = group.map(value => Math.pow(value - average, 2));
    const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / group.length;
    return Math.sqrt(variance);
  });
};

export const shuffleRowAssignments = (rows: DataRow[], respectBlocks: boolean): DataRow[] => {
  if (!respectBlocks) {
    // If not respecting blocks, simply shuffle all assignments
    const allAssignments = rows.map(row => row.assignment);
    const shuffledAssignments = shuffleArray(allAssignments);
    return rows.map((row, index) => ({
      ...row,
      assignment: shuffledAssignments[index]
    }));
  }

  // If respecting blocks, proceed with the block-based logic
  const blockGroups: { [key: string]: DataRow[] } = {};
  rows.forEach(row => {
    const blockKey = row.block || 'default';
    if (!blockGroups[blockKey]) {
      blockGroups[blockKey] = [];
    }
    blockGroups[blockKey].push(row);
  });

  // Shuffle assignments within each block
  Object.keys(blockGroups).forEach(blockKey => {
    const group = blockGroups[blockKey];
    const assignments = group.map(row => row.assignment);
    const shuffledAssignments = shuffleArray(assignments);
    
    group.forEach((row, index) => {
      row.assignment = shuffledAssignments[index];
    });
  });

  // Flatten the groups back into a single array
  return Object.values(blockGroups).flat();
};

// Utility function to shuffle an array (used in simulation)
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Utility function to filter valid rows
export const filterValidRows = (rows: DataRow[]): DataRow[] => {
  return rows.slice(0, -1).filter(row => row.data.every(value => value !== null));
};

export const calculatePValue = (
  originalTestStatistic: number,
  simulationResults: SimulationResult[],
  testStatistic: ExperimentalTestStatistic,
  pValueType: 'two-tailed' | 'left-tailed' | 'right-tailed'
): number => {
  const totalSimulations = simulationResults.length;
  let extremeCount = 0;

  switch (pValueType) {
    case 'two-tailed':
      extremeCount = simulationResults.filter(result => 
        Math.abs(result.getTestStatistic(testStatistic)) >= Math.abs(originalTestStatistic)
      ).length;
      break;
    case 'left-tailed':
      extremeCount = simulationResults.filter(result => 
        result.getTestStatistic(testStatistic) <= originalTestStatistic
      ).length;
      break;
    case 'right-tailed':
      extremeCount = simulationResults.filter(result => 
        result.getTestStatistic(testStatistic) >= originalTestStatistic
      ).length;
      break;
  }

  const pValue = extremeCount / totalSimulations;

  return pValue;
};

export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
export const speedToDuration = (speed: number): number => Math.max(1500 - (sigmoid((speed - 50) / 10) * 1500), 2);

export const validateSimulationSpeed = (speed: number): boolean => speed >= 1 && speed <= 100;
export const validateSelectedTestStatistic = (stat: ExperimentalTestStatistic): boolean => 
  Object.values(ExperimentalTestStatistic).includes(stat);
export const validateTotalSimulations = (total: number): boolean => total >= 1 && total <= 10000;
export const validatePValueType = (type: 'two-tailed' | 'left-tailed' | 'right-tailed'): boolean => 
  ['two-tailed', 'left-tailed', 'right-tailed'].includes(type);

export const createActionResult = (
  action: () => void,
  options?: { 
    warnIf?: () => boolean;
    warnMessage?: string;
  }
): ActionResult => {
  try {
    action();
    const warning = options?.warnIf?.() ? options.warnMessage : undefined;
    return { success: true, warning };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};