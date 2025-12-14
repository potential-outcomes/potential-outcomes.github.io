import React, { useState, useEffect, useRef } from "react";
import PhantomNumber from "./PhantomNumber";

interface InputCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  delayedPlaceholder: string;
  disabled?: boolean;
  collectionPoint: { x: number; y: number };
  isSimulating: boolean;
  triggerPhantom: boolean;
  phantomDuration: number;
  rowIndex: number;
  columnIndex: number;
  totalColumns: number;
  totalRows: number;
  showBlocks: boolean;
  onNavigation: (
    direction: "up" | "down" | "left" | "right" | "tab" | "shiftTab" | "enter",
    rowIndex: number,
    columnIndex: number
  ) => void;
}

interface PhantomInstance {
  id: number;
  value: number;
  startPosition: { x: number; y: number };
}

const InputCell: React.FC<InputCellProps> = ({
  value,
  onChange,
  delayedPlaceholder,
  disabled = false,
  collectionPoint,
  isSimulating,
  phantomDuration,
  triggerPhantom,
  rowIndex,
  columnIndex,
  totalColumns,
  totalRows,
  showBlocks,
  onNavigation,
}) => {
  const [placeholder, setPlaceholder] = useState("?");
  const [phantoms, setPhantoms] = useState<PhantomInstance[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const phantomIdRef = useRef(0);
  const spawnDelay = phantomDuration * 2;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlaceholder(delayedPlaceholder);
    }, 400);

    return () => clearTimeout(timer);
  }, [delayedPlaceholder]);

  const isInputUnobstructed = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(centerX, centerY);
      const unobstructed =
        elementAtPoint === inputRef.current ||
        inputRef.current.contains(elementAtPoint) ||
        (elementAtPoint &&
          elementAtPoint.classList.contains(`no-obstruct-${rowIndex}`));
      return unobstructed;
    }
    return false;
  };

  useEffect(() => {
    if (triggerPhantom && value !== null) {
      if (isInputUnobstructed()) {
        // Check obstruction right before spawning
        const newPhantom: PhantomInstance = {
          id: phantomIdRef.current++,
          value: value,
          startPosition: getInputPosition(),
        };
        setPhantoms((prevPhantoms) => [...prevPhantoms, newPhantom]);
      } else {
        // console.log('Phantom spawn prevented due to obstruction');
      }
    }
  }, [isSimulating, triggerPhantom, value, spawnDelay]);

  const getInputPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const { width: textWidth, height: textHeight } = getTextDimensions(
        inputRef.current.value
      );
      return {
        x: rect.left + rect.width / 2 - textWidth / 2,
        y: rect.top + rect.height / 2 - textHeight * 0.75,
      };
    }
    return { x: 0, y: 0 };
  };

  const getTextDimensions = (
    text: string
  ): { width: number; height: number } => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context && inputRef.current) {
      const computedStyle = getComputedStyle(inputRef.current);
      context.font = computedStyle.font;
      const metrics = context.measureText(text);

      const width = metrics.width;
      const height = parseInt(computedStyle.fontSize, 10);

      return { width, height };
    }
    return { width: 0, height: 0 };
  };

  const getComputedColor = () => {
    return inputRef.current ? getComputedStyle(inputRef.current).color : "";
  };

  const handlePhantomComplete = (id: number) => {
    setPhantoms((prevPhantoms) =>
      prevPhantoms.filter((phantom) => phantom.id !== id)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const input = e.currentTarget;
    const isOptionPressed = e.altKey || e.metaKey; // Option on Mac, Alt on Windows/Linux
    const cursorPosition = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    const inputValue = input.value || "";
    const textLength = inputValue.length;
    const hasSelection = cursorPosition !== selectionEnd;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      onNavigation("up", rowIndex, columnIndex);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigation("down", rowIndex, columnIndex);
    } else if (e.key === "ArrowLeft") {
      if (isOptionPressed) {
        e.preventDefault();
        onNavigation("left", rowIndex, columnIndex);
      } else {
        if (cursorPosition === 0 && selectionEnd === 0) {
          e.preventDefault();
          onNavigation("left", rowIndex, columnIndex);
        }
      }
    } else if (e.key === "ArrowRight") {
      if (isOptionPressed) {
        e.preventDefault();
        onNavigation("right", rowIndex, columnIndex);
      } else {
        // Check if cursor is ALREADY at the end
        if (cursorPosition >= textLength) {
          e.preventDefault();
          onNavigation("right", rowIndex, columnIndex);
        }
      }
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      onNavigation("tab", rowIndex, columnIndex);
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      onNavigation("shiftTab", rowIndex, columnIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onNavigation("enter", rowIndex, columnIndex);
    }
  };

  return (
    <div
      className={`relative w-full h-full z-0 text-inherit ${
        disabled ? "pointer-events-none" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="text"
        value={value === null ? "" : value}
        onChange={(e) => {
          if (!disabled) {
            const text = e.target.value;
            // Allow empty or valid numbers (including negative, decimals if needed)
            if (text === "" || /^-?\d*\.?\d*$/.test(text)) {
              const newValue = text === "" ? null : Number(text);
              onChange(newValue);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        onWheel={(e) => (e.target as HTMLElement).blur()}
        data-cell-id={`input-${rowIndex}-${columnIndex}`}
        className={`
          w-full h-full px-6 py-1 text-center relative z-0
          bg-light-background-secondary dark:bg-[rgb(40,50,65)]
          focus:outline-none focus:ring-0
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          ${disabled ? "cursor-not-allowed" : "pointer-events-auto"}
        `}
        placeholder={placeholder}
        disabled={disabled}
      />
      {phantoms.map((phantom) => (
        <PhantomNumber
          key={phantom.id}
          value={phantom.value}
          startPosition={phantom.startPosition}
          endPosition={collectionPoint}
          onAnimationComplete={() => handlePhantomComplete(phantom.id)}
          color={getComputedColor()}
          duration={phantomDuration}
        />
      ))}
    </div>
  );
};

export default InputCell;
