// potential-outcomes/src/lib/testStatistics.ts

import { DataRow } from '@/types/types';
import { sum } from 'mathjs';

export enum ExperimentalTestStatistic {
  DifferenceInMeans = 'differenceInMeans',
  WilcoxonRankSum = 'wilcoxonRankSum'
}

export interface TestStatisticMeta {
  name: string;
  function: (rows: DataRow[]) => number;
  supportsMultipleTreatments: boolean;
}

export interface TestStatisticFunction {
  (data: DataRow[]): number;
}

const rank = (values: number[]): number[] => {
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

const differenceInMeans: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    const value = row.data[row.assignment];
    if (typeof value === 'number') {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupMeans = Object.values(groups).map(group =>
    group.length > 0 ? group.reduce((sum, value) => sum + value, 0) / group.length : 0
  );

  return groupMeans.length >= 2 ? groupMeans[1] - groupMeans[0] : 0;
};

const wilcoxonRankSum: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    const value = row.data[0];
    if (typeof value === 'number') {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupValues = Object.values(groups);
  if (groupValues.length !== 2) {
    throw new Error('Wilcoxon rank-sum test requires exactly two groups.');
  }

  const [group1, group2] = groupValues;
  const combined = [...group1, ...group2];
  const ranks = rank(combined);

  const rankSumGroup1 = sum(ranks.slice(0, group1.length));
  const n1 = group1.length;
  const n2 = group2.length;

  const U1 = rankSumGroup1 - (n1 * (n1 + 1)) / 2;
  const U2 = (n1 * n2) - U1;

  return Math.min(U1, U2);
};

export const testStatistics: Record<ExperimentalTestStatistic, TestStatisticMeta> = {
  [ExperimentalTestStatistic.DifferenceInMeans]: {
    name: "Difference in Means",
    function: differenceInMeans,
    supportsMultipleTreatments: false
  },
  [ExperimentalTestStatistic.WilcoxonRankSum]: {
    name: "Wilcoxon Rank-Sum",
    function: wilcoxonRankSum,
    supportsMultipleTreatments: false
  }
};

export { differenceInMeans, wilcoxonRankSum };