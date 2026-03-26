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
  function: TestStatisticFunction;
  supportsMultipleTreatments: boolean;
  alwaysPositive: boolean;
  usesBaseline: boolean;
}

export interface TestStatisticFunction {
  (data: DataRow[], baselineColumn: number): number;
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

const differenceInMeans: TestStatisticFunction = (
  data: DataRow[],
  baselineColumn: number
) => {
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

  // Ensure we have baseline and at least one other group
  if (Object.keys(groups).length < 2 || !groups[baselineColumn]) return 0;

  // Find the treatment group (first non-baseline group)
  const treatmentColumn = Object.keys(groups)
    .map(Number)
    .find((col) => col !== baselineColumn);

  if (treatmentColumn === undefined || !groups[treatmentColumn]) return 0;

  // Calculate means
  const baselineMean = safeMean(groups[baselineColumn]);
  const treatmentMean = safeMean(groups[treatmentColumn]);

  // Return the difference (treatment - baseline)
  return treatmentMean - baselineMean;
};

const wilcoxonRankSum: TestStatisticFunction = (
  data: DataRow[],
  baselineColumn: number
) => {
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

  // Find treatment column (first non-baseline)
  const treatmentColumn = Object.keys(groups)
    .map(Number)
    .find((col) => col !== baselineColumn);

  if (
    treatmentColumn === undefined ||
    !groups[baselineColumn] ||
    !groups[treatmentColumn]
  ) {
    return 0;
  }

  // Check if either group is empty
  if (
    groups[baselineColumn].length === 0 ||
    groups[treatmentColumn].length === 0
  ) {
    return 0;
  }

  const allValues = [
    ...groups[baselineColumn],
    ...groups[treatmentColumn],
  ].sort((a, b) => a - b);

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

  // Use baseline group for rank sum
  const rankSum = groups[baselineColumn].reduce(
    (sum, value) => sum + ranks.get(value)!,
    0
  );

  return rankSum;
};

const differenceInMedians: TestStatisticFunction = (
  data: DataRow[],
  baselineColumn: number
) => {
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

  // Find treatment column (first non-baseline)
  const treatmentColumn = Object.keys(groups)
    .map(Number)
    .find((col) => col !== baselineColumn);

  if (
    treatmentColumn === undefined ||
    !groups[baselineColumn] ||
    !groups[treatmentColumn]
  ) {
    return 0;
  }

  const baselineMedian = safeMedian(groups[baselineColumn]);
  const treatmentMedian = safeMedian(groups[treatmentColumn]);

  return treatmentMedian - baselineMedian;
};

const ratioOfVariances: TestStatisticFunction = (
  data: DataRow[],
  baselineColumn: number
) => {
  if (!data || data.length === 0) return 1;

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[row.assignment];
    if (typeof value === "number") {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  // Find treatment column (first non-baseline)
  const treatmentColumn = Object.keys(groups)
    .map(Number)
    .find((col) => col !== baselineColumn);

  if (
    treatmentColumn === undefined ||
    !groups[baselineColumn] ||
    !groups[treatmentColumn]
  ) {
    return 1;
  }

  const baselineVariance = safeVariance(groups[baselineColumn]);
  const treatmentVariance = safeVariance(groups[treatmentColumn]);

  if (baselineVariance === 0) return 1;

  return treatmentVariance / baselineVariance;
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

const ratioOfMeans: TestStatisticFunction = (
  data: DataRow[],
  baselineColumn: number
) => {
  if (!data || data.length === 0) return 1;

  const groups = data.reduce((acc, row) => {
    if (row.assignment === null) return acc;
    const value = row.data[row.assignment];
    if (typeof value === "number") {
      if (!acc[row.assignment]) acc[row.assignment] = [];
      acc[row.assignment].push(value);
    }
    return acc;
  }, {} as Record<number, number[]>);

  // Find treatment column (first non-baseline)
  const treatmentColumn = Object.keys(groups)
    .map(Number)
    .find((col) => col !== baselineColumn);

  if (
    treatmentColumn === undefined ||
    !groups[baselineColumn] ||
    !groups[treatmentColumn]
  ) {
    return 1;
  }

  const baselineMean = safeMean(groups[baselineColumn]);
  const treatmentMean = safeMean(groups[treatmentColumn]);

  if (baselineMean === 0) return 1;

  return treatmentMean / baselineMean;
};

/** Rows with all potential outcomes filled (covered cells) and a valid assignment. */
function filterCompleteRowsForNull(data: DataRow[]): DataRow[] {
  return data.filter(
    (row) =>
      row.assignment !== null && row.data.every((cell) => cell !== null)
  );
}

/** First column index other than baseline (matches two-group test statistic logic). */
function getFirstTreatmentColumn(
  numCols: number,
  baselineColumn: number
): number | null {
  for (let i = 0; i < numCols; i++) {
    if (i !== baselineColumn) return i;
  }
  return null;
}

/**
 * One synthetic row per unit per group: each row keeps full `data` (covered cells);
 * `assignment` picks which potential outcome contributes to the statistic.
 */
function buildSyntheticTwoGroupRows(
  completeRows: DataRow[],
  baselineColumn: number,
  treatmentColumn: number
): DataRow[] {
  return completeRows.flatMap((row) => [
    { ...row, assignment: baselineColumn },
    { ...row, assignment: treatmentColumn },
  ]);
}

/** One synthetic row per unit per treatment arm (all columns). */
function buildSyntheticMultiGroupRows(
  completeRows: DataRow[],
  numCols: number
): DataRow[] {
  return completeRows.flatMap((row) =>
    Array.from({ length: numCols }, (_, col) => ({
      ...row,
      assignment: col,
    }))
  );
}

/**
 * Reference value implied by the filled-in potential outcomes (covered cells) under the
 * stated null. Uses synthetic assignments so every unit contributes Y(baseline) and Y(treatment)
 * (or all arms for multi-group stats), matching how simulations use the full table.
 */
export function getStatisticUnderNull(
  data: DataRow[],
  baselineColumn: number,
  testStatType: ExperimentalTestStatistic
): number | null {
  const completeRows = filterCompleteRowsForNull(data);
  if (completeRows.length === 0) return null;

  const numCols = completeRows[0].data.length;
  if (numCols < 2) return null;

  switch (testStatType) {
    case ExperimentalTestStatistic.DifferenceInMeans: {
      const treatmentColumn = getFirstTreatmentColumn(numCols, baselineColumn);
      if (treatmentColumn === null) return null;
      const synthetic = buildSyntheticTwoGroupRows(
        completeRows,
        baselineColumn,
        treatmentColumn
      );
      return differenceInMeans(synthetic, baselineColumn);
    }
    case ExperimentalTestStatistic.DifferenceInMedians: {
      const treatmentColumn = getFirstTreatmentColumn(numCols, baselineColumn);
      if (treatmentColumn === null) return null;
      const synthetic = buildSyntheticTwoGroupRows(
        completeRows,
        baselineColumn,
        treatmentColumn
      );
      return differenceInMedians(synthetic, baselineColumn);
    }
    case ExperimentalTestStatistic.RatioOfVariances: {
      const treatmentColumn = getFirstTreatmentColumn(numCols, baselineColumn);
      if (treatmentColumn === null) return null;
      const synthetic = buildSyntheticTwoGroupRows(
        completeRows,
        baselineColumn,
        treatmentColumn
      );
      return ratioOfVariances(synthetic, baselineColumn);
    }
    case ExperimentalTestStatistic.RatioOfMeans: {
      const treatmentColumn = getFirstTreatmentColumn(numCols, baselineColumn);
      if (treatmentColumn === null) return null;
      const synthetic = buildSyntheticTwoGroupRows(
        completeRows,
        baselineColumn,
        treatmentColumn
      );
      return ratioOfMeans(synthetic, baselineColumn);
    }

    case ExperimentalTestStatistic.BetweenGroupVariance: {
      const synthetic = buildSyntheticMultiGroupRows(completeRows, numCols);
      return betweenGroupVariance(synthetic, baselineColumn);
    }
    case ExperimentalTestStatistic.FStatistic: {
      const synthetic = buildSyntheticMultiGroupRows(completeRows, numCols);
      return fStatistic(synthetic, baselineColumn);
    }

    case ExperimentalTestStatistic.WilcoxonRankSum: {
      // Expected rank sum for baseline group under H0; matches simulation scale (n1, n2).
      const groups = data.reduce((acc, row) => {
        if (row.assignment === null) return acc;
        const value = row.data[row.assignment];
        if (typeof value === "number") {
          if (!acc[row.assignment]) acc[row.assignment] = [];
          acc[row.assignment].push(value);
        }
        return acc;
      }, {} as Record<number, number[]>);

      const treatmentColumn = Object.keys(groups)
        .map(Number)
        .find((col) => col !== baselineColumn);

      if (
        treatmentColumn === undefined ||
        !groups[baselineColumn] ||
        !groups[treatmentColumn]
      ) {
        return null;
      }

      const n1 = groups[baselineColumn].length;
      const n2 = groups[treatmentColumn].length;
      if (n1 === 0 || n2 === 0) return null;
      return (n1 * (n1 + n2 + 1)) / 2;
    }

    default:
      return null;
  }
}

export const testStatistics: Record<
  ExperimentalTestStatistic,
  TestStatisticMeta
> = {
  [ExperimentalTestStatistic.DifferenceInMeans]: {
    name: "Difference in Means",
    function: differenceInMeans,
    supportsMultipleTreatments: false,
    alwaysPositive: false,
    usesBaseline: true,
  },
  [ExperimentalTestStatistic.WilcoxonRankSum]: {
    name: "Wilcoxon Rank-Sum",
    function: wilcoxonRankSum,
    supportsMultipleTreatments: false,
    alwaysPositive: true,
    usesBaseline: true,
  },
  [ExperimentalTestStatistic.DifferenceInMedians]: {
    name: "Difference in Medians",
    function: differenceInMedians,
    supportsMultipleTreatments: false,
    alwaysPositive: false,
    usesBaseline: true,
  },
  [ExperimentalTestStatistic.RatioOfVariances]: {
    name: "Ratio of Variances",
    function: ratioOfVariances,
    supportsMultipleTreatments: false,
    alwaysPositive: true,
    usesBaseline: true,
  },
  [ExperimentalTestStatistic.FStatistic]: {
    name: "F-Statistic",
    function: fStatistic,
    supportsMultipleTreatments: true,
    alwaysPositive: true,
    usesBaseline: false,
  },
  [ExperimentalTestStatistic.BetweenGroupVariance]: {
    name: "Between-Group Variance",
    function: betweenGroupVariance,
    supportsMultipleTreatments: true,
    alwaysPositive: true,
    usesBaseline: false,
  },
  [ExperimentalTestStatistic.RatioOfMeans]: {
    name: "Ratio of Means",
    function: ratioOfMeans,
    supportsMultipleTreatments: false,
    alwaysPositive: true,
    usesBaseline: true,
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
