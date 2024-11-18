// potential-outcomes/src/lib/testStatistics.ts

import { DataRow } from "@/types/types";
import { sum, mean, median, variance, re } from "mathjs";

export enum ExperimentalTestStatistic {
  DifferenceInMeans = "differenceInMeans",
  WilcoxonRankSum = "wilcoxonRankSum",
  DifferenceInMedians = "differenceInMedians",
  RatioOfVariances = "ratioOfVariances",
  FStatistic = "fStatistic",
  BetweenGroupVariance = "betweenGroupVariance",
  RatioOfMeans = "ratioOfMeans",
}

export interface TestStatisticMeta {
  name: string;
  function: (rows: DataRow[]) => number;
  supportsMultipleTreatments: boolean;
  alwaysPositive: boolean;
}

export interface TestStatisticFunction {
  (data: DataRow[]): number;
}

const safeMedian = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  return median(arr);
};

const safeVariance = (arr: number[]): number => {
  if (arr.length <= 1) return 0;
  return Number(variance(arr));
};

const safeMean = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  return Number(mean(arr));
};

const differenceInMeans: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups: Record<number, number[]> = {};

  // Populate groups
  for (const row of data) {
    if (row.assignment !== null) {
      const value = row.data[row.assignment];
      if (typeof value === "number") {
        if (!groups[row.assignment]) groups[row.assignment] = [];
        groups[row.assignment].push(value);
      }
    }
  }

  // Ensure we have at least two groups
  if (Object.keys(groups).length < 2) return 0;

  // Calculate means for group 0 (control) and group 1 (treatment)
  const controlMean = safeMean(groups[0] || []);
  const treatmentMean = safeMean(groups[1] || []);

  // Return the difference (treatment - control)
  return treatmentMean - controlMean;
};

const wilcoxonRankSum: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[0];
    if (typeof value === "number") {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupKeys = Object.keys(groups);
  if (groupKeys.length !== 2) {
    return 0;
    // throw new Error("Wilcoxon Rank-Sum test requires exactly two groups");
  }

  // Check if either group is empty
  if (groups[0].length === 0 || groups[1].length === 0) {
    return 0;
  }

  const allValues = [...groups[0], ...groups[1]].sort((a, b) => a - b);

  const ranks = new Map<number, number>();
  allValues.forEach((value, index) => {
    if (!ranks.has(value)) {
      ranks.set(value, index + 1);
    }
  });

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
      values.forEach((value) => ranks.set(value, averageRank));
    }
  });

  const rankSum = groups[0].reduce((sum, value) => sum + ranks.get(value)!, 0);

  return rankSum;
};

const differenceInMedians: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[row.assignment];
    if (typeof value === "number") {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupMedians = Object.values(groups).map((group) => safeMedian(group));

  return groupMedians.length >= 2 ? groupMedians[1] - groupMedians[0] : 0;
};

const ratioOfVariances: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 1; // Return 1 for equal variances

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[row.assignment];
    if (typeof value === "number") {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupVariances = Object.values(groups).map((group) =>
    safeVariance(group)
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
      if (typeof value === "number") {
        if (!acc[row.assignment]) acc[row.assignment] = [];
        acc[row.assignment].push(value);
      }
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupMeans = Object.values(groups).map((group) => safeMean(group));
  const groupSizes = Object.values(groups).map((group) => group.length);

  const allValidValues = data.flatMap((row) =>
    row.assignment !== null && typeof row.data[row.assignment] === "number"
      ? [row.data[row.assignment] as number]
      : []
  );

  if (allValidValues.length === 0) return 0;

  const overallMean = safeMean(allValidValues);

  const k = groupMeans.length; // number of groups
  const n = allValidValues.length; // total number of valid observations

  if (k <= 1 || n <= k) return 0; // Not enough groups or observations

  const SSR = groupMeans.reduce(
    (sum, groupMean, i) =>
      sum + groupSizes[i] * Math.pow(groupMean - overallMean, 2),
    0
  );

  const SSE = Object.values(groups).reduce(
    (sum, group, i) =>
      sum +
      group.reduce(
        (groupSum, value) => groupSum + Math.pow(value - groupMeans[i], 2),
        0
      ),
    0
  );

  const F = SSR / (k - 1) / (SSE / (n - k));

  return F;
};

const betweenGroupVariance: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 0;

  const groups = data.reduce((acc, row) => {
    if (row.assignment !== null) {
      const value = row.data[row.assignment];
      if (typeof value === "number") {
        if (!acc[row.assignment]) acc[row.assignment] = [];
        acc[row.assignment].push(value);
      }
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupMeans = Object.values(groups).map((group) => safeMean(group));
  const groupSizes = Object.values(groups).map((group) => group.length);
  const allValues = Object.values(groups).flat();
  const overallMean = safeMean(allValues);

  const betweenGroupSS = groupMeans.reduce(
    (sum, groupMean, index) =>
      sum + groupSizes[index] * Math.pow(groupMean - overallMean, 2),
    0
  );

  const totalGroups = Object.keys(groups).length;
  return totalGroups > 1 ? betweenGroupSS / (totalGroups - 1) : 0;
};

const ratioOfMeans: TestStatisticFunction = (data: DataRow[]) => {
  if (!data || data.length === 0) return 1; // Return 1 for equal means

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[row.assignment];
    if (typeof value === "number") {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  const groupMeans = Object.values(groups).map((group) => safeMean(group));

  if (groupMeans.length < 2 || groupMeans[0] === 0) {
    return 1;
  }

  return groupMeans[1] / groupMeans[0];
};

export const testStatistics: Record<
  ExperimentalTestStatistic,
  TestStatisticMeta
> = {
  [ExperimentalTestStatistic.DifferenceInMeans]: {
    name: "Difference in Means",
    function: differenceInMeans,
    supportsMultipleTreatments: false,
    alwaysPositive: false,
  },
  [ExperimentalTestStatistic.WilcoxonRankSum]: {
    name: "Wilcoxon Rank-Sum",
    function: wilcoxonRankSum,
    supportsMultipleTreatments: false,
    alwaysPositive: true,
  },
  [ExperimentalTestStatistic.DifferenceInMedians]: {
    name: "Difference in Medians",
    function: differenceInMedians,
    supportsMultipleTreatments: false,
    alwaysPositive: false,
  },
  [ExperimentalTestStatistic.RatioOfVariances]: {
    name: "Ratio of Variances",
    function: ratioOfVariances,
    supportsMultipleTreatments: false,
    alwaysPositive: true,
  },
  [ExperimentalTestStatistic.FStatistic]: {
    name: "F-Statistic",
    function: fStatistic,
    supportsMultipleTreatments: true,
    alwaysPositive: true,
  },
  [ExperimentalTestStatistic.BetweenGroupVariance]: {
    name: "Between-Group Variance",
    function: betweenGroupVariance,
    supportsMultipleTreatments: true,
    alwaysPositive: true,
  },
  [ExperimentalTestStatistic.RatioOfMeans]: {
    name: "Ratio of Means",
    function: ratioOfMeans,
    supportsMultipleTreatments: false,
    alwaysPositive: true,
  },
};

export {
  differenceInMeans,
  wilcoxonRankSum,
  differenceInMedians,
  ratioOfVariances,
  fStatistic,
  betweenGroupVariance,
  ratioOfMeans,
};
