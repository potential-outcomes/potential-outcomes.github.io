// contexts/SimulationContext/utils.ts

import { DataRow } from './types';
import { ExperimentalTestStatistic, testStatistics } from './testStatistics';
import { sum } from 'mathjs';

// Utility function to create a new row
export const emptyRow = (columnCount: number): DataRow => ({
  data: Array(columnCount).fill(null),
  assignment: null,
  block: null,
});

// Utility function to calculate ranks for Wilcoxon Rank-Sum test
export const rank = (values: number[]): number[] => {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);

  const ranks = Array(values.length);
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].value !== sorted[i - 1].value) {
      currentRank = i + 1;
    }
    ranks[sorted[i].index] = currentRank;
  }

  return ranks;
};

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

export const shuffleWithinBlocks = (rows: DataRow[]): DataRow[] => {
  // Group rows by block
  const blockGroups: { [key: string]: DataRow[] } = {};
  rows.forEach(row => {
    const blockKey = row.block || 'andefault';
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
  simulationResults: DataRow[][],
  testStatistic: ExperimentalTestStatistic,
  pValueType: 'two-tailed' | 'left-tailed' | 'right-tailed'
): number => {
  const totalSimulations = simulationResults.length;
  let extremeCount = 0;

  switch (pValueType) {
    case 'two-tailed':
      extremeCount = simulationResults.filter(result => 
        Math.abs(testStatistics[testStatistic].function(result)) >= Math.abs(originalTestStatistic)
      ).length;
      break;
    case 'left-tailed':
      extremeCount = simulationResults.filter(result => 
        testStatistics[testStatistic].function(result) <= originalTestStatistic
      ).length;
      break;
    case 'right-tailed':
      extremeCount = simulationResults.filter(result => 
        testStatistics[testStatistic].function(result) >= originalTestStatistic
      ).length;
      break;
  }

  return extremeCount / totalSimulations;
};

export const validateSimulationSpeed = (speed: number): boolean => speed >= 1 && speed <= 100;
export const validateSelectedTestStatistic = (stat: ExperimentalTestStatistic): boolean => 
  Object.values(ExperimentalTestStatistic).includes(stat);
export const validateTotalSimulations = (total: number): boolean => total >= 1 && total <= 10000;
export const validatePValueType = (type: 'two-tailed' | 'left-tailed' | 'right-tailed'): boolean => 
  ['two-tailed', 'left-tailed', 'right-tailed'].includes(type);

export const createActionResult = <T>(action: () => T): { success: boolean; error?: string; value?: T } => {
  try {
    const result = action();
    return { success: true, value: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};