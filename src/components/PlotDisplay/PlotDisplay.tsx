import React, { useCallback, useMemo, useRef, useEffect } from "react";
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
  PValueType,
} from "@/contexts/SimulationContext";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";

const Plot = dynamic<PlotParams>(() => import("react-plotly.js"), {
  ssr: false,
});

const StatDisplay: React.FC<{ title: string; value: string | number }> =
  React.memo(({ title, value }) => (
    <div className="bg-light-background-secondary dark:bg-dark-background-tertiary p-2 rounded-lg flex items-center justify-between min-w-0">
      <h4 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary truncate flex-shrink-0 mr-2">
        {title}
      </h4>
      <p className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary truncate min-w-0 flex-shrink text-right">
        {value}
      </p>
    </div>
  ));

interface Bin {
  start: number;
  end: number;
  count: number;
}

export const PlotDisplay: React.FC = () => {
  const plotRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { simulationResults, observedStatistic } = useSimulationResults();
  const {
    selectedTestStatistic,
    totalSimulations,
    pValue,
    pValueType,
    isSimulating,
  } = useSimulationState();
  const latestStatisticBarRef = useLatestStatisticBarRef();

  // const calculatePlotData = useCallback(
  //   (simulationData: number[], observedStat: number, theme: string) => {
  //     if (!simulationData?.length) {
  //       // Use observedStat to determine scale, or default if none
  //       const binSize = observedStat === 0 ? 1 : Math.abs(observedStat) / 10;
  //       const defaultRange = 2 * Math.max(5 * binSize, Math.abs(observedStat));
  //       const dummyMin = -defaultRange;
  //       const dummyMax = defaultRange;
  //       const totalBins = Math.ceil((dummyMax - dummyMin) / binSize);

  //       const dummyBins: Bin[] = Array.from({ length: totalBins }, (_, i) => ({
  //         start: dummyMin + i * binSize,
  //         end: dummyMin + (i + 1) * binSize,
  //         count: 0,
  //       }));

  //       const histogramTrace: Data = {
  //         x: dummyBins.map((bin) => (bin.start + bin.end) / 2),
  //         y: dummyBins.map((bin) => bin.count),
  //         type: "bar",
  //         marker: {
  //           color:
  //             theme === "light"
  //               ? "rgba(66, 135, 245, 0.6)"
  //               : "rgba(102, 187, 255, 0.6)",
  //           line: {
  //             color:
  //               theme === "light"
  //                 ? "rgba(66, 135, 245, 1)"
  //                 : "rgba(102, 187, 255, 1)",
  //             width: 1,
  //           },
  //         },
  //         name: "Simulated Differences",
  //       };

  //       const observedStatTrace: Data = {
  //         x: [observedStat, observedStat],
  //         y: [0, 1], // Using 1 as max since we have no counts
  //         type: "scatter",
  //         mode: "lines",
  //         line: {
  //           color:
  //             theme === "light"
  //               ? "rgba(255, 0, 0, 0.7)"
  //               : "rgba(255, 102, 102, 0.7)",
  //           width: 2,
  //         },
  //         name: "Observed Statistic",
  //       };

  //       return {
  //         plotData: [histogramTrace, observedStatTrace],
  //         minResult: dummyMin,
  //         maxResult: dummyMax,
  //         binSize,
  //         bins: dummyBins,
  //         maxCount: 0,
  //       };
  //     }

  //     // Get data range, handling case where all points are same value
  //     const dataMin = Math.min(...simulationData);
  //     const dataMax = Math.max(...simulationData);
  //     const hasSpread = dataMin !== dataMax;

  //     // Handle case where observedStat is 0
  //     const binSize =
  //       observedStat === 0
  //         ? 1 // Use unit binSize if observedStat is 0
  //         : Math.abs(observedStat) /
  //           Math.ceil(
  //             (2.75 * Math.abs(observedStat)) /
  //               Math.max(Math.abs(dataMax), Math.abs(dataMin))
  //           );

  //     // If no spread in data, create artificial spread around the single value
  //     const effectiveMin = hasSpread ? dataMin : dataMin - binSize;
  //     const effectiveMax = hasSpread ? dataMax : dataMax + binSize;

  //     // Step 3: Extend range to nearest bin edge, ensuring we include ±observedStat
  //     const adjustedMin =
  //       Math.floor(Math.min(effectiveMin, -observedStat) / binSize) * binSize;
  //     const adjustedMax =
  //       Math.ceil(Math.max(effectiveMax, observedStat) / binSize) * binSize;

  //     // Step 4: Calculate number of bins needed
  //     const totalBins = Math.ceil((adjustedMax - adjustedMin) / binSize);

  //     // Step 5: Create bins
  //     const bins: Bin[] = Array.from({ length: totalBins }, (_, i) => ({
  //       start: adjustedMin + i * binSize,
  //       end: adjustedMin + (i + 1) * binSize,
  //       count: 0,
  //     }));

  //     // Detailed bin edge checking
  //     const binStarts = bins.map((bin) => bin.start);
  //     const positiveDiffs = binStarts.map((start) =>
  //       Math.abs(start - observedStat)
  //     );
  //     const negativeDiffs = binStarts.map((start) =>
  //       Math.abs(start + observedStat)
  //     );

  //     const closestPositive = Math.min(...positiveDiffs);
  //     const closestNegative = Math.min(...negativeDiffs);

  //     console.log("Edge checking:", {
  //       observedStat,
  //       negativeObservedStat: -observedStat,
  //       binStarts,
  //       closestPositiveEdge: binStarts[positiveDiffs.indexOf(closestPositive)],
  //       distanceToPositive: closestPositive,
  //       closestNegativeEdge: binStarts[negativeDiffs.indexOf(closestNegative)],
  //       distanceToNegative: closestNegative,
  //     });

  //     // Verify both +observedStat and -observedStat fall on bin edges
  //     if (process.env.NODE_ENV === "development") {
  //       const hasPositiveEdge = bins.some(
  //         (bin) =>
  //           Math.abs(bin.start - observedStat) < 1e-10 ||
  //           Math.abs(bin.end - observedStat) < 1e-10
  //       );
  //       const hasNegativeEdge = bins.some(
  //         (bin) =>
  //           Math.abs(bin.start + observedStat) < 1e-10 ||
  //           Math.abs(bin.end + observedStat) < 1e-10
  //       );
  //       console.assert(
  //         hasPositiveEdge && hasNegativeEdge,
  //         "Observed statistic values should fall on bin edges",
  //         {
  //           observedStat,
  //           negativeObservedStat: -observedStat,
  //           binSize,
  //           binStarts,
  //           closestPositiveEdge:
  //             binStarts[positiveDiffs.indexOf(closestPositive)],
  //           distanceToPositive: closestPositive,
  //           closestNegativeEdge:
  //             binStarts[negativeDiffs.indexOf(closestNegative)],
  //           distanceToNegative: closestNegative,
  //           adjustedMin,
  //           adjustedMax,
  //           totalBins,
  //         }
  //       );
  //     }

  //     simulationData.forEach((value) => {
  //       const binIndex = Math.min(
  //         Math.floor((value - adjustedMin) / binSize),
  //         totalBins - 1
  //       );
  //       if (binIndex >= 0 && bins[binIndex]) {
  //         bins[binIndex].count++;
  //       }
  //     });

  //     const histogramTrace: Data = {
  //       x: bins.map((bin) => (bin.start + bin.end) / 2),
  //       y: bins.map((bin) => bin.count),
  //       type: "bar",
  //       marker: {
  //         color:
  //           theme === "light"
  //             ? "rgba(66, 135, 245, 0.6)"
  //             : "rgba(102, 187, 255, 0.6)",
  //         line: {
  //           color:
  //             theme === "light"
  //               ? "rgba(66, 135, 245, 1)"
  //               : "rgba(102, 187, 255, 1)",
  //           width: 1,
  //         },
  //       },
  //       name: "Simulated Differences",
  //     };

  //     const maxCount = Math.max(...bins.map((bin) => bin.count));

  //     const observedStatTrace: Data = {
  //       x: [observedStat, observedStat],
  //       y: [0, maxCount + 1],
  //       type: "scatter",
  //       mode: "lines",
  //       line: {
  //         color:
  //           theme === "light"
  //             ? "rgba(255, 0, 0, 0.7)"
  //             : "rgba(255, 102, 102, 0.7)",
  //         width: 2,
  //       },
  //       name: "Observed Statistic",
  //     };

  //     return {
  //       plotData: [histogramTrace, observedStatTrace],
  //       minResult: adjustedMin,
  //       maxResult: adjustedMax,
  //       binSize,
  //       bins,
  //       maxCount,
  //     };
  //   },
  //   [isSimulating, simulationResults.length, selectedTestStatistic]
  // );

  const calculatePlotData = useCallback(
    (simulationData: number[], observedStat: number, theme: string) => {
      const isPositiveOnly =
        testStatistics[selectedTestStatistic].alwaysPositive;

      if (!simulationData?.length) {
        // Initialize empty plot with appropriate scale
        const binSize = observedStat === 0 ? 1 : Math.abs(observedStat) / 10;
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
                ? "rgba(66, 135, 245, 0.6)"
                : "rgba(102, 187, 255, 0.6)",
            line: {
              color:
                theme === "light"
                  ? "rgba(66, 135, 245, 1)"
                  : "rgba(102, 187, 255, 1)",
              width: 1,
            },
          },
          name: "Simulated Differences",
        };

        const observedStatTrace: Data = {
          x: [observedStat, observedStat],
          y: [0, 1],
          type: "scatter",
          mode: "lines",
          line: {
            color:
              theme === "light"
                ? "rgba(255, 0, 0, 0.7)"
                : "rgba(255, 102, 102, 0.7)",
            width: 2,
          },
          name: "Observed Statistic",
        };

        return {
          plotData: [histogramTrace, observedStatTrace],
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

      // Calculate bin size based on data and observed statistic
      let binSize =
        observedStat === 0
          ? 1
          : Math.abs(observedStat) /
            Math.ceil(
              ((isPositiveOnly ? 3 : 3) * Math.abs(observedStat)) /
                Math.max(Math.abs(dataMax), Math.abs(dataMin))
            );

      // Determine range
      const effectiveMin = hasSpread ? dataMin : dataMin - binSize;
      const effectiveMax = hasSpread ? dataMax : dataMax + binSize;

      // Calculate adjusted range
      let adjustedMin: number;
      let adjustedMax: number;

      if (isPositiveOnly) {
        // For positive-only statistics, start from 0 and extend past the maximum
        adjustedMin = 0;
        adjustedMax =
          Math.ceil(Math.max(effectiveMax, observedStat) / binSize) * binSize;
      } else {
        // For two-tailed statistics, ensure symmetry and bin alignment
        adjustedMin =
          Math.floor(Math.min(effectiveMin, -observedStat) / binSize) * binSize;
        adjustedMax =
          Math.ceil(Math.max(effectiveMax, observedStat) / binSize) * binSize;

        // Verify bin alignment for observed statistic
        if (process.env.NODE_ENV === "development") {
          const positiveObsStatBin =
            Math.round(observedStat / binSize) * binSize;
          const negativeObsStatBin =
            Math.round(-observedStat / binSize) * binSize;
          console.assert(
            Math.abs(positiveObsStatBin - observedStat) < 1e-10 &&
              Math.abs(negativeObsStatBin + observedStat) < 1e-10,
            "Observed statistic values should fall on bin edges",
            { observedStat, binSize, positiveObsStatBin, negativeObsStatBin }
          );
        }
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
              ? "rgba(66, 135, 245, 0.6)"
              : "rgba(102, 187, 255, 0.6)",
          line: {
            color:
              theme === "light"
                ? "rgba(66, 135, 245, 1)"
                : "rgba(102, 187, 255, 1)",
            width: 1,
          },
        },
        name: "Simulated Differences",
      };

      const maxCount = Math.max(...bins.map((bin) => bin.count));

      // Create observed statistic line
      const observedStatTrace: Data = {
        x: [observedStat, observedStat],
        y: [0, maxCount + 1],
        type: "scatter",
        mode: "lines",
        line: {
          color:
            theme === "light"
              ? "rgba(255, 0, 0, 0.7)"
              : "rgba(255, 102, 102, 0.7)",
          width: 2,
        },
        name: "Observed Statistic",
      };

      return {
        plotData: [histogramTrace, observedStatTrace],
        minResult: adjustedMin,
        maxResult: adjustedMax,
        binSize,
        bins,
        maxCount,
      };
    },
    [isSimulating, simulationResults.length, selectedTestStatistic]
  );

  const simulationData = useMemo(
    () =>
      simulationResults.map((result) =>
        result.getTestStatistic(selectedTestStatistic)
      ),
    [isSimulating, simulationResults.length, selectedTestStatistic]
  );

  const { plotData, minResult, maxResult, binSize, bins, maxCount } = useMemo(
    () => calculatePlotData(simulationData, observedStatistic || 0, theme),
    [
      calculatePlotData,
      simulationData,
      observedStatistic,
      theme,
      isSimulating,
      simulationResults.length,
    ]
  );

  const layout: Partial<Layout> = useMemo(
    () => ({
      autosize: true,
      xaxis: {
        title: testStatistics[selectedTestStatistic].name,
        range: [minResult - 0.5 * binSize, maxResult + 0.5 * binSize],
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
        range: [0, maxCount + 1],
      },
      bargap: 0.05,
      showlegend: true,
      legend: {
        x: 0.7,
        y: 1,
        font: { color: theme === "light" ? "black" : "white" },
      },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 45, r: 35, b: 35, t: 0 },
    }),
    [selectedTestStatistic, theme, minResult, maxResult, binSize, maxCount]
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

  const isExtremeBin = (
    bin: Bin,
    observedStat: number,
    pValueType: PValueType
  ): boolean => {
    const binCenter = (bin.start + bin.end) / 2;
    switch (pValueType) {
      case "two-tailed":
        return Math.abs(binCenter) >= Math.abs(observedStat);
      case "left-tailed":
        return binCenter <= observedStat;
      case "right-tailed":
        return binCenter >= observedStat;
    }
  };

  const getBarColor = (
    isExtreme: boolean,
    isLatest: boolean,
    theme: string,
    isSimulating: boolean
  ) => {
    if (isSimulating && isLatest && isExtreme) {
      return "rgba(255, 100, 100, 0.8)";
    } else if (isSimulating && isLatest) {
      return "rgba(80, 150, 235, 0.8)";
    } else if (isExtreme) {
      return "rgba(255, 0, 0, 0.15)";
    } else {
      return theme === "light"
        ? "rgba(66, 135, 245, 0.4)"
        : "rgba(102, 187, 255, 0.4)";
    }
  };

  const updateBarColors = useCallback(() => {
    if (plotRef.current && observedStatistic !== null) {
      const bars = plotRef.current.querySelectorAll(".bars .point");
      if (bars.length === 0) return;

      const latestStatistic = simulationResults[
        simulationResults.length - 1
      ]?.getTestStatistic(selectedTestStatistic);
      const latestBinIndex =
        latestStatistic !== undefined
          ? findBinIndex(latestStatistic, bins)
          : -1;

      bars.forEach((bar, index) => {
        const path = bar.querySelector("path");
        if (path && bins[index]) {
          const isExtreme = isExtremeBin(
            bins[index],
            observedStatistic,
            pValueType
          );
          const isLatest = index === latestBinIndex;

          path.style.fill = getBarColor(
            isExtreme,
            isLatest,
            theme,
            isSimulating
          );
          path.style.zIndex = isLatest ? "1000" : "1";

          if (isLatest) {
            latestStatisticBarRef.current = path as unknown as HTMLElement;
          }
        }
      });
    }
  }, [
    bins,
    observedStatistic,
    pValueType,
    theme,
    simulationResults,
    selectedTestStatistic,
    latestStatisticBarRef,
  ]);

  // Effect still needed for reactive updates
  useEffect(() => {
    updateBarColors();
  }, [updateBarColors]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow min-h-0" ref={plotRef}>
        <AutoSizer>
          {({ height, width }) => (
            <Plot
              data={plotData}
              layout={layout}
              config={{ responsive: true, autosizable: true }}
              style={{ width, height: height * 0.85 }}
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
      <div className="grid grid-cols-3 gap-4">
        <StatDisplay
          title="Observed Statistic"
          value={
            observedStatistic !== null ? observedStatistic.toFixed(4) : "N/A"
          }
        />
        <StatDisplay
          title="P-value"
          value={pValue !== null && !isNaN(pValue) ? pValue.toFixed(4) : "N/A"}
        />
        <StatDisplay
          title="Current Progress"
          value={`${simulationResults.length} / ${totalSimulations}`}
        />
      </div>
    </div>
  );
};

export default React.memo(PlotDisplay);
