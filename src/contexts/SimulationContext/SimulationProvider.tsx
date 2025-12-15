import React, {
  createContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import { simulationReducer } from "./reducer";
import * as actions from "./actions";
import {
  SimulationContextType,
  SimulationState,
  ActionResult,
  DataRow,
  SimulationResult,
  PValueType,
  WarningCondition,
  UserDataState,
} from "./types";
import {
  createActionResult,
  calculatePValue,
  shuffleRowAssignments,
  filterValidRows,
  speedToDuration,
  dataSnapshotsMatch,
  getCompleteRows,
} from "./utils";
import { testStatistics } from "./testStatistics";
import { INITIAL_STATE, DEFAULT_COLUMN_COLORS } from "./constants";
import { i } from "mathjs";

export const SimulationContext = createContext<
  SimulationContextType | undefined
>(undefined);

export const SimulationProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(simulationReducer, INITIAL_STATE);
  const simulationSpeedRef = useRef<number>(state.settings.simulationSpeed);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const latestStatisticBarRef = useRef<HTMLElement>(null);

  const dispatchWithResult = useCallback(
    <T extends any[]>(
        actionCreator: (
          ...args: T
        ) => ReturnType<(typeof actions)[keyof typeof actions]>,
        warningConditions?: WarningCondition[]
      ) =>
      (...args: T): ActionResult => {
        const action = actionCreator(...args);

        dispatch(action);

        // Access the updated state after dispatch
        const updatedState = simulationReducer(state, action);

        if (updatedState.error) {
          console.error(
            "Error in action dispatch:",
            updatedState.error.message
          );
          return {
            success: false,
            error: updatedState.error.message,
          };
        }

        // Check for warnings after successful dispatch
        const activeWarnings =
          warningConditions?.filter((condition) =>
            condition.check(updatedState)
          ) || [];
        const warningMessage =
          activeWarnings.length > 0
            ? activeWarnings.map((warning) => warning.message).join("; ")
            : undefined;

        return {
          success: true,
          warning: warningMessage,
        };
      },
    [state, dispatch]
  );

  const setSimulationSpeed = useCallback((speed: number): ActionResult => {
    return createActionResult(() => {
      simulationSpeedRef.current = speed;
      dispatch(actions.setSimulationSpeed(speed));
    });
  }, []);

  const setUserData = dispatchWithResult(actions.setUserData);
  const resetUserData = dispatchWithResult(actions.resetUserData);
  const emptyUserData = dispatchWithResult(actions.emptyUserData);

  const addRow = dispatchWithResult(actions.addRow, [
    {
      check: () => state.data.userData.rows.length > 50,
      message: "Adding too many rows may impact performance",
    },
    {
      check: () => state.data.userData.rows.length > 100,
      message: "Extremely large datasets may cause stability issues",
    },
  ]);

  const deleteRow = dispatchWithResult(actions.deleteRow);
  const updateCell = dispatchWithResult(actions.updateCell);
  const setAssignment = dispatchWithResult(actions.setAssignment);
  const setBlock = dispatchWithResult(actions.setBlock);
  const renameColumn = dispatchWithResult(actions.renameColumn);
  const addColumn = dispatchWithResult(actions.addColumn);
  const setBaselineColumn = dispatchWithResult(actions.setBaselineColumn);
  const removeColumn = dispatchWithResult(actions.removeColumn);
  const setBlockingEnabled = dispatchWithResult(actions.setBlockingEnabled);
  const setSelectedTestStatistic = dispatchWithResult(
    actions.setSelectedTestStatistic
  );
  const setTotalSimulations = dispatchWithResult(actions.setTotalSimulations);
  const setPValueType = dispatchWithResult(actions.setPValueType);
  const clearSimulationData = dispatchWithResult(actions.clearSimulationData);
  const undo = dispatchWithResult(actions.undo);
  const redo = dispatchWithResult(actions.redo);
  const startSimulation = dispatchWithResult(actions.startSimulation);

  const pauseSimulation = dispatchWithResult(actions.pauseSimulation);

  const blockingEnabledRef = useRef(state.data.userData.blockingEnabled);

  // Update ref when value changes
  useEffect(() => {
    blockingEnabledRef.current = state.data.userData.blockingEnabled;
  }, [state.data.userData.blockingEnabled]);

  const simulate = useCallback((data: DataRow[]): SimulationResult => {
    const validData = filterValidRows(data);
    const shuffledData = shuffleRowAssignments(
      validData,
      blockingEnabledRef.current // Read from ref instead
    );
    return new SimulationResult(shuffledData);
  }, []);

  const dynamicDelay = useCallback((): Promise<void> => {
    const adjustedDelay =
      simulationSpeedRef.current != 100
        ? speedToDuration(simulationSpeedRef.current)
        : 0;
    return new Promise((resolve, reject) => {
      timeoutIdRef.current = window.setTimeout(() => {
        timeoutIdRef.current = null;
        resolve();
      }, Math.max(0, adjustedDelay));
    });
  }, []);

  const runSimulation = useCallback(
    async (
      data: DataRow[],
      iterations: number,
      existingResults: SimulationResult[],
      abortSignal: AbortSignal,
      onProgress: (
        simulationResults: SimulationResult[],
        pValue: number
      ) => void
    ): Promise<{ results: SimulationResult[]; aborted: boolean }> => {
      let simulationResults = [...existingResults];

      for (let i = simulationResults.length; i < iterations; i++) {
        if (abortSignal.aborted) {
          return { results: simulationResults, aborted: true };
        }

        const result = simulate(data);
        simulationResults.push(result);

        const currentPValue = calculatePValue(
          state.results.observedStatistic!,
          simulationResults,
          state.settings.selectedTestStatistic,
          state.settings.pValueType
        );

        onProgress(simulationResults, currentPValue);

        try {
          await dynamicDelay();
        } catch (error) {
          if (abortSignal.aborted) {
            return { results: simulationResults, aborted: true };
          }
          throw error;
        }
      }

      return { results: simulationResults, aborted: false };
    },
    [
      simulate,
      state.results.observedStatistic,
      state.settings.selectedTestStatistic,
      state.settings.pValueType,
      dynamicDelay,
    ]
  );

  useEffect(() => {
    if (state.control.isSimulating && !abortControllerRef.current) {
      abortControllerRef.current = new AbortController();

      const rowsCopy = state.data.userData.rows.map((row) => ({ ...row }));

      runSimulation(
        rowsCopy,
        state.settings.totalSimulations,
        state.results.simulationResults,
        abortControllerRef.current.signal,
        (simulationResults, pValue) => {
          dispatch(actions.setSimulationResults(simulationResults));
          dispatch(actions.setPValue(pValue));
        }
      )
        .then(({ results, aborted }) => {
          if (!aborted) {
            dispatch(actions.setSimulationResults(results));
            const finalPValue = calculatePValue(
              state.results.observedStatistic!,
              results,
              state.settings.selectedTestStatistic,
              state.settings.pValueType
            );
            dispatch(actions.setPValue(finalPValue));
          }
        })
        .catch((error) => {
          console.error("Simulation error:", error);
        })
        .finally(() => {
          dispatch(actions.pauseSimulation());
          abortControllerRef.current = null;
        });
    } else if (!state.control.isSimulating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    }
  }, [
    state.control.isSimulating,
    state.data.userData.rows,
    state.settings.totalSimulations,
    state.results.simulationResults,
    state.results.observedStatistic,
    state.settings.selectedTestStatistic,
    state.settings.pValueType,
    runSimulation,
  ]);

  useEffect(() => {
    const newObservedStatistic = testStatistics[
      state.settings.selectedTestStatistic
    ].function(state.data.userData.rows, state.data.userData.baselineColumn);

    dispatch(actions.setObservedStatistic(newObservedStatistic));

    if (state.results.simulationResults.length > 0) {
      const newPValue = calculatePValue(
        newObservedStatistic,
        state.results.simulationResults,
        state.settings.selectedTestStatistic,
        state.settings.pValueType
      );
      dispatch(actions.setPValue(newPValue));
    }
  }, [
    state.data.userData.rows,
    state.data.userData.baselineColumn,
    state.settings.selectedTestStatistic,
    state.settings.pValueType,
    state.results.simulationResults,
  ]);

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const pastedData = event.clipboardData?.getData("text");

      if (pastedData) {
        try {
          // Attempt to parse the data
          console.log("pastedData", pastedData);
          const newUserData = parseCSVData(pastedData);

          // If parsing is successful, prevent default and update state
          event.preventDefault();
          dispatch(actions.setUserData(newUserData));
        } catch (error) {
          // If parsing fails, allow default paste behavior
          console.error("Failed to parse pasted data:", error);
          // Default paste behavior will occur
        }
      }
    },
    [dispatch]
  );

  const parseCSVData = (data: string): UserDataState => {
    // Step 1: Split into lines
    const lines = data
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new Error("No data found.");
    }

    // Step 2: Detect delimiter
    const delimiter = lines[0].includes("\t") ? "\t" : ",";

    // Step 3: Split into columns and remove header if present
    let startIndex = 0;
    const firstLineTokens = lines[0].split(delimiter);
    if (
      firstLineTokens.every(
        (item) => item.trim().length > 0 && isNaN(parseFloat(item))
      )
    ) {
      startIndex = 1;
    }

    // Step 4: Parse all lines into columns
    const rawColumns: string[][] = Array(2)
      .fill(null)
      .map(() => []);
    lines.slice(startIndex).forEach((line) => {
      const tokens = line.split(delimiter).map((t) => t.trim());
      if (tokens.length !== 2) {
        throw new Error(`Invalid line format: ${line}`);
      }
      rawColumns[0].push(tokens[0]);
      rawColumns[1].push(tokens[1]);
    });

    // Step 5: Analyze columns to determine which is assignment and which is value
    const columnAnalysis = rawColumns.map((column, idx) => {
      const parsedValues = column.map((val) => {
        const num = parseFloat(val);
        return {
          original: val,
          isNumeric: !isNaN(num),
          value: !isNaN(num) ? num : val,
        };
      });

      return {
        index: idx,
        allNumeric: parsedValues.every((v) => v.isNumeric),
        uniqueValues: new Set(parsedValues.map((v) => v.value)).size,
        parsedValues,
      };
    });

    // Step 6: Determine which column is assignments
    let assignmentColumnIndex: number;
    let valueColumnIndex: number;

    if (!columnAnalysis[0].allNumeric) {
      assignmentColumnIndex = 0;
      valueColumnIndex = 1;
    } else if (!columnAnalysis[1].allNumeric) {
      assignmentColumnIndex = 1;
      valueColumnIndex = 0;
    } else {
      // Both columns are numeric - use the one with smaller domain as assignments
      assignmentColumnIndex =
        columnAnalysis[0].uniqueValues <= columnAnalysis[1].uniqueValues
          ? 0
          : 1;
      valueColumnIndex = 1 - assignmentColumnIndex;
    }

    // Step 7: Create parsed data structure
    const parsedLines = lines.slice(startIndex).map((line) => {
      const tokens = line.split(delimiter).map((t) => t.trim());
      const assignment = tokens[assignmentColumnIndex];
      const valueStr = tokens[valueColumnIndex];
      const value = parseFloat(valueStr);

      if (isNaN(value)) {
        throw new Error(`Invalid numeric value: ${valueStr}`);
      }

      return [
        {
          value,
          assignment: assignment,
        },
      ];
    });

    // Step 8: Create columns based on unique assignments
    const uniqueAssignments = Array.from(
      new Set(parsedLines.flat().map((item) => item.assignment))
    );
    const defaultColors = DEFAULT_COLUMN_COLORS;
    const columns = uniqueAssignments.map((assignment, index) => ({
      name: assignment.toString(), // Convert to string in case it's numeric
      color: defaultColors[index % defaultColors.length],
    }));

    // Step 9: Create rows with the parsed data
    const rows: DataRow[] = parsedLines.map((line, index) => {
      const data = Array(columns.length).fill(null);
      let assignment: number | null = null;
      line.forEach((item) => {
        const columnIndex = columns.findIndex(
          (col) => col.name === item.assignment.toString()
        );
        if (columnIndex !== -1) {
          data[columnIndex] = item.value;
          if (assignment === null) {
            assignment = columnIndex;
          }
        }
      });
      return { data, assignment, block: null, assignmentOriginalIndex: index };
    });

    // Step 10: Validation
    if (rows.length === 0) {
      throw new Error("No valid data rows found.");
    }
    if (columns.length === 0) {
      throw new Error("At least one column is required.");
    }

    // Add empty row for new entries
    rows.push({
      data: Array(columns.length).fill(null),
      assignment: null,
      block: null,
      assignmentOriginalIndex: null,
    });

    return {
      rows,
      columns,
      colorStack: defaultColors.slice(columns.length),
      baselineColumn: 0,
      blockingEnabled: false,
    };
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const simulationDataMatchesCurrent = useMemo(() => {
    if (state.results.simulationResults.length === 0) {
      return true;
    }
    if (!state.results.simulationDataSnapshot) {
      return false;
    }
    const currentCompleteRows = getCompleteRows(state.data.userData.rows);
    const currentSnapshot = {
      rows: currentCompleteRows,
      baselineColumn: state.data.userData.baselineColumn,
      blockingEnabled: state.data.userData.blockingEnabled,
    };
    return dataSnapshotsMatch(
      state.results.simulationDataSnapshot,
      currentSnapshot
    );
  }, [
    state.results.simulationResults.length,
    state.results.simulationDataSnapshot,
    state.data.userData,
    state.data.userData.baselineColumn,
    state.data.userData.blockingEnabled,
  ]);

  const contextValue: SimulationContextType = {
    data: {
      ...state.data,
      setUserData,
      resetUserData,
      emptyUserData,
      addRow,
      deleteRow,
      updateCell,
      setAssignment,
      setBlock,
      renameColumn,
      addColumn,
      removeColumn,
      setBaselineColumn,
      setBlockingEnabled,
    },
    settings: {
      ...state.settings,
      setSimulationSpeed,
      setSelectedTestStatistic,
      setTotalSimulations,
      setPValueType,
    },
    control: {
      ...state.control,
      startSimulation,
      pauseSimulation,
      clearSimulationData,
    },
    results: {
      ...state.results, // This is SimulationResultsState
      simulationDataMatchesCurrent,
    },
    history: {
      ...state.history,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      undo,
      redo,
    },
    latestStatisticBarRef,
    error: state.error,
  };

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
};
