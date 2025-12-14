// DataInput.tsx
"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  useSimulationData,
  useSimulationState,
  useSimulationSettings,
  DataRow,
  Column,
  calculateColumnAverages,
  calculateColumnStandardDeviations,
  emptyRow,
  speedToDuration,
  useLatestStatisticBarRef,
} from "@/contexts/SimulationContext";
import { Icons } from "../common/Icons";
import { ColumnHeader } from "./ColumnHeader";
import { motion } from "framer-motion";
import { Overlay } from "./Overlay";
import DataControls from "./DataControls";
import InputCell from "./InputCell";
import { Flipper, Flipped } from "react-flip-toolkit";
import { Tooltip } from "../common/Tooltip";

interface ColumnAveragesProps {
  averages: (number | null)[];
  standardDeviations: (number | null)[];
  columnColors: string[];
  showBlocks: boolean;
}

const ColumnAverages: React.FC<ColumnAveragesProps> = ({
  averages,
  standardDeviations,
  columnColors,
  showBlocks,
}) => (
  <div className="flex flex-col bg-light-background-secondary dark:bg-dark-background-secondary border-t-2 border-light-primary dark:border-dark-primary">
    <div className="flex items-stretch h-10">
      <div
        className="flex-shrink-0 flex items-center justify-center font-medium"
        style={{ width: "4rem" }}
      >
        Avg
      </div>
      <div className="flex-grow flex">
        {averages.map((average, index) => (
          <div
            key={index}
            className={`flex-1 flex items-center justify-center font-medium ${columnColors[index]}`}
          >
            {average !== null ? (
              <>
                <span className="mr-1">
                  x̄<sub>{index + 1}</sub>=
                </span>
                {average.toFixed(2)}
              </>
            ) : (
              "--"
            )}
          </div>
        ))}
      </div>
      {showBlocks && <div className="w-24 flex-shrink-0" />}
      <div className="w-14 flex-shrink-0" />
    </div>
    <div className="flex items-stretch h-10 -mt-2">
      <div
        className="flex-shrink-0 flex items-center justify-center font-medium"
        style={{ width: "4rem" }}
      >
        SD
      </div>
      <div className="flex-grow flex">
        {standardDeviations.map((stdev, index) => (
          <div
            key={index}
            className={`flex-1 flex items-center justify-center font-medium ${columnColors[index]}`}
          >
            {stdev !== null ? (
              <>
                <span className="mr-1">
                  s<sub>{index + 1}</sub>=
                </span>
                {stdev.toFixed(2)}
              </>
            ) : (
              "--"
            )}
          </div>
        ))}
      </div>
      {showBlocks && <div className="w-24 flex-shrink-0" />}
      <div className="w-14 flex-shrink-0" />
    </div>
  </div>
);

interface TableRowProps {
  row: DataRow;
  index: number;
  updateCell: (
    rowIndex: number,
    columnIndex: number,
    value: number | null
  ) => void;
  setAssignment: (rowIndex: number, assignment: number | null) => void;
  setBlock: (rowIndex: number, block: string | null) => void;
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  isUnactivated: boolean;
  toggleCollapse?: () => void;
  isCollapsed?: boolean;
  columns: Column[];
  showBlocks: boolean;
  totalRows: number;
  duration?: number;
  isSimulating: boolean;
  collectionPoint: { x: number; y: number };
  triggerPhantom: boolean;
  onNavigation: (
    direction: "up" | "down" | "left" | "right" | "tab" | "shiftTab" | "enter",
    rowIndex: number,
    columnIndex: number
  ) => void;
  disableAnimations: boolean;
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  updateCell,
  setAssignment,
  setBlock,
  addRow,
  deleteRow,
  isUnactivated,
  toggleCollapse,
  isCollapsed,
  columns,
  showBlocks,
  totalRows,
  duration = 0.5,
  isSimulating,
  collectionPoint,
  triggerPhantom,
  onNavigation,
  disableAnimations,
}) => {
  const assignmentColor =
    row.assignment !== null
      ? columns[row.assignment]?.color.replace("text-", "bg-")
      : "";

  const handleAssignmentIndicatorClick = () => {
    if (isSimulating || isUnactivated) return;

    // Cycle through assignments: null → 0 → 1 → ... → (columns.length - 1) → 0
    if (row.assignment === null) {
      setAssignment(index, 0);
    } else if (row.assignment < columns.length - 1) {
      setAssignment(index, row.assignment + 1);
    } else {
      setAssignment(index, 0);
    }
  };

  return (
    <div
      className={`flex items-stretch w-full h-12 py-1 bg-light-background dark:bg-dark-background border-b border-light-background-tertiary dark:border-dark-background-tertiary ${
        isUnactivated ? "sticky bottom-0" : ""
      }`}
    >
      <div
        className="flex items-center justify-center flex-shrink-0 text-light-text-secondary dark:text-dark-text-secondary relative"
        style={{ width: "4rem" }}
      >
        {row.assignment !== null && !isUnactivated && !disableAnimations && (
          <Flipped flipId={row.assignmentOriginalIndex || index}>
            <div
              className={`absolute w-8 h-8 rounded-md ${assignmentColor} opacity-30 cursor-pointer hover:opacity-50 transition-opacity`}
              onClick={handleAssignmentIndicatorClick}
              style={{ pointerEvents: "auto" }}
            />
          </Flipped>
        )}
        {row.assignment !== null && !isUnactivated && disableAnimations && (
          <div
            className={`absolute w-8 h-8 rounded-md ${assignmentColor} opacity-30 cursor-pointer hover:opacity-50 transition-opacity`}
            onClick={handleAssignmentIndicatorClick}
            style={{ pointerEvents: "auto" }}
          />
        )}
        {isUnactivated && toggleCollapse ? (
          <button
            onClick={toggleCollapse}
            className="focus:outline-none hover:opacity-80 transition-opacity relative z-10"
            aria-label={isCollapsed ? "Expand rows" : "Collapse rows"}
            disabled={isSimulating}
          >
            {isCollapsed ? (
              <Icons.Expand size={4} />
            ) : (
              <Icons.Collapse size={4} />
            )}
          </button>
        ) : (
          <span
            className={`relative z-10 ${
              row.assignment === null && !isSimulating
                ? "cursor-pointer hover:opacity-80 transition-opacity"
                : ""
            }`}
            style={{
              pointerEvents: row.assignment !== null ? "none" : "auto",
            }}
            onClick={
              row.assignment === null && !isSimulating
                ? handleAssignmentIndicatorClick
                : undefined
            }
          >
            {index + 1}
          </span>
        )}
      </div>

      <div className="flex-grow h-full z-0">
        <Overlay
          assignment={row.assignment}
          setAssignment={(assignment) =>
            !isSimulating && setAssignment(index, assignment)
          }
          children={row.data.map((cellValue, cellIndex) => (
            <InputCell
              key={cellIndex}
              value={cellValue}
              onChange={(value) =>
                !isSimulating && updateCell(index, cellIndex, value)
              }
              delayedPlaceholder={
                row.assignment === cellIndex ? columns[cellIndex].name : "?"
              }
              disabled={isSimulating}
              collectionPoint={collectionPoint}
              isSimulating={isSimulating}
              triggerPhantom={row.assignment === cellIndex && triggerPhantom}
              phantomDuration={duration}
              rowIndex={index}
              columnIndex={cellIndex}
              totalColumns={columns.length}
              totalRows={totalRows}
              showBlocks={showBlocks}
              onNavigation={onNavigation}
            />
          ))}
          rowIndex={index}
          duration={duration * 0.5}
          columnColors={columns.map((column) => column.color)}
        />
      </div>

      {showBlocks && (
        <div className="flex-shrink-0 w-24 px-2">
          <input
            type="text"
            value={row.block || ""}
            onChange={(e) =>
              !isSimulating && setBlock(index, e.target.value || null)
            }
            onKeyDown={(e) => {
              if (isSimulating) return;
              const input = e.currentTarget;
              const isOptionPressed = e.altKey || e.metaKey; // Option on Mac, Alt on Windows/Linux
              const cursorPosition = input.selectionStart ?? 0;
              const selectionEnd = input.selectionEnd ?? 0;
              const inputValue = input.value || "";
              const textLength = inputValue.length;

              if (e.key === "ArrowUp") {
                e.preventDefault();
                if (index > 0) {
                  const blockKey = `block-${index - 1}`;
                  const targetElement = document.querySelector(
                    `[data-cell-id="${blockKey}"]`
                  ) as HTMLInputElement;
                  if (targetElement) {
                    targetElement.focus();
                  }
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (index < totalRows - 1) {
                  const blockKey = `block-${index + 1}`;
                  const targetElement = document.querySelector(
                    `[data-cell-id="${blockKey}"]`
                  ) as HTMLInputElement;
                  if (targetElement) {
                    targetElement.focus();
                  }
                }
              } else if (e.key === "ArrowLeft") {
                if (isOptionPressed) {
                  e.preventDefault();
                  // Move to last data cell of current row
                  if (columns.length > 0) {
                    const cellKey = `input-${index}-${columns.length - 1}`;
                    const targetElement = document.querySelector(
                      `[data-cell-id="${cellKey}"]`
                    ) as HTMLInputElement;
                    if (targetElement) {
                      targetElement.focus();
                      targetElement.select();
                    }
                  }
                } else {
                  // Check if cursor is ALREADY at the start
                  if (cursorPosition === 0 && selectionEnd === 0) {
                    e.preventDefault();
                    // Move to last data cell of current row
                    if (columns.length > 0) {
                      const cellKey = `input-${index}-${columns.length - 1}`;
                      const targetElement = document.querySelector(
                        `[data-cell-id="${cellKey}"]`
                      ) as HTMLInputElement;
                      if (targetElement) {
                        targetElement.focus();
                        targetElement.select();
                      }
                    }
                  }
                }
              } else if (e.key === "ArrowRight") {
                // At end of block - no wraparound, just stop (same as normal cells)
                // Only navigate if Option/Meta is pressed, but even then don't wrap to next row
                if (isOptionPressed) {
                  e.preventDefault();
                  // Option/Meta + Right: same behavior as normal cells - just stop at end
                  // (No navigation, as we're already at the end of the row)
                } else {
                  // Check if cursor is ALREADY at the end
                  if (cursorPosition >= textLength) {
                    // At end of block - no wraparound, just stop
                    // Don't prevent default to allow normal cursor movement if not at end
                    e.preventDefault();
                    // No navigation - just stop (same as handleNavigation does)
                  }
                }
              } else if (e.key === "Tab" && !e.shiftKey) {
                // Move to first cell of next row
                e.preventDefault();
                if (index < totalRows - 1) {
                  const cellKey = `input-${index + 1}-0`;
                  const targetElement = document.querySelector(
                    `[data-cell-id="${cellKey}"]`
                  ) as HTMLInputElement;
                  if (targetElement) {
                    targetElement.focus();
                    targetElement.select();
                  }
                }
              } else if (e.key === "Tab" && e.shiftKey) {
                // Move to last cell of current row (reverse zig-zag from block)
                e.preventDefault();
                if (columns.length > 0) {
                  const cellKey = `input-${index}-${columns.length - 1}`;
                  const targetElement = document.querySelector(
                    `[data-cell-id="${cellKey}"]`
                  ) as HTMLInputElement;
                  if (targetElement) {
                    targetElement.focus();
                    targetElement.select();
                  }
                }
              }
            }}
            data-cell-id={`block-${index}`}
            className="w-full h-full px-2 bg-transparent border border-light-background-tertiary dark:border-dark-background-tertiary rounded"
            placeholder="Block"
            disabled={isSimulating}
          />
        </div>
      )}

      <div className="flex items-center justify-center w-14 flex-shrink-0">
        {isUnactivated ? (
          <button
            onClick={addRow}
            className="text-light-text-tertiary hover:text-light-success dark:text-dark-text-tertiary dark:hover:text-dark-success focus:outline-none"
            aria-label="Add row"
            disabled={isSimulating}
          >
            <Icons.Add size={4} />
          </button>
        ) : (
          <button
            onClick={() => !isSimulating && deleteRow(index)}
            className="text-light-text-tertiary hover:text-light-error dark:text-dark-text-tertiary dark:hover:text-dark-error focus:outline-none"
            aria-label="Delete row"
            disabled={isSimulating}
          >
            <Icons.Close size={4} />
          </button>
        )}
      </div>
    </div>
  );
};

export default function DataInput() {
  const { userData, isSimulating, simulationResults } = useSimulationState();

  const {
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
    setUserData,
  } = useSimulationData();

  const { simulationSpeed } = useSimulationSettings();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [triggerPhantom, setTriggerPhantom] = useState(false);
  const prevSimulationResultsLengthRef = useRef(0);
  const [editingColumnNames, setEditingColumnNames] = useState<boolean[]>(
    userData.columns.map(() => false)
  );
  const [pulsate, setPulsate] = useState(false);
  const [collectionPoint, setCollectionPoint] = useState({ x: 500, y: 500 });
  const [effectSizes, setEffectSizes] = useState<{ [key: number]: string }>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const averagesRef = useRef<HTMLDivElement>(null);

  // Create refs for all input cells
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const dataToDisplay = useMemo(() => {
    if (isSimulating && simulationResults && simulationResults.length > 0) {
      const lastSimulationResult =
        simulationResults[simulationResults.length - 1].rows;
      const dummyRow = emptyRow(userData.columns.length);
      return [...lastSimulationResult, dummyRow];
    } else {
      return userData.rows;
    }
  }, [
    isSimulating,
    simulationResults,
    simulationResults.length,
    userData.rows,
  ]);

  const duration = Math.min(speedToDuration(simulationSpeed) / 850, 0.5);

  // Check if animations should be disabled (when speed is at or above 80)
  const disableAnimations = simulationSpeed >= 80;

  useEffect(() => {
    if (isSimulating && simulationResults) {
      const currentLength = simulationResults.length;
      if (currentLength > prevSimulationResultsLengthRef.current) {
        // Skip phantom animations when speed is at maximum (100)
        if (!disableAnimations) {
          // Delay the start of triggerPhantom
          const startDelay = setTimeout(() => {
            setTriggerPhantom(true);
            const endTimer = setTimeout(() => setTriggerPhantom(false), 20);

            // Clean up the end timer when the effect is cleaned up
            return () => clearTimeout(endTimer);
          }, 500 * duration); // Adjust this delay as needed (currently set to 100ms)

          prevSimulationResultsLengthRef.current = currentLength;

          // Clean up the start delay timer if the effect is cleaned up before it fires
          return () => clearTimeout(startDelay);
        } else {
          prevSimulationResultsLengthRef.current = currentLength;
        }
      }
    } else {
      prevSimulationResultsLengthRef.current = 0;
    }
  }, [isSimulating, simulationResults.length, disableAnimations, duration]);

  const latestStatisticBarRef = useLatestStatisticBarRef();

  useEffect(() => {
    if (latestStatisticBarRef.current) {
      const rect = latestStatisticBarRef.current.getBoundingClientRect();
      setCollectionPoint({
        x: rect.left + rect.width / 4,
        y: rect.top - 20,
      });
    }
  }, [simulationResults.length, latestStatisticBarRef.current]);

  useEffect(() => {
    if (
      !isSimulating &&
      (userData.rows.length === 0 ||
        !userData.rows[userData.rows.length - 1].data.some(
          (cell) => cell === null
        ))
    ) {
      addRow();
    }
  }, [userData.rows, addRow, isSimulating]);

  useEffect(() => {
    if (isSimulating && simulationResults) {
      setPulsate(true);
      const timer = setTimeout(() => setPulsate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSimulating, simulationResults?.length]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [userData.rows.length]);

  // Initialize effect sizes when columns or baseline changes
  useEffect(() => {
    const initialEffectSizes: { [key: number]: string } = {};
    userData.columns.forEach((_, index) => {
      if (index !== userData.baselineColumn) {
        initialEffectSizes[index] = "0";
      }
    });
    setEffectSizes(initialEffectSizes);
  }, [userData.columns.length, userData.baselineColumn]);

  const handleEffectSizeChange = (columnIndex: number, value: string) => {
    setEffectSizes((prev) => ({
      ...prev,
      [columnIndex]: value,
    }));
  };

  const isEffectSizesValid = useMemo(() => {
    return Object.values(effectSizes).every((value) => {
      if (value === "" || value === "-") return false;
      const numValue = parseFloat(value);
      return !isNaN(numValue);
    });
  }, [effectSizes]);

  const handleFill = () => {
    if (isSimulating || !isEffectSizesValid) return;

    const newData = {
      ...userData,
      rows: userData.rows.map((row) => {
        if (row.assignment === null) return row;

        const knownColumnIndex = row.data.findIndex((value) => value !== null);
        if (knownColumnIndex === -1) return row;

        const newData = [...row.data];
        const knownValue = newData[knownColumnIndex] as number;
        const baselineValue =
          knownValue - parseFloat(effectSizes[knownColumnIndex] || "0");

        return {
          ...row,
          data: newData.map((value, index) => {
            if (index === knownColumnIndex) return knownValue;
            // Always overwrite
            return baselineValue + parseFloat(effectSizes[index] || "0");
          }),
        };
      }),
    };

    setUserData(newData);
  };

  const handleColumnNameChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isSimulating) return;
    renameColumn(index, e.target.value.slice(0, 20)); // Limit to 20 characters
  };

  // Wrapper for header navigation - headers use rowIndex -1
  const handleHeaderNavigation = (
    direction: "up" | "down" | "left" | "right" | "tab" | "shiftTab" | "enter",
    columnIndex: number
  ) => {
    handleNavigation(direction, -1, columnIndex);
  };

  const toggleBlockingColumn = () => {
    if (isSimulating) return;
    setBlockingEnabled(!userData.blockingEnabled);
  };

  // Comprehensive navigation handler
  // rowIndex can be -1 for headers, or 0+ for data rows
  const handleNavigation = (
    direction: "up" | "down" | "left" | "right" | "tab" | "shiftTab" | "enter",
    rowIndex: number,
    columnIndex: number
  ) => {
    let targetRowIndex = rowIndex;
    let targetColumnIndex = columnIndex;
    let targetIsBlock = false;
    let targetIsHeader = rowIndex === -1;

    if (direction === "up") {
      if (targetIsHeader) {
        return; // Already at top (header row)
      } else if (targetRowIndex > 0) {
        targetRowIndex = targetRowIndex - 1;
      } else {
        // At row 0, move to header
        targetIsHeader = true;
        targetRowIndex = -1;
      }
    } else if (direction === "down") {
      if (targetIsHeader) {
        // From header, move to row 0
        targetIsHeader = false;
        targetRowIndex = 0;
      } else if (targetRowIndex < dataToDisplay.length - 1) {
        targetRowIndex = targetRowIndex + 1;
      } else {
        return; // Already at bottom row
      }
    } else if (direction === "left") {
      if (targetIsHeader) {
        // Header navigation - can navigate left between headers
        if (targetColumnIndex > 0) {
          targetColumnIndex = targetColumnIndex - 1;
        } else {
          return; // Can't go further left
        }
      } else if (targetColumnIndex > 0) {
        targetColumnIndex = targetColumnIndex - 1;
      } else if (userData.blockingEnabled && targetIsBlock) {
        // Coming from block, move to last column
        targetIsBlock = false;
        targetColumnIndex = userData.columns.length - 1;
      } else {
        // At start of row - no wraparound, just stop
        return; // Can't go further left
      }
    } else if (direction === "right") {
      const lastDataColumn = userData.columns.length - 1;
      if (targetIsHeader) {
        // Header navigation - can navigate right between headers
        if (targetColumnIndex < lastDataColumn) {
          targetColumnIndex = targetColumnIndex + 1;
        } else {
          return; // Can't go further right
        }
      } else if (targetColumnIndex < lastDataColumn) {
        targetColumnIndex = targetColumnIndex + 1;
      } else if (userData.blockingEnabled && !targetIsBlock) {
        // At end of row - if blocking enabled, move to block
        targetIsBlock = true;
      } else {
        // At end of row (or already at block) - no wraparound
        return; // Can't go further right
      }
    } else if (direction === "tab") {
      if (targetIsHeader) {
        // From header, tab moves right to next header (like rows move right)
        const lastDataColumn = userData.columns.length - 1;
        if (targetColumnIndex < lastDataColumn) {
          targetColumnIndex = targetColumnIndex + 1;
          // Stay in header row
        } else {
          // At last header, move to first data cell of first row
          targetIsHeader = false;
          targetRowIndex = 0;
          targetColumnIndex = 0;
          targetIsBlock = false;
        }
      } else {
        // Zig-zag navigation: move right, then to block (if enabled), then next row when at end
        const lastDataColumn = userData.columns.length - 1;
        if (targetColumnIndex < lastDataColumn) {
          targetColumnIndex = targetColumnIndex + 1;
        } else if (userData.blockingEnabled && !targetIsBlock) {
          // At end of row (last column) - if blocking enabled, move to block
          targetIsBlock = true;
        } else {
          // At end of row (or coming from block) - move to next row, first column
          if (targetRowIndex < dataToDisplay.length - 1) {
            targetRowIndex = targetRowIndex + 1;
            targetColumnIndex = 0;
            targetIsBlock = false;
          } else {
            return; // Can't go further
          }
        }
      }
    } else if (direction === "shiftTab") {
      if (targetIsHeader) {
        // From header, shift+tab moves left to previous header (like rows move left)
        if (targetColumnIndex > 0) {
          targetColumnIndex = targetColumnIndex - 1;
          // Stay in header row
        } else {
          // At first header, don't wrap - just stop
          return;
        }
      } else {
        // Reverse zig-zag navigation
        if (targetColumnIndex > 0 && !targetIsBlock) {
          targetColumnIndex = targetColumnIndex - 1;
        } else if (
          userData.blockingEnabled &&
          !targetIsBlock &&
          targetColumnIndex === 0
        ) {
          // At start of row - if blocking enabled, move to previous row's block
          if (targetRowIndex > 0) {
            targetRowIndex = targetRowIndex - 1;
            targetIsBlock = true;
          } else {
            // At row 0, move to last header
            targetIsHeader = true;
            targetRowIndex = -1;
            targetColumnIndex = userData.columns.length - 1;
          }
        } else if (targetIsBlock) {
          // Coming from block - move to last column of current row
          targetIsBlock = false;
          targetColumnIndex = userData.columns.length - 1;
        } else {
          // At start of row - move to previous row, last column (or block if enabled)
          if (targetRowIndex > 0) {
            targetRowIndex = targetRowIndex - 1;
            if (userData.blockingEnabled) {
              targetIsBlock = true;
            } else {
              targetColumnIndex = userData.columns.length - 1;
            }
          } else {
            // At row 0, move to last header
            targetIsHeader = true;
            targetRowIndex = -1;
            targetColumnIndex = userData.columns.length - 1;
          }
        }
      }
    } else if (direction === "enter") {
      if (targetIsHeader) {
        // From header, enter moves to first cell of first row
        targetIsHeader = false;
        targetRowIndex = 0;
      } else {
        // Keep current behavior: move to dummy row (last row) same column
        targetRowIndex = dataToDisplay.length - 1;
      }
    }

    // Focus the target element
    let targetElement: HTMLElement | null = null;

    if (targetIsHeader) {
      const headerKey = `column-header-${targetColumnIndex}`;
      // Try to find the input first (if in edit mode)
      const headerInput = document.querySelector(
        `[data-cell-id="${headerKey}"]`
      ) as HTMLInputElement;

      if (headerInput && headerInput.tagName === "INPUT") {
        // Header is in edit mode
        headerInput.focus();
        headerInput.select();
      } else {
        // Header is not in edit mode, trigger edit mode by clicking the span
        const headerSpan = document.querySelector(
          `[data-cell-id="${headerKey}"]`
        ) as HTMLElement;
        if (headerSpan) {
          // Click to enter edit mode, then focus the input after it appears
          (headerSpan as HTMLElement).click();
          // Wait for the input to appear, then focus and select it
          setTimeout(() => {
            const input = document.querySelector(
              `[data-cell-id="${headerKey}"]`
            ) as HTMLInputElement;
            if (input && input.tagName === "INPUT") {
              input.focus();
              input.select();
            }
          }, 10);
        } else {
          // Fallback: try to find by column index and click to enter edit mode
          const headerDiv = document.querySelector(
            `[data-column-index="${targetColumnIndex}"]`
          );
          if (headerDiv) {
            const clickableElement =
              headerDiv.querySelector("span[data-cell-id]");
            if (clickableElement) {
              (clickableElement as HTMLElement).click();
              // Wait for the input to appear, then focus and select it
              setTimeout(() => {
                const input = document.querySelector(
                  `[data-cell-id="${headerKey}"]`
                ) as HTMLInputElement;
                if (input && input.tagName === "INPUT") {
                  input.focus();
                  input.select();
                }
              }, 10);
            }
          }
        }
      }
    } else if (targetIsBlock) {
      const blockKey = `block-${targetRowIndex}`;
      const blockInput = document.querySelector(
        `[data-cell-id="${blockKey}"]`
      ) as HTMLInputElement;
      if (blockInput) {
        blockInput.focus();
        blockInput.select();
      }
    } else {
      const cellKey = `input-${targetRowIndex}-${targetColumnIndex}`;
      const cellInput = document.querySelector(
        `[data-cell-id="${cellKey}"]`
      ) as HTMLInputElement;
      if (cellInput) {
        cellInput.focus();
        cellInput.select();
      }
    }
  };

  const columnAverages = useMemo(
    () => calculateColumnAverages(dataToDisplay),
    [dataToDisplay, simulationResults.length]
  );
  const columnStandardDeviations = useMemo(
    () => calculateColumnStandardDeviations(dataToDisplay),
    [dataToDisplay, simulationResults.length]
  );

  const renderRows = useMemo(() => {
    const shouldIgnoreCollapse = dataToDisplay.length <= 5;

    let rows = dataToDisplay.map((row, index) => (
      <TableRow
        key={index}
        row={row}
        index={index}
        updateCell={updateCell}
        setAssignment={setAssignment}
        setBlock={setBlock}
        addRow={addRow}
        deleteRow={deleteRow}
        isUnactivated={index === dataToDisplay.length - 1}
        toggleCollapse={
          index === dataToDisplay.length - 1
            ? () => setIsCollapsed(!isCollapsed)
            : undefined
        }
        isCollapsed={isCollapsed}
        columns={userData.columns}
        showBlocks={userData.blockingEnabled}
        totalRows={dataToDisplay.length}
        duration={isSimulating ? duration : 1.0}
        isSimulating={isSimulating}
        collectionPoint={collectionPoint}
        triggerPhantom={triggerPhantom}
        onNavigation={handleNavigation}
        disableAnimations={disableAnimations}
      />
    ));

    if (isCollapsed && !shouldIgnoreCollapse) {
      const expandButton = (
        <div
          key="expand-button"
          className="flex items-center justify-center h-12 cursor-pointer border-b border-light-background-tertiary dark:border-dark-background-tertiary"
          onClick={() => !isSimulating && setIsCollapsed(false)}
        >
          <button
            className="flex items-center space-x-2 text-light-primary dark:text-dark-primary hover:text-light-primary-dark dark:hover:text-dark-primary-light focus:outline-none transition-colors duration-200"
            disabled={isSimulating}
          >
            <Icons.Expand size={4} />
            <span>Expand {dataToDisplay.length - 4} hidden rows</span>
          </button>
        </div>
      );

      rows = [
        rows[0],
        rows[1],
        expandButton,
        rows[rows.length - 2],
        rows[rows.length - 1],
      ];
    }

    return rows;
  }, [
    dataToDisplay,
    isCollapsed,
    isSimulating,
    userData.blockingEnabled,
    userData.columns,
    addRow,
    deleteRow,
    setAssignment,
    setBlock,
    updateCell,
    collectionPoint,
    triggerPhantom,
    disableAnimations,
  ]);

  return (
    <div className="h-full">
      <div className="hidden">
        <div className="bg-purple-500" />
        <div className="bg-blue-500" />
        <div className="bg-yellow-500" />
        <div className="bg-green-500" />
      </div>
      <DataControls
        toggleBlocking={toggleBlockingColumn}
        isBlockingEnabled={userData.blockingEnabled}
        disabled={isSimulating}
      />

      <div className="w-full max-w-4xl mx-auto flex flex-col h-[110%] gap-4">
        <motion.div
          className={`flex flex-col bg-light-background dark:bg-dark-background rounded-lg relative overflow-hidden shadow-lg ${
            isSimulating
              ? "border-2 border-light-secondary dark:border-dark-secondary"
              : "border-1 border-slate-700/20"
          }`}
          animate={pulsate ? { scale: [1, 1.002, 1] } : {}}
          transition={{
            duration: Math.min(speedToDuration(simulationSpeed) / 1800, 0.25),
          }}
        >
          {pulsate && (
            <motion.div
              className="absolute inset-0 bg-white z-20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.075, 0] }}
              transition={{
                duration: Math.min(
                  speedToDuration(simulationSpeed) / 1800,
                  0.25
                ),
              }}
            />
          )}
          <div className="flex items-stretch w-full rounded-t-lg h-10 flex-shrink-0 bg-light-background-secondary dark:bg-dark-background-secondary border-b-2 border-light-primary dark:border-dark-primary">
            <div
              className="flex-shrink-0 flex items-center justify-center font-medium"
              style={{ width: "4rem" }}
            >
              #
            </div>
            <div className="flex-grow flex">
              {userData.columns.map((column, index) => (
                <div key={index} className="flex-1" data-column-index={index}>
                  <ColumnHeader
                    isEditing={editingColumnNames[index]}
                    value={column.name}
                    onChange={(e) => handleColumnNameChange(index, e)}
                    onBlur={() => {
                      const newEditingColumnNames = [...editingColumnNames];
                      newEditingColumnNames[index] = false;
                      setEditingColumnNames(newEditingColumnNames);
                    }}
                    onClick={() => {
                      if (isSimulating) return;
                      const newEditingColumnNames = [...editingColumnNames];
                      newEditingColumnNames[index] = true;
                      setEditingColumnNames(newEditingColumnNames);
                    }}
                    removeColumn={() => !isSimulating && removeColumn(index)}
                    color={column.color}
                    removable={userData.columns.length > 2}
                    disabled={isSimulating}
                    columnIndex={index}
                    totalColumns={userData.columns.length}
                    onNavigation={handleHeaderNavigation}
                  />
                </div>
              ))}
            </div>

            {userData.blockingEnabled && (
              <div className="w-24 flex-shrink-0 flex items-center px-6 font-medium">
                Block
              </div>
            )}
            <div className="flex items-center justify-center w-14 flex-shrink-0">
              {userData.colorStack.length > 0 ? (
                <button
                  onClick={() => !isSimulating && addColumn("New Column")}
                  className="text-light-text-tertiary hover:text-light-success dark:text-dark-text-tertiary dark:hover:text-dark-success focus:outline-none"
                  aria-label="Add column"
                  disabled={isSimulating}
                >
                  <Icons.Add size={4} />
                </button>
              ) : (
                <div className="w-8 flex-shrink-0" />
              )}
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className={`overflow-y-auto flex-grow ${
              isSimulating ? "select-none" : ""
            }`}
          >
            {disableAnimations ? (
              // Render without Flipper when animations are disabled, but wrap in fragment
              <>{renderRows}</>
            ) : (
              // Use Flipper for shuffling animations when enabled
              <Flipper
                flipKey={dataToDisplay.map((row) => row.assignment).join("-")}
              >
                {renderRows}
              </Flipper>
            )}
          </div>
          <div className="flex-shrink-0" ref={averagesRef}>
            <ColumnAverages
              averages={columnAverages}
              standardDeviations={columnStandardDeviations}
              columnColors={userData.columns.map((column) => column.color)}
              showBlocks={userData.blockingEnabled}
            />
          </div>

          {/* Baseline Selection Row */}
          <div className="flex-shrink-0 bg-light-background-secondary dark:bg-dark-background-secondary">
            <div className="flex items-stretch w-full h-10">
              <div
                className="flex-shrink-0 flex items-center justify-center font-medium text-light-text-secondary dark:text-dark-text-secondary text-[13px]"
                style={{ width: "4rem" }}
              >
                Baseline
              </div>
              <div className="flex-grow flex">
                {userData.columns.map((column, index) => (
                  <div
                    key={index}
                    className="flex-1 flex items-center justify-center"
                  >
                    <label
                      className={`flex items-center cursor-pointer ${
                        isSimulating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="baseline-column"
                        value={index}
                        checked={userData.baselineColumn === index}
                        onChange={() =>
                          !isSimulating && setBaselineColumn(index)
                        }
                        disabled={isSimulating}
                        className="w-4 h-4 accent-light-primary dark:accent-dark-primary cursor-pointer"
                      />
                    </label>
                  </div>
                ))}
              </div>
              {userData.blockingEnabled && (
                <div className="w-24 flex-shrink-0" />
              )}
              <div className="w-14 flex-shrink-0" />
            </div>
          </div>
        </motion.div>

        {/* Effect Sizes Section */}
        <div className="w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-lg">
          {/* Effect Sizes Row */}
          <div className="flex items-stretch">
            <div
              className="flex-shrink-0 flex items-center justify-center px-1.5 py-3 text-sm text-light-text-secondary dark:text-dark-text-secondary leading-tight"
              style={{ width: "4rem" }}
            >
              <span className="text-center">
                Effect
                <br />
                Size
              </span>
            </div>
            <div className="flex-grow flex pr-14">
              {userData.columns.map((column, index) => (
                <div
                  key={index}
                  className="flex-1 flex items-center justify-center px-2 py-3"
                >
                  {index === userData.baselineColumn ? (
                    <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary italic">
                      —
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={effectSizes[index] || ""}
                      onChange={(e) =>
                        handleEffectSizeChange(index, e.target.value)
                      }
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      disabled={isSimulating}
                      placeholder="0"
                      className={`w-full px-2 py-1.5 text-center text-sm rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        isSimulating ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            {userData.blockingEnabled && <div className="w-24 flex-shrink-0" />}
          </div>

          {/* Apply Button Row */}
          <div className="px-4 py-3">
            <Tooltip
              content={
                isEffectSizesValid
                  ? ""
                  : "Please enter valid effect sizes for all columns"
              }
              className="w-full"
            >
              <button
                onClick={handleFill}
                disabled={isSimulating || !isEffectSizesValid}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 ${
                  isSimulating || !isEffectSizesValid
                    ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                    : "bg-light-primary dark:bg-dark-primary text-white hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:ring-light-primary dark:focus:ring-dark-primary"
                }`}
              >
                Apply Effect Sizes To Table
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
