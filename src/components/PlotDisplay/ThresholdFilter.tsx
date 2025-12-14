import React, { useMemo } from "react";
import {
  useSimulationState,
  useSimulationResults,
} from "@/contexts/SimulationContext";

export type Direction = "leq" | "geq";

interface ThresholdFilterProps {
  threshold1Direction: Direction;
  setThreshold1Direction: (direction: Direction) => void;
  threshold1Input: string;
  setThreshold1Input: (value: string) => void;
}

export const ThresholdFilter: React.FC<ThresholdFilterProps> = ({
  threshold1Direction,
  setThreshold1Direction,
  threshold1Input,
  setThreshold1Input,
}) => {
  const { simulationResults, simulationDataMatchesCurrent } =
    useSimulationResults();
  const { userData, selectedTestStatistic } = useSimulationState();

  // Determine if results are stale
  const isStale = simulationResults.length > 0 && !simulationDataMatchesCurrent;

  // Calculate combined count for both thresholds (OR condition)
  const { count, percentage } = useMemo(() => {
    const threshold1 = parseFloat(threshold1Input);

    // Return empty state if no valid input or no results
    const hasThreshold1 = !isNaN(threshold1);

    if (!hasThreshold1 || simulationResults.length === 0) {
      return { count: 0, percentage: 0 };
    }

    // Get all simulated statistics
    const simulationData = simulationResults.map((result) =>
      result.getTestStatistic(selectedTestStatistic, userData.baselineColumn)
    );

    // Count how many meet the condition
    const meetingCriteria = simulationData.filter((value) =>
      threshold1Direction === "leq" ? value <= threshold1 : value >= threshold1
    );

    const count = meetingCriteria.length;
    const percentage = (count / simulationData.length) * 100;

    return { count, percentage };
  }, [
    threshold1Input,
    threshold1Direction,
    simulationResults,
    simulationResults.length,
    selectedTestStatistic,
    userData.baselineColumn,
  ]);

  const handleThreshold1InputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setThreshold1Input(e.target.value);
  };

  const handleThreshold1DirectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setThreshold1Direction(e.target.value as Direction);
  };

  return (
    <div
      className={`
        bg-light-background-secondary dark:bg-dark-background-tertiary 
        p-4 rounded-lg transition-opacity duration-200
        ${isStale ? "opacity-50" : "opacity-100"}
      `}
    >
      <div className="flex items-center gap-2">
        {/* Label */}
        <span className="text-base font-semibold text-light-text-secondary dark:text-dark-text-secondary">
          Count simulated statistics
        </span>

        {/* Conditions - stacked vertically */}
        <div className="flex items-center gap-1">
          <select
            value={threshold1Direction}
            onChange={handleThreshold1DirectionChange}
            className="px-2 py-2 rounded bg-light-background-primary dark:bg-dark-background-secondary 
                     text-light-text-primary dark:text-dark-text-primary
                     border border-light-border dark:border-dark-border
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     text-xl font-semibold"
          >
            <option value="leq">≤</option>
            <option value="geq">≥</option>
          </select>

          <input
            type="text"
            value={threshold1Input}
            onChange={handleThreshold1InputChange}
            className="px-2 py-2 rounded bg-light-background-primary dark:bg-dark-background-secondary 
                     text-light-text-primary dark:text-dark-text-primary
                     border border-light-border dark:border-dark-border
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     w-16 text-base"
          />
        </div>

        {/* Equals and result */}
        <span className="text-base font-semibold text-light-text-secondary dark:text-dark-text-secondary">
          =
        </span>

        <span className="flex items-center gap-1 text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          {threshold1Input && simulationResults.length > 0 ? (
            <>
              <span>{count}</span>
              <span className="text-base font-normal text-light-text-secondary dark:text-dark-text-secondary">
                / {simulationResults.length}
              </span>
            </>
          ) : (
            "—"
          )}
        </span>

        {threshold1Input && simulationResults.length > 0 && (
          <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            ({percentage.toFixed(2)}%)
          </span>
        )}
      </div>
    </div>
  );
};

export default ThresholdFilter;
