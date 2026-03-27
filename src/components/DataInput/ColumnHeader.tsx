import React from "react";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Icons } from "../common/Icons";
import { Tooltip } from "../common/Tooltip";
import "@/styles/globals.css";

export interface ColumnHeaderProps {
  isEditing: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onClick: () => void;
  removeColumn: () => void;
  removable: boolean;
  color: string;
  disabled?: boolean;
  columnIndex: number;
  totalColumns: number;
  onNavigation?: (
    direction: "up" | "down" | "left" | "right" | "tab" | "shiftTab" | "enter",
    columnIndex: number,
  ) => void;
  sortableDragHandle?: {
    listeners: SyntheticListenerMap | undefined;
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    isDragging: boolean;
  };
}

export function ColumnHeader({
  isEditing,
  value,
  onChange,
  onBlur,
  onClick,
  removeColumn,
  removable,
  color,
  disabled = false,
  columnIndex,
  totalColumns,
  onNavigation,
  sortableDragHandle,
}: ColumnHeaderProps) {
  const handleClick = (event: React.MouseEvent) => {
    if (!disabled) {
      onClick();
    }
    event.preventDefault();
  };

  const handleRemove = (event: React.MouseEvent) => {
    if (!disabled) {
      removeColumn();
    }
    event.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !onNavigation) return;

    const input = e.currentTarget;
    const isOptionPressed = e.altKey || e.metaKey;
    const cursorPosition = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const inputValue = input.value || "";
    const textLength = inputValue.length;

    if (e.key === "ArrowUp") {
      // Up from column header - no action (already at top)
      return;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigation("down", columnIndex);
    } else if (e.key === "ArrowLeft") {
      if (isOptionPressed) {
        e.preventDefault();
        onNavigation("left", columnIndex);
      } else {
        // Check if cursor is ALREADY at the start
        if (cursorPosition === 0 && selectionEnd === 0) {
          e.preventDefault();
          onNavigation("left", columnIndex);
        }
      }
    } else if (e.key === "ArrowRight") {
      if (isOptionPressed) {
        e.preventDefault();
        onNavigation("right", columnIndex);
      } else {
        // Check if cursor is ALREADY at the end
        if (cursorPosition >= textLength) {
          e.preventDefault();
          onNavigation("right", columnIndex);
        }
      }
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      onNavigation("tab", columnIndex);
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      onNavigation("shiftTab", columnIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onNavigation("enter", columnIndex);
    }
  };

  const handleSpanKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || !onNavigation) return;

    if (e.key === "ArrowUp") {
      // Up from column header - no action (already at top)
      e.preventDefault();
      return;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigation("down", columnIndex);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onNavigation("left", columnIndex);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onNavigation("right", columnIndex);
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      onNavigation("tab", columnIndex);
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      onNavigation("shiftTab", columnIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Enter edit mode
      if (!disabled) {
        onClick();
      }
    }
  };

  return (
    <div
      className={`relative flex h-full min-w-0 items-center justify-center px-6 ${color} ${
        disabled ? "opacity-90" : ""
      }`}
    >
      {/* Match InputCell horizontal inset; cluster grip + label (no flex-1 gap from full-width row). */}
      <div
        className={
          "inline-flex w-fit max-w-full min-w-0 items-center gap-1"
        }
      >
        {sortableDragHandle && (
          <button
            type="button"
            ref={sortableDragHandle.setActivatorNodeRef}
            className={`touch-none z-20 shrink-0 rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-light-primary dark:focus-visible:ring-dark-primary ${
              disabled ?
                "cursor-not-allowed text-light-text-tertiary/50 dark:text-dark-text-tertiary/50"
              : "cursor-grab text-light-text-tertiary hover:text-light-text-secondary active:cursor-grabbing dark:text-dark-text-tertiary dark:hover:text-dark-text-secondary"
            }`}
            aria-label="Drag to reorder column"
            disabled={disabled}
            {...sortableDragHandle.listeners}
          >
            <Icons.GripVertical size={3} />
          </button>
        )}
        <div className="flex min-w-0 items-center justify-center">
          {isEditing ?
            // Inputs default to size=20 (~20ch min width) unless overridden; grid + span size the
            // field, so force size=1 and font-inherit so the input matches the label typography.
            <div className="inline-grid max-w-full min-w-0">
              <span
                className={`invisible col-start-1 row-start-1 whitespace-pre text-center ${color}`}
                aria-hidden
              >
                {value.length > 0 ? value : "\u00a0"}
              </span>
              <input
                type="text"
                // Kill the HTML default (size 20) minimum width in all engines.
                size={1}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={handleKeyDown}
                data-cell-id={`column-header-${columnIndex}`}
                className={`col-start-1 row-start-1 w-full min-w-0 max-w-full bg-transparent px-0 font-inherit text-center border-b-2 focus:outline-none ${color}`}
                autoFocus
                disabled={disabled}
              />
            </div>
          : <div className="flex min-w-0 items-center">
              <span
                className={`truncate ${disabled ? "cursor-default" : "cursor-text"} !${color}`}
                onClick={handleClick}
                onKeyDown={handleSpanKeyDown}
                tabIndex={disabled ? -1 : 0}
                data-cell-id={`column-header-${columnIndex}`}
              >
                {value}
              </span>
              {removable && !disabled && (
                <Tooltip content="Delete column" position="bottom" className="h-5 w-5 shrink-0">
                  <button
                    onClick={handleRemove}
                    className={`ml-1 ${color} hover:!text-light-error dark:hover:!text-dark-error focus:outline-none`}
                    aria-label="Delete column"
                  >
                    <Icons.Clear />
                  </button>
                </Tooltip>
              )}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
