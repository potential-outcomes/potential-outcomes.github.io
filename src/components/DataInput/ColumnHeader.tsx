import React from "react";
import { Icons } from "../common/Icons";
import { Tooltip } from "../common/Tooltip";
import "@/styles/globals.css";

interface ColumnHeaderProps {
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
    columnIndex: number
  ) => void;
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
      className={`relative flex items-center justify-center h-full px-2 ${color} ${
        disabled ? "opacity-90" : ""
      }`}
    >
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          data-cell-id={`column-header-${columnIndex}`}
          className={`w-full bg-transparent truncate text-center border-b-2 focus:outline-none ${color}`}
          autoFocus
          disabled={disabled}
        />
      ) : (
        <div className="flex items-center">
          <span
            className={`truncate ${
              disabled ? "cursor-default" : "cursor-text"
            } !${color}`}
            onClick={handleClick}
            onKeyDown={handleSpanKeyDown}
            tabIndex={disabled ? -1 : 0}
            data-cell-id={`column-header-${columnIndex}`}
          >
            {value}
          </span>
          {removable && !disabled && (
            <Tooltip
              content="Delete column"
              position="bottom"
              className="w-5 h-5"
            >
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
      )}
    </div>
  );
}
