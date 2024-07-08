'use client';

import React from 'react';
import { DataRow } from '../contexts/SimulationContext';
import { DeleteIcon, AddIcon } from './Icons';
import FlapOverlay from './Flap';

interface InputCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onActivate: () => void;
  className: string;
  placeholder: string;
}

const InputCell: React.FC<InputCellProps> = ({ value, onChange, onActivate, className, placeholder }) => (
  <input
    type="number"
    value={value === null ? '' : value}
    onChange={(e) => {
      const newValue = e.target.value ? Number(e.target.value) : null;
      onChange(newValue);
      if (newValue !== null) onActivate();
    }}
    className={className}
    placeholder={placeholder}
  />
);

interface AssignmentToggleProps {
  isAssigned: boolean;
  isNewRow: boolean;
  onChange: () => void;
}

const AssignmentToggle: React.FC<AssignmentToggleProps> = ({ isAssigned, isNewRow, onChange }) => (
  <button
    onClick={onChange}
    className={`w-6 h-6 rounded-md duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-primary dark:focus:ring-dark-primary
      ${isNewRow 
        ? 'bg-light-background-tertiary dark:bg-dark-background-tertiary' 
        : isAssigned 
          ? 'bg-light-accent dark:bg-dark-accent' 
          : 'bg-light-primary dark:bg-dark-primary'}`}
    aria-label={isAssigned ? "Treatment observed" : "Control observed"}
  />
);

interface DataRowProps {
  row: DataRow;
  index: number;
  updateCell: (rowIndex: number, field: 'treatment' | 'control', value: number | null) => void;
  toggleAssignment: (rowIndex: number) => void;
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  isVisible: boolean;
  columnWidths: {
    index: string;
    control: string;
    treatment: string;
    assignment: string;
    actions: string;
  };
}

export const DataRowComponent: React.FC<DataRowProps> = ({ 
  row, 
  index, 
  updateCell, 
  toggleAssignment, 
  addRow, 
  deleteRow,
  isVisible,
  columnWidths
}) => {
  if (!isVisible) return null;

  const activateRow = (assignment: 0 | 1) => {
    if (row.isNewRow) {
      addRow();
    }
  };

  const containerStyles = `
    relative border-2 border-light-primary dark:border-dark-primary
  `;
  const flapStyles = 'bg-gray-400/40 inner-border-2 inner-border-gray-500 dark:bg-gray-600/40 dark:inner-border-red';

  return (
    <div className="flex items-center space-x-2 py-2 transition-colors duration-200">
      <span className={`w-${columnWidths.index} flex-shrink-0 text-center text-light-text-secondary dark:text-dark-text-secondary`}>
        {row.isNewRow ? '' : index + 1}
      </span>
      <div className={`flex-grow flex w-${columnWidths.control} h-10 items-center space-x-2`}>
        <FlapOverlay
          side={row.assignment === 0 ? 'left' : 'right'}
          leftChild={
            <InputCell
              value={row.control}
              onChange={(value) => updateCell(index, 'control', value)}
              onActivate={() => activateRow(0)}
              className={`
                w-full p-2 rounded-l-lg focus:outline-none focus:ring-none focus:ring-light-primary-dark dark:focus:ring-dark-primary-light 
                text-center transition-colors duration-200 bg-light-background-secondary dark:bg-dark-background-secondary text-light-text-secondary dark:text-dark-text-secondary
                placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                inner-border-2 inner-border-light-primary dark:inner-border-dark-primary
              `}
              placeholder="Control"
            />
          }
          rightChild={
            <InputCell
              value={row.treatment}
              onChange={(value) => updateCell(index, 'treatment', value)}
              onActivate={() => activateRow(1)}
              className={`
                w-full p-2 rounded-r-lg focus:outline-none focus:ring-none focus:ring-light-primary-dark dark:focus:ring-dark-primary-light 
                text-center transition-colors duration-200 bg-light-background-secondary dark:bg-dark-background-secondary text-light-text-secondary dark:text-dark-text-secondary
                placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                inner-border-2 inner-border-light-accent dark:inner-border-dark-accent
              `}
              placeholder="Treated"
            />
          }
          containerStyles={containerStyles}
          flapStyles={flapStyles}
          bothSides={row.isNewRow}
        />
      </div>
      <div className={`w-${columnWidths.assignment} flex-shrink-0`}>
        <AssignmentToggle
          isAssigned={row.assignment === 1}
          isNewRow={row.isNewRow || false}
          onChange={() => {
            toggleAssignment(index);
          }}
        />
      </div>
      {!row.isNewRow && (
        <button 
          onClick={() => deleteRow(index)}
          className={`w-${columnWidths.actions} flex-shrink-0 text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-error dark:hover:text-dark-error focus:outline-none focus:ring-2 focus:ring-light-error dark:focus:ring-dark-error rounded-full p-1 transition-colors duration-200 flex justify-center`}
          aria-label="Remove row"
        >
          <DeleteIcon/>
        </button>
      )}
      {row.isNewRow && (
        <button 
          onClick={() => addRow()}
          className={`w-${columnWidths.actions} flex-shrink-0 text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-success dark:hover:text-dark-success focus:outline-none focus:ring-2 focus:ring-light-success dark:focus:ring-dark-success rounded-full p-1 transition-colors duration-200 flex justify-center`}
          aria-label="Add row"
        >
          <AddIcon/>
        </button>
      )}
    </div>
  );
};

export default DataRowComponent;