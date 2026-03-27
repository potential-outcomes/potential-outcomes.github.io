import React, { useRef } from "react";
import { Tooltip } from "../common/Tooltip";
import { Icons } from "../common/Icons";
import {
  useSimulationData,
  useSimulationHistory,
} from "@/contexts/SimulationContext";
import ApplyEffectButton from "./ApplyEffectButton";

interface DataControlsProps {
  toggleBlocking: () => void;
  isBlockingEnabled: boolean;
  disabled?: boolean;
}

const DataControls: React.FC<DataControlsProps> = ({
  toggleBlocking,
  isBlockingEnabled,
  disabled = false,
}) => {
  const { resetUserData, emptyUserData } = useSimulationData();
  const { undo, redo } = useSimulationHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buttonClass = (isActive: boolean = false) => `
    p-1 focus:outline-none focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary rounded transition-colors duration-200
    ${
      isActive
        ? "text-light-primary dark:text-dark-primary"
        : "text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary"
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
  `;

  return (
    <div className="flex justify-between items-center w-full mb-1.5">
      <div className="flex items-center space-x-1">
        {/* <input
          type="file"
          accept=".csv"
          // onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
          disabled={disabled}
        />
        <Tooltip content="Load data from CSV file">
          <button
            onClick={disabled ? undefined : () => fileInputRef.current?.click()}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Upload size={4} />
          </button>
        </Tooltip> */}

        <Tooltip content="Undo" position="bottom">
          <button
            type="button"
            title="Undo"
            onClick={disabled ? undefined : undo}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Undo size={4} />
          </button>
        </Tooltip>
        <Tooltip content="Redo" position="bottom">
          <button
            type="button"
            title="Redo"
            onClick={disabled ? undefined : redo}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Redo size={4} />
          </button>
        </Tooltip>

        <Tooltip content="Empty rows" position="bottom">
          <button
            type="button"
            title="Empty rows"
            onClick={disabled ? undefined : emptyUserData}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Clear size={4} />
          </button>
        </Tooltip>

        <Tooltip content="Reset data input" position="bottom">
          <button
            type="button"
            title="Reset data input"
            onClick={disabled ? undefined : resetUserData}
            className={buttonClass()}
            disabled={disabled}
          >
            <Icons.Reset size={4} />
          </button>
        </Tooltip>
      </div>

      <div className="flex items-center space-x-1">
        {/* <ApplyEffectButton disabled={disabled} /> */}
        <button
          type="button"
          onClick={disabled ? undefined : toggleBlocking}
          className={`
            flex items-center space-x-1 px-1 py-0.5 rounded-md
            outline-none ring-1 ring-transparent ring-offset-1 transition-colors duration-200
            ${
              isBlockingEnabled
                ? "bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background hover:bg-light-primary-dark dark:hover:bg-dark-primary-light ring-offset-light-primary dark:ring-offset-dark-primary focus:ring-light-primary-dark dark:focus:ring-dark-primary-light"
                : "bg-light-background-tertiary dark:bg-dark-background-tertiary text-light-text-primary dark:text-dark-text-primary hover:bg-light-background-secondary dark:hover:bg-dark-background-secondary ring-offset-light-background-tertiary dark:ring-offset-dark-background-tertiary focus:ring-light-primary dark:focus:ring-dark-primary"
            }
            ${!isBlockingEnabled && !disabled ? "opacity-80 hover:opacity-100" : ""}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          disabled={disabled}
        >
          <Icons.Blocking size={4} />
          <span className="text-sm">
            {isBlockingEnabled ? "Blocking Enabled" : "No Blocking"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DataControls;
