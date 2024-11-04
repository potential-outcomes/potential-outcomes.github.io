import React, { useState, useEffect, useRef } from "react";
import PhantomNumber from "./PhantomNumber";
import { re } from "mathjs";

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

  return (
    <div
      className={`relative w-full h-full z-0 text-inherit ${
        disabled ? "pointer-events-none" : ""
      }`}
    >
      <input
        ref={inputRef}
        type="number"
        value={value === null ? "" : value}
        onChange={(e) => {
          if (!disabled) {
            const newValue = e.target.value ? Number(e.target.value) : null;
            onChange(newValue);
          }
        }}
        onWheel={(e) => (e.target as HTMLElement).blur()}
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
