import React, { useState, useEffect, useMemo } from "react";
import {
  useSimulationState,
  useSimulationData,
} from "@/contexts/SimulationContext";
import { Tooltip } from "../common/Tooltip";

interface BaselineAndNullEffectsProps {
  disabled?: boolean;
  showBlocks?: boolean;
}

const BaselineAndNullEffects: React.FC<BaselineAndNullEffectsProps> = ({
  disabled = false,
  showBlocks = false,
}) => {
  const { userData, isSimulating } = useSimulationState();
  const { setBaselineColumn, setUserData } = useSimulationData();
  const [effectSizes, setEffectSizes] = useState<{ [key: number]: string }>({});

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

  const handleBaselineChange = (columnIndex: number) => {
    if (!disabled && !isSimulating) {
      setBaselineColumn(columnIndex);
    }
  };

  const isEffectSizesValid = useMemo(() => {
    return Object.values(effectSizes).every((value) => {
      if (value === "" || value === "-") return false;
      const numValue = parseFloat(value);
      return !isNaN(numValue);
    });
  }, [effectSizes]);

  const handleFill = () => {
    if (isSimulating || !isEffectSizesValid || disabled) return;

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

  return (
    <div className="w-full bg-light-background-secondary dark:bg-dark-background-secondary rounded-lg">
      {/* Baseline Selection Row */}
      <div className="flex items-stretch">
        <div
          className="flex-shrink-0 flex items-center justify-center px-2 py-3 text-sm text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap"
          style={{ width: "4rem" }}
        >
          Baseline
        </div>
        <div className="flex-grow flex pr-14">
          {userData.columns.map((column, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center px-4 py-3"
            >
              <label
                className={`flex items-center cursor-pointer ${
                  disabled || isSimulating
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="baseline-column"
                  value={index}
                  checked={userData.baselineColumn === index}
                  onChange={() => handleBaselineChange(index)}
                  disabled={disabled || isSimulating}
                  className="w-4 h-4 accent-light-primary dark:accent-dark-primary cursor-pointer"
                />
              </label>
            </div>
          ))}
        </div>
        {showBlocks && <div className="w-24 flex-shrink-0" />}
      </div>

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
                  disabled={disabled || isSimulating}
                  placeholder="0"
                  className={`w-full px-2 py-1.5 text-center text-sm rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    disabled || isSimulating
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        {showBlocks && <div className="w-24 flex-shrink-0" />}
      </div>

      {/* Fill Button Row */}
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
            disabled={disabled || isSimulating || !isEffectSizesValid}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 ${
              disabled || isSimulating || !isEffectSizesValid
                ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                : "bg-light-primary dark:bg-dark-primary text-white hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:ring-light-primary dark:focus:ring-dark-primary"
            }`}
          >
            Apply Effect Sizes To Table
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default BaselineAndNullEffects;
