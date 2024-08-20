// potential-outcomes/src/lib/testStatistics.ts

import { DataRow } from '@/types/types';
import { sum, mean, median, variance } from 'mathjs';

export enum ExperimentalTestStatistic {
  DifferenceInMeans = 'differenceInMeans',
  WilcoxonRankSum = 'wilcoxonRankSum',
  DifferenceInMedians = 'differenceInMedians',
  RatioOfVariances = 'ratioOfVariances',
  FStatistic = 'fStatistic'
}

export interface TestStatisticMeta {
  name: string;
  function: (rows: DataRow[]) => number;
  supportsMultipleTreatments: boolean;
}

export interface TestStatisticFunction {
  (data: DataRow[]): number;
}

const differenceInMeans: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
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

  // Separate data into two groups
  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[0];
    if (typeof value === 'number') {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupKeys = Object.keys(groups);
  if (groupKeys.length !== 2) {
    throw new Error("Wilcoxon Rank-Sum test requires exactly two groups");
  }

  // Combine and sort all values
  const allValues = [...groups[0], ...groups[1]].sort((a, b) => a - b);

  // Assign ranks
  const ranks = new Map<number, number>();
  allValues.forEach((value, index) => {
    if (!ranks.has(value)) {
      ranks.set(value, index + 1);
    }
  });

  // Handle tied ranks
  const tiedRanks = new Map<number, number[]>();
  ranks.forEach((rank, value) => {
    if (!tiedRanks.has(rank)) {
      tiedRanks.set(rank, []);
    }
    tiedRanks.get(rank)!.push(value);
  });

  tiedRanks.forEach((values, rank) => {
    if (values.length > 1) {
      const averageRank = (rank + rank + values.length - 1) / 2;
      values.forEach(value => ranks.set(value, averageRank));
    }
  });

  // Calculate rank sum for the first group
  const rankSum = groups[0].reduce((sum, value) => sum + ranks.get(value)!, 0);

  return rankSum;
};

const differenceInMedians: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[row.assignment];
    if (typeof value === 'number') {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupMedians = Object.values(groups).map(group =>
    group.length > 0 ? median(group) : 0
  );

  return groupMedians.length >= 2 ? groupMedians[1] - groupMedians[0] : 0;
};

const ratioOfVariances: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 1; // Return 1 for equal variances

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[row.assignment];
    if (typeof value === 'number') {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupVariances = Object.values(groups).map(group =>
    group.length > 1 ? Number(variance(group)) : 0
  );

  if (groupVariances.length < 2 || groupVariances[0] === 0) {
    return 1;
  }

  return groupVariances[1] / groupVariances[0];
};

const fStatistic: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    if (row.assignment !== null) {
      const value = row.data[row.assignment];
      if (typeof value === 'number') {
        if (!acc[row.assignment]) acc[row.assignment] = [];
        acc[row.assignment].push(value);
      }
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupMeans = Object.values(groups).map(group => Number(mean(group)));
  const groupSizes = Object.values(groups).map(group => group.length);
  
  // Calculate overall mean safely
  const allValidValues = data.flatMap(row => 
    row.assignment !== null && typeof row.data[row.assignment] === 'number' 
      ? [row.data[row.assignment] as number] 
      : []
  );
  const overallMean = Number(mean(allValidValues));

  const k = groupMeans.length; // number of groups
  const n = allValidValues.length; // total number of valid observations

  // Calculate SSR (Sum of Squares Regression)
  const SSR = groupMeans.reduce((sum, groupMean, i) => 
    sum + groupSizes[i] * Math.pow(groupMean - overallMean, 2), 0
  );

  // Calculate SSE (Sum of Squares Error)
  const SSE = Object.values(groups).reduce((sum, group, i) => 
    sum + group.reduce((groupSum, value) => 
      groupSum + Math.pow(value - groupMeans[i], 2), 0
    ), 0
  );

  // Calculate F-statistic
  const F = (SSR / (k - 1)) / (SSE / (n - k));

  return F;
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
  },
  [ExperimentalTestStatistic.DifferenceInMedians]: {
    name: "Difference in Medians",
    function: differenceInMedians,
    supportsMultipleTreatments: false
  },
  [ExperimentalTestStatistic.RatioOfVariances]: {
    name: "Ratio of Variances",
    function: ratioOfVariances,
    supportsMultipleTreatments: false
  },
  [ExperimentalTestStatistic.FStatistic]: {
    name: "F-Statistic",
    function: fStatistic,
    supportsMultipleTreatments: true
  }
};

export { differenceInMeans, wilcoxonRankSum, differenceInMedians, ratioOfVariances, fStatistic };