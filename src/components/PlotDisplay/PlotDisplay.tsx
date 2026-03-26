import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { PlotParams } from "react-plotly.js";
import { Data, Layout } from "plotly.js";
import AutoSizer from "react-virtualized-auto-sizer";
import { useTheme } from "../common/ThemeProvider";
import {
  useSimulationState,
  useSimulationResults,
  useLatestStatisticBarRef,
  testStatistics,
} from "@/contexts/SimulationContext";
import { getStatisticUnderNull } from "@/contexts/SimulationContext/testStatistics";
import { ThresholdFilter, Direction } from "./ThresholdFilter";

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), {
  ssr: false,
});

const StatDisplay: React.FC<{
  title: string;
  value: string | number;
  isStale?: boolean;
  /** Lining + tabular figures for stable digit width (progress, counts) */
  valueNumeric?: boolean;
}> = React.memo(({ title, value, isStale = false, valueNumeric = false }) => (
  <div
    className={`
      bg-light-background-secondary dark:bg-dark-background-tertiary 
      p-3 rounded-lg flex flex-col gap-1 w-full h-full
      transition-opacity duration-200
      ${isStale ? "opacity-50" : "opacity-100"}
    `}
  >
    <h4 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">
      {title}
    </h4>
    <p
      className={`text-lg font-bold text-light-text-primary dark:text-dark-text-primary ${
        valueNumeric ? "lining-nums tabular-nums" : ""
      }`}
    >
      {value}
    </p>
  </div>
));

StatDisplay.displayName = "StatDisplay";

interface Bin {
  start: number;
  end: number;
  count: number;
}

/** Round to `sigFigs` significant figures (gentler than 1–2–5 decade snapping). */
function roundToSignificantFigures(value: number, sigFigs: number): number {
  if (!isFinite(value) || value === 0) return value;
  const x = Math.abs(value);
  const exp = Math.floor(Math.log10(x));
  const scale = Math.pow(10, sigFigs - 1 - exp);
  const rounded = Math.round(x * scale) / scale;
  return value < 0 ? -rounded : rounded;
}

/** Smallest value ≥ `value` with at most `sigFigs` significant digits (stable y-axis max). */
function ceilToSignificantFigures(value: number, sigFigs: number): number {
  if (!isFinite(value) || value <= 0) return 1;
  const x = Math.abs(value);
  const exp = Math.floor(Math.log10(x));
  const scale = Math.pow(10, sigFigs - 1 - exp);
  return Math.ceil(x * scale - Number.EPSILON) / scale;
}

const BIN_WIDTH_SIG_FIGS = 1;
const Y_AXIS_SIG_FIGS = 2;
const BIN_WIDTH_SCALE = 1.25;

function roundHistogramBinWidthGentle(width: number): number {
  return roundToSignificantFigures(width * BIN_WIDTH_SCALE, BIN_WIDTH_SIG_FIGS);
}

function roundYAxisMaxGentle(value: number): number {
  return ceilToSignificantFigures(value, Y_AXIS_SIG_FIGS);
}

export const PlotDisplay: React.FC = () => {
  const plotRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { simulationResults, observedStatistic, simulationDataMatchesCurrent } =
    useSimulationResults();
  const { userData, selectedTestStatistic, totalSimulations, isSimulating } =
    useSimulationState();
  const latestStatisticBarRef = useLatestStatisticBarRef();

  // Threshold filter state (hoisted from ThresholdFilter component)
  const [threshold1Direction, setThreshold1Direction] =
    useState<Direction>("geq");
  const [threshold1Input, setThreshold1Input] = useState<string>("");

  // Determine if results are stale
  const isStale = simulationResults.length > 0 && !simulationDataMatchesCurrent;

  const statisticUnderNull = useMemo(
    () =>
      getStatisticUnderNull(
        userData.rows,
        userData.baselineColumn,
        selectedTestStatistic
      ),
    [userData.rows, userData.baselineColumn, selectedTestStatistic]
  );

  // Parse threshold values
  const threshold1Value = useMemo(() => {
    const parsed = parseFloat(threshold1Input);
    return isNaN(parsed) ? null : parsed;
  }, [threshold1Input]);

  const calculatePlotData = useCallback(
    (
      simulationData: number[],
      observedStat: number,
      theme: string,
      isStale: boolean,
      /** Stabilizes bin width during incremental simulation (Scott's n^(1/3) term). */
      expectedSimulations: number
    ) => {
      const isPositiveOnly =
        testStatistics[selectedTestStatistic].alwaysPositive;

      // Adjust opacity based on stale status
      const baseOpacity = isStale ? 0.3 : 0.6;
      const lineOpacity = isStale ? 0.4 : 1.0;

      if (!simulationData?.length) {
        // Initialize empty plot with appropriate scale
        const rawBin =
          observedStat === 0 ? 1 : Math.abs(observedStat) / 15;
        const binSize = roundHistogramBinWidthGentle(rawBin);
        const defaultRange = 2 * Math.max(5 * binSize, Math.abs(observedStat));
        const dummyMin = isPositiveOnly ? 0 : -defaultRange;
        const dummyMax = defaultRange;
        const totalBins = Math.ceil((dummyMax - dummyMin) / binSize);

        const dummyBins: Bin[] = Array.from({ length: totalBins }, (_, i) => ({
          start: dummyMin + i * binSize,
          end: dummyMin + (i + 1) * binSize,
          count: 0,
        }));

        const histogramTrace: Data = {
          x: dummyBins.map((bin) => (bin.start + bin.end) / 2),
          y: dummyBins.map((bin) => bin.count),
          type: "bar",
          marker: {
            color:
              theme === "light"
                ? `rgba(66, 135, 245, ${baseOpacity})`
                : `rgba(102, 187, 255, ${baseOpacity})`,
            line: {
              color:
                theme === "light"
                  ? `rgba(66, 66, 75, ${lineOpacity})`
                  : `rgba(187, 187, 195, ${lineOpacity})`,
              width: 1,
            },
          },
          name: "Simulated Statistics",
        };

        return {
          plotData: [histogramTrace],
          minResult: dummyMin,
          maxResult: dummyMax,
          binSize,
          bins: dummyBins,
          maxCount: 0,
        };
      }

      // Calculate parameters for non-empty data
      const dataMin = Math.min(...simulationData);
      const dataMax = Math.max(...simulationData);
      const hasSpread = dataMin !== dataMax;

      // Calculate bin size using Scott's rule: bin width = 3.49 × σ / n^(1/3)
      const n = simulationData.length;
      const scottN = Math.max(n, Math.max(1, expectedSimulations));
      const mean = simulationData.reduce((sum, val) => sum + val, 0) / n;
      const variance =
        simulationData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        n;
      const standardDeviation = Math.sqrt(variance);

      // Apply Scott's rule; use max(actual, expected) for n^(1/3) so width doesn't drift each trial
      let binSize =
        standardDeviation > 0
          ? (3.49 * standardDeviation) / Math.pow(scottN, 1 / 3)
          : hasSpread
          ? (dataMax - dataMin) / 10 // Fallback: use 10 bins if no variance
          : 1; // Fallback: use bin size of 1 if no spread

      // Ensure minimum bin size to avoid division by zero or too many bins
      if (binSize <= 0 || !isFinite(binSize)) {
        binSize = hasSpread ? (dataMax - dataMin) / 10 : 1;
      }

      binSize = roundHistogramBinWidthGentle(binSize);
      if (binSize <= 0 || !isFinite(binSize)) {
        binSize = hasSpread ? (dataMax - dataMin) / 10 : 1;
      }

      // Determine range
      const effectiveMin = hasSpread ? dataMin : dataMin - binSize;
      const effectiveMax = hasSpread ? dataMax : dataMax + binSize;

      // Calculate adjusted range (round to bin edges for clean binning)
      let adjustedMin: number;
      let adjustedMax: number;

      if (isPositiveOnly) {
        adjustedMin = 0;
        const maxValue = Math.max(effectiveMax, observedStat);
        adjustedMax = Math.ceil(maxValue / binSize) * binSize;
      } else {
        const minValue = Math.min(effectiveMin, -observedStat);
        const maxValue = Math.max(effectiveMax, observedStat);
        adjustedMin = Math.floor(minValue / binSize) * binSize;
        adjustedMax = Math.ceil(maxValue / binSize) * binSize;
      }

      // Create bins
      const totalBins = Math.ceil((adjustedMax - adjustedMin) / binSize);
      const bins: Bin[] = Array.from({ length: totalBins }, (_, i) => ({
        start: adjustedMin + i * binSize,
        end: adjustedMin + (i + 1) * binSize,
        count: 0,
      }));

      // Count occurrences in bins
      simulationData.forEach((value) => {
        const binIndex = Math.min(
          Math.floor((value - adjustedMin) / binSize),
          totalBins - 1
        );
        if (binIndex >= 0 && bins[binIndex]) {
          bins[binIndex].count++;
        }
      });

      // Create histogram trace
      const histogramTrace: Data = {
        x: bins.map((bin) => (bin.start + bin.end) / 2),
        y: bins.map((bin) => bin.count),
        type: "bar",
        marker: {
          color:
            theme === "light"
              ? `rgba(66, 135, 245, ${baseOpacity})`
              : `rgba(102, 187, 255, ${baseOpacity})`,
          line: {
            color:
              theme === "light"
                ? `rgba(66, 66, 75, ${lineOpacity})`
                : `rgba(187, 187, 195, ${lineOpacity})`,
            width: 1,
          },
        },
        name: "Simulated Statistics",
      };

      const maxCount = Math.max(...bins.map((bin) => bin.count));

      return {
        plotData: [histogramTrace],
        minResult: adjustedMin,
        maxResult: adjustedMax,
        binSize,
        bins,
        maxCount,
      };
    },
    [selectedTestStatistic]
  );

  const simulationData = useMemo(
    () =>
      simulationResults.map((result) =>
        result.getTestStatistic(selectedTestStatistic, userData.baselineColumn)
      ),
    [isSimulating, simulationResults.length, selectedTestStatistic]
  );

  const { plotData, minResult, maxResult, binSize, bins, maxCount } = useMemo(
    () =>
      calculatePlotData(
        simulationData,
        observedStatistic || 0,
        theme,
        isStale,
        totalSimulations
      ),
    [
      calculatePlotData,
      simulationData,
      observedStatistic,
      theme,
      isSimulating,
      simulationResults.length,
      isStale,
      totalSimulations,
    ]
  );

  const displayYMax = useMemo(
    () => roundYAxisMaxGentle(Math.max(maxCount + 1, 1)),
    [maxCount]
  );

  // Add threshold line and stat-under-null reference to plot data
  const plotDataWithThresholds = useMemo(() => {
    const thresholdLineOpacity = isStale ? 0.4 : 0.8;
    const nullStatLineOpacity = isStale ? 0.35 : 0.85;
    const traces = [...plotData];

    if (
      statisticUnderNull !== null &&
      statisticUnderNull !== undefined &&
      Number.isFinite(statisticUnderNull)
    ) {
      const statUnderNullLine: Data = {
        x: [statisticUnderNull, statisticUnderNull],
        y: [0, displayYMax],
        type: "scatter",
        mode: "lines",
        line: {
          color:
            theme === "light"
              ? `rgba(22, 163, 74, ${nullStatLineOpacity})`
              : `rgba(74, 222, 128, ${nullStatLineOpacity})`,
          width: 3,
          dash: "dash",
        },
        name: "Stat under null",
        showlegend: true,
        legendgroup: "stat-under-null",
      };
      traces.push(statUnderNullLine);
    }

    if (threshold1Value !== null) {
      const thresholdLine1: Data = {
        x: [threshold1Value, threshold1Value],
        y: [0, displayYMax],
        type: "scatter",
        mode: "lines",
        line: {
          color:
            theme === "light"
              ? `rgba(220, 38, 38, ${thresholdLineOpacity})`
              : `rgba(248, 113, 113, ${thresholdLineOpacity})`,
          width: 3,
          dash: "dash",
        },
        name: "Threshold",
        showlegend: true,
        legendgroup: "thresholds",
      };
      traces.push(thresholdLine1);
    }

    return traces;
  }, [
    plotData,
    threshold1Value,
    displayYMax,
    theme,
    isStale,
    statisticUnderNull,
  ]);

  const histogramXMin = minResult - 0.5 * binSize;
  const histogramXMax =
    bins.length > 0
      ? bins[bins.length - 1].end + 0.5 * binSize
      : maxResult + 0.5 * binSize;

  const statUnderNullFinite =
    statisticUnderNull !== null &&
    statisticUnderNull !== undefined &&
    Number.isFinite(statisticUnderNull)
      ? statisticUnderNull
      : null;

  const halfBin = 0.5 * binSize;
  const xAxisRangeMin =
    statUnderNullFinite !== null
      ? Math.min(histogramXMin, statUnderNullFinite - halfBin)
      : histogramXMin;
  const xAxisRangeMax =
    statUnderNullFinite !== null
      ? Math.max(histogramXMax, statUnderNullFinite + halfBin)
      : histogramXMax;

  const layout: Partial<Layout> = useMemo(
    () => ({
      autosize: true,
      xaxis: {
        title: testStatistics[selectedTestStatistic].name,
        range: [xAxisRangeMin, xAxisRangeMax],
        tickmode: "auto",
        nticks: 10,
        tickfont: { color: theme === "light" ? "black" : "white" },
        titlefont: { color: theme === "light" ? "black" : "white" },
      },
      yaxis: {
        title: "Frequency",
        tickmode: "auto",
        nticks: 10,
        tickfont: { color: theme === "light" ? "black" : "white" },
        titlefont: { color: theme === "light" ? "black" : "white" },
        range: [0, displayYMax],
      },
      bargap: 0,
      showlegend: true,
      legend: {
        x: 0.98,
        y: 0.98,
        xanchor: "right",
        yanchor: "top",
        bgcolor:
          theme === "light" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
        bordercolor:
          theme === "light" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
        borderwidth: 1,
        font: { color: theme === "light" ? "black" : "white" },
      },
      annotations: [],
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 45, r: 35, b: 32, t: 0 },
    }),
    [
      selectedTestStatistic,
      theme,
      displayYMax,
      xAxisRangeMin,
      xAxisRangeMax,
    ]
  );

  const addBinRangeAttributes = useCallback(() => {
    if (plotRef.current) {
      const bars = plotRef.current.querySelectorAll(".bars .point");
      bars.forEach((bar, index) => {
        if (index < bins.length) {
          const { start, end } = bins[index];
          bar.setAttribute("data-bin-start", start.toString());
          bar.setAttribute("data-bin-end", end.toString());
        }
      });
    }
  }, [isSimulating, simulationResults.length, bins]);

  const findBinIndex = (value: number, bins: Bin[]): number => {
    return bins.findIndex((bin) => value >= bin.start && value < bin.end);
  };

  // Check if bin meets threshold criteria for either threshold
  const meetsThreshold = (
    bin: Bin,
    threshold1: number | null,
    direction1: Direction
  ): boolean => {
    const binCenter = (bin.start + bin.end) / 2;

    if (threshold1 === null) return false;

    return direction1 === "leq"
      ? binCenter <= threshold1
      : binCenter >= threshold1;
  };

  const getBarColor = (
    isLatest: boolean,
    meetsThresholdCriteria: boolean,
    theme: string,
    isSimulating: boolean,
    isStale: boolean
  ) => {
    const staleOpacity = isStale ? 0.3 : 1.0;

    // Highlight the latest bar during simulation - this takes priority
    if (isSimulating && isLatest) {
      // Use red highlight if it meets threshold criteria
      if (threshold1Value !== null && meetsThresholdCriteria) {
        return theme === "light"
          ? `rgba(220, 38, 38, ${0.8 * staleOpacity})`
          : `rgba(248, 113, 113, ${0.8 * staleOpacity})`;
      }
      // Otherwise use blue highlight
      return `rgba(80, 150, 235, ${0.8 * staleOpacity})`;
    }

    // Threshold shading when threshold is set and bar meets criteria
    if (threshold1Value !== null && meetsThresholdCriteria) {
      return theme === "light"
        ? `rgba(220, 38, 38, ${0.3 * staleOpacity})`
        : `rgba(248, 113, 113, ${0.3 * staleOpacity})`;
    }

    // Default bar color
    return theme === "light"
      ? `rgba(66, 135, 245, ${0.4 * staleOpacity})`
      : `rgba(102, 187, 255, ${0.4 * staleOpacity})`;
  };

  // Helper to get colors for left and right sides of a split bar
  const getSplitBarColors = (
    bin: Bin,
    isLatest: boolean,
    theme: string,
    isSimulating: boolean,
    isStale: boolean,
    threshold: number,
    direction: Direction
  ): { leftColor: string; rightColor: string } => {
    const staleOpacity = isStale ? 0.3 : 1.0;

    // Determine if left and right sides meet threshold criteria
    // Left side: values from bin.start to threshold
    // Right side: values from threshold to bin.end
    // For "leq" (≤): values ≤ threshold meet criteria
    // For "geq" (≥): values ≥ threshold meet criteria
    const leftSideMeets = direction === "leq"; // All values in left side are ≤ threshold
    const rightSideMeets = direction === "geq"; // All values in right side are ≥ threshold

    // For latest bar during simulation, use highlight colors
    if (isSimulating && isLatest) {
      const leftColor = leftSideMeets
        ? theme === "light"
          ? `rgba(220, 38, 38, ${0.8 * staleOpacity})`
          : `rgba(248, 113, 113, ${0.8 * staleOpacity})`
        : `rgba(80, 150, 235, ${0.8 * staleOpacity})`;
      const rightColor = rightSideMeets
        ? theme === "light"
          ? `rgba(220, 38, 38, ${0.8 * staleOpacity})`
          : `rgba(248, 113, 113, ${0.8 * staleOpacity})`
        : `rgba(80, 150, 235, ${0.8 * staleOpacity})`;
      return { leftColor, rightColor };
    }

    // For threshold shading
    const leftColor = leftSideMeets
      ? theme === "light"
        ? `rgba(220, 38, 38, ${0.3 * staleOpacity})`
        : `rgba(248, 113, 113, ${0.3 * staleOpacity})`
      : theme === "light"
      ? `rgba(66, 135, 245, ${0.4 * staleOpacity})`
      : `rgba(102, 187, 255, ${0.4 * staleOpacity})`;
    const rightColor = rightSideMeets
      ? theme === "light"
        ? `rgba(220, 38, 38, ${0.3 * staleOpacity})`
        : `rgba(248, 113, 113, ${0.3 * staleOpacity})`
      : theme === "light"
      ? `rgba(66, 135, 245, ${0.4 * staleOpacity})`
      : `rgba(102, 187, 255, ${0.4 * staleOpacity})`;

    return { leftColor, rightColor };
  };

  // Ensure SVG gradient definitions exist
  const ensureGradientDefs = useCallback(() => {
    if (!plotRef.current) return;

    // Find or create the SVG element
    const svg = plotRef.current.querySelector("svg");
    if (!svg) return;

    // Find or create defs element
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }

    return defs;
  }, []);

  const updateBarColors = useCallback(() => {
    if (plotRef.current) {
      const bars = plotRef.current.querySelectorAll(".bars .point");
      if (bars.length === 0) return;

      const latestStatistic = simulationResults[
        simulationResults.length - 1
      ]?.getTestStatistic(selectedTestStatistic, userData.baselineColumn);
      const latestBinIndex =
        latestStatistic !== undefined
          ? findBinIndex(latestStatistic, bins)
          : -1;

      const defs = ensureGradientDefs();

      bars.forEach((bar, index) => {
        const path = bar.querySelector("path");
        if (path && bins[index]) {
          const bin = bins[index];
          const isLatest = index === latestBinIndex;

          // Check if threshold falls within this bin
          const thresholdInBin =
            threshold1Value !== null &&
            threshold1Value > bin.start &&
            threshold1Value < bin.end;

          if (thresholdInBin && defs) {
            // Calculate threshold position as percentage
            const binWidth = bin.end - bin.start;
            const thresholdPosition =
              ((threshold1Value - bin.start) / binWidth) * 100;

            // Get colors for left and right sides
            const { leftColor, rightColor } = getSplitBarColors(
              bin,
              isLatest,
              theme,
              isSimulating,
              isStale,
              threshold1Value!,
              threshold1Direction
            );

            // Create unique gradient ID for this bar
            const gradientId = `gradient-${index}`;

            // Remove existing gradient if any
            const existingGradient = defs.querySelector(`#${gradientId}`);
            if (existingGradient) {
              existingGradient.remove();
            }

            // Create SVG linear gradient
            const gradient = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "linearGradient"
            );
            gradient.setAttribute("id", gradientId);
            gradient.setAttribute("x1", "0%");
            gradient.setAttribute("y1", "0%");
            gradient.setAttribute("x2", "100%");
            gradient.setAttribute("y2", "0%");

            // Add color stops
            const stop1 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "stop"
            );
            stop1.setAttribute("offset", "0%");
            stop1.setAttribute("stop-color", leftColor);
            gradient.appendChild(stop1);

            const stop2 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "stop"
            );
            stop2.setAttribute("offset", `${thresholdPosition}%`);
            stop2.setAttribute("stop-color", leftColor);
            gradient.appendChild(stop2);

            const stop3 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "stop"
            );
            stop3.setAttribute("offset", `${thresholdPosition}%`);
            stop3.setAttribute("stop-color", rightColor);
            gradient.appendChild(stop3);

            const stop4 = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "stop"
            );
            stop4.setAttribute("offset", "100%");
            stop4.setAttribute("stop-color", rightColor);
            gradient.appendChild(stop4);

            defs.appendChild(gradient);

            // Apply gradient to path (clear style.fill to avoid conflicts)
            path.style.fill = "";
            path.setAttribute("fill", `url(#${gradientId})`);
          } else {
            // Use solid color for bars without threshold split
            const meetsThresholdCriteria = meetsThreshold(
              bin,
              threshold1Value,
              threshold1Direction
            );

            // Remove any gradient reference and use solid color
            path.removeAttribute("fill");
            path.style.fill = getBarColor(
              isLatest,
              meetsThresholdCriteria,
              theme,
              isSimulating,
              isStale
            );
          }

          path.style.zIndex = isLatest ? "1000" : "1";

          if (isLatest) {
            latestStatisticBarRef.current = path as unknown as HTMLElement;
          }
        }
      });
    }
  }, [
    bins,
    theme,
    simulationResults,
    selectedTestStatistic,
    userData.baselineColumn,
    latestStatisticBarRef,
    isStale,
    threshold1Value,
    threshold1Direction,
    isSimulating,
    ensureGradientDefs,
  ]);

  useEffect(() => {
    updateBarColors();
  }, [updateBarColors]);

  // Calculate simulation progress
  const simulationProgress = useMemo(() => {
    const current = simulationResults.length;
    const total = totalSimulations;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return { current, total, percentage };
  }, [simulationResults.length, totalSimulations]);

  return (
    <div className="flex flex-col h-full">
      {/* Warning banner when stale */}
      {isStale && (
        <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
          Results are from previous data. Run simulation again to update.
        </div>
      )}

      <div
        className={`
          flex-grow min-h-0 transition-opacity duration-200
          ${isStale ? "opacity-60" : "opacity-100"}
        `}
        ref={plotRef}
      >
        <AutoSizer>
          {({ height, width }) => (
            <Plot
              data={plotDataWithThresholds}
              layout={layout}
              config={{ responsive: true, autosizable: true }}
              style={{ width, height: height * 0.95 }}
              onAfterPlot={() => {
                addBinRangeAttributes();
                updateBarColors();
              }}
              onUpdate={() => {
                addBinRangeAttributes();
                updateBarColors();
              }}
            />
          )}
        </AutoSizer>
      </div>

      {/* Statistic label + selected test name (full-width thin row) */}
      {/* <div
        className={`
          mb-2 w-full
          bg-light-background-secondary dark:bg-dark-background-tertiary
          py-2 px-3 rounded-lg flex flex-row items-center justify-start gap-2 min-w-0
          transition-opacity duration-200
          ${isStale ? "opacity-50" : "opacity-100"}
        `}
      >
        <span className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary shrink-0">
          Statistic
        </span>
        <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary truncate">
          {testStatistics[selectedTestStatistic].name}
        </span>
      </div> */}

      {/* Cards row below plot, above threshold filter */}
      <div className="flex gap-4 mb-4 items-stretch">
        {/* Stat under null (reference under H₀) */}
        <div className="flex-1">
          <StatDisplay
            title="Stat under null"
            value={
              statisticUnderNull !== null && statisticUnderNull !== undefined
                ? statisticUnderNull.toFixed(3)
                : "—"
            }
            isStale={isStale}
          />
        </div>

        {/* Observed Statistic Card */}
        <div className="flex-1">
          <StatDisplay
            title="Observed Statistic"
            value={
              observedStatistic !== null && observedStatistic !== undefined
                ? observedStatistic.toFixed(3)
                : "—"
            }
            isStale={isStale}
          />
        </div>

        {/* Simulation Progress Card */}
        <div className="flex-1">
          <StatDisplay
            title="Simulation Progress"
            value={
              isSimulating || simulationProgress.current > 0
                ? `${simulationProgress.current} / ${simulationProgress.total}`
                : "—"
            }
            isStale={isStale}
            valueNumeric
          />
        </div>
      </div>

      <ThresholdFilter
        threshold1Direction={threshold1Direction}
        setThreshold1Direction={setThreshold1Direction}
        threshold1Input={threshold1Input}
        setThreshold1Input={setThreshold1Input}
      />
    </div>
  );
};

export default React.memo(PlotDisplay);
