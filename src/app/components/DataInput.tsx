// src/components/DataInput.tsx
'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { DataRowComponent } from './DataRow';
import { DataRow, createNewRow, MAX_COLUMN_NAME_LENGTH } from '../contexts/SimulationContext';
import { UndoIcon, RedoIcon, ExpandIcon, CollapseIcon, UploadIcon, MagicWandIcon, EditIcon } from './Icons';
import { Tooltip } from './Tooltip';

const INDEX_COLUMN_WIDTH = '12';
const CONTROL_COLUMN_WIDTH = '40';
const TREATMENT_COLUMN_WIDTH = '40';
const ASSIGNMENT_COLUMN_WIDTH = '12';
const ACTIONS_COLUMN_WIDTH = '12';

export default function DataInput() {
  const { 
    data, 
    setData, 
    toggleAssignment, 
    updateCell, 
    deleteRow, 
    addRow,
    undo, 
    redo,
    treatmentColumnName,
    controlColumnName,
    setTreatmentColumnName,
    setControlColumnName
  } = useSimulationContext();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(false);
  const [editingControl, setEditingControl] = useState(false);

  useEffect(() => {
    if (!data.some(row => row.isNewRow)) {
      addRow();
    }
  }, [data, addRow]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const rows = text.split('\n').map(row => {
            const [control, treatment, assignment] = row.split(',').map(Number);
            return { 
              control: isNaN(control) ? null : control,
              treatment: isNaN(treatment) ? null : treatment, 
              assignment: assignment === 1 ? 1 : 0 
            } as DataRow;
          }).filter(row => row.treatment !== null || row.control !== null);
          setData([...rows, createNewRow()]);
        }
      };
      reader.readAsText(file);
    }
  };
  

  const fillEmptyCells = (effect: number) => {
    const newData = data.map(row => {
      if (row.isNewRow) return row;
      if (row.control === null && row.treatment === null) return row;

      let newControl = row.control;
      let newTreatment = row.treatment;

      if (row.control === null && row.treatment !== null) {
        newControl = row.treatment - effect;
      } else if (row.treatment === null && row.control !== null) {
        newTreatment = row.control + effect;
      }

      return {
        ...row,
        treatment: newTreatment,
        control: newControl
      };
    });
    setData(newData);
  };

  const calculateAverage = (column: 'treatment' | 'control') => {
    const values = data
      .filter(row => !row.isNewRow && row.assignment === (column === 'treatment' ? 1 : 0))
      .map(row => row[column])
      .filter((value): value is number => value !== null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const memoizedUpdateCell = useCallback(updateCell, [updateCell]);
  const memoizedToggleAssignment = useCallback(toggleAssignment, [toggleAssignment]);
  const memoizedDeleteRow = useCallback(deleteRow, [deleteRow]);

  const addDummyRow = useCallback((assignment: 0 | 1) => {
    const newRowIndex = data.findIndex(row => row.isNewRow);
    if (newRowIndex !== -1) {
      memoizedUpdateCell(newRowIndex, assignment ? 'control' : 'treatment', assignment);
    }
  }, [data, memoizedUpdateCell]);

  const handleColumnNameChange = (column: 'treatment' | 'control', e: React.ChangeEvent<HTMLInputElement>) => {
    const trimmedValue = e.target.value.slice(0, MAX_COLUMN_NAME_LENGTH - (column === 'control' ? 10 : 0));
    if (column === 'treatment') {
      setTreatmentColumnName(trimmedValue);
    } else {
      setControlColumnName(trimmedValue);
    }
  };

  const renderRows = useMemo(() => {
    const shouldIgnoreCollapse = data.length <= 3;

    let rows = data.map((row, index) => (
      <DataRowComponent
        key={index}
        row={row}
        index={index}
        updateCell={memoizedUpdateCell}
        toggleAssignment={memoizedToggleAssignment}
        activateNewRow={addDummyRow}
        deleteRow={memoizedDeleteRow}
        isVisible={shouldIgnoreCollapse || !isCollapsed || index === 0 || index === data.length - 1}
        columnWidths={{
          index: INDEX_COLUMN_WIDTH,
          control: CONTROL_COLUMN_WIDTH,
          treatment: TREATMENT_COLUMN_WIDTH,
          assignment: ASSIGNMENT_COLUMN_WIDTH,
          actions: ACTIONS_COLUMN_WIDTH,
        }}
      />
    ));
  
    if (isCollapsed && !shouldIgnoreCollapse) {
      const expandButton = (
        <div key="expand-button" className="flex items-center justify-center h-12 cursor-pointer border-b border-light-background-tertiary dark:border-dark-background-tertiary" onClick={() => setIsCollapsed(false)}>
          <button className="flex items-center space-x-2 text-light-primary dark:text-dark-primary hover:text-light-primary-dark dark:hover:text-dark-primary-light focus:outline-none transition-colors duration-200">
            <ExpandIcon/>
            <span>Expand {data.length - 2} hidden rows</span>
          </button>
        </div>
      );
  
      rows = [rows[0], expandButton, rows[rows.length - 1]];
    }
  
    return rows;
  }, [data, isCollapsed, memoizedUpdateCell, memoizedToggleAssignment, memoizedDeleteRow, addDummyRow]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 text-light-text-primary dark:text-dark-text-primary">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Data</h2>
        <div className="flex space-x-2">
          <Tooltip content="Undo (Cmd+Z / Ctrl+Z)">
            <ActionButton onClick={undo} icon={<UndoIcon />} />
          </Tooltip>
          <Tooltip content="Redo (Cmd+Shift+Z / Ctrl+Y)">
            <ActionButton onClick={redo} icon={<RedoIcon />} />
          </Tooltip>
        </div>
      </div>
      <div className="flex items-center space-x-2 py-3 bg-light-background-secondary dark:bg-dark-background-secondary border-b-2 border-light-primary dark:border-dark-primary rounded-t-lg">
        <span className="w-12 flex-shrink-0 text-center font-medium">#</span>
        <div className="flex-grow flex items-center space-x-2">
          <ColumnHeader
            isEditing={editingControl}
            value={controlColumnName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColumnNameChange('control', e)}
            onBlur={() => setEditingControl(false)}
            onClick={() => setEditingControl(true)}
            isControl
          />
          <ColumnHeader
            isEditing={editingTreatment}
            value={treatmentColumnName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColumnNameChange('control', e)}
            onBlur={() => setEditingTreatment(false)}
            onClick={() => setEditingTreatment(true)}
            isControl={false}
          />
          <span className="w-10 text-center font-medium"></span>
        </div>
        <span className="w-12 flex-shrink-0"></span>
      </div>
      <div className="max-h-[60vh] overflow-y-auto bg-light-background dark:bg-dark-background rounded-b-lg divide-y divide-light-background-tertiary dark:divide-dark-background-tertiary">
        {renderRows}
      </div>
      <div className="mt-4 flex items-center space-x-2">
        <span className="w-12 flex-shrink-0 text-right pr-2">
          <Tooltip content={isCollapsed ? "Expand Rows" : "Collapse Rows"}>
            <ActionButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              icon={isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
            />
          </Tooltip>
        </span>
        <div className="flex-grow flex items-center space-x-2">
          <AverageDisplay label="Control" value={calculateAverage('control')} />
          <AverageDisplay label="Treatment" value={calculateAverage('treatment')} />
          <span className="w-10"></span>
        </div>
        <span className="w-12 flex-shrink-0"></span>
      </div>
      <FillEmptyCellsRow onFill={fillEmptyCells} />
      <div className="mt-4 flex justify-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <ActionButton
          onClick={() => fileInputRef.current?.click()}
          icon={<UploadIcon />}
          label="Load from .csv"
          primary
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string; // Make label optional
  primary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, label, primary = false }) => {
  const baseClasses = "px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-2";
  const colorClasses = primary
    ? "bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:ring-light-primary-dark dark:focus:ring-dark-primary-light"
    : "bg-light-secondary dark:bg-dark-secondary text-light-background dark:text-dark-background hover:bg-light-secondary-dark dark:hover:bg-dark-secondary-light focus:ring-light-secondary-dark dark:focus:ring-dark-secondary-light";

  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClasses}`} aria-label={label || 'button'}>
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
};

interface ColumnHeaderProps {
  isEditing: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onClick: () => void;
  isControl: boolean;
}

function ColumnHeader({ isEditing, value, onChange, onBlur, onClick, isControl }: ColumnHeaderProps) {
  const textColorClass = isControl ? "text-light-primary dark:text-dark-primary" : "text-light-accent dark:text-dark-accent";

  return (
    <span className={`w-[calc(50%-20px)] text-center font-medium ${textColorClass} flex items-center justify-center`}>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e)}
          onBlur={onBlur}
          className="w-full bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary text-center border-b-2 border-light-primary dark:border-dark-primary focus:outline-none"
          autoFocus
        />
      ) : (
        <Tooltip content="Click to edit column name">
          <span onClick={onClick} className="cursor-pointer break-words flex items-center">
            {isControl && value !== 'Control' ? `${value} (Control)` : value}
            <EditIcon />
          </span>
        </Tooltip>
      )}
    </span>
  );
}

interface AverageDisplayProps {
  label: string;
  value: number;
}

function AverageDisplay({ label, value }: AverageDisplayProps) {
  const colorClass = label === 'Control' ? "text-light-primary dark:text-dark-primary" : "text-light-accent dark:text-dark-accent";
  
  return (
    <span className={`w-[calc(50%-20px)] text-center font-medium ${colorClass} break-words`}>
      Avg: {value.toFixed(2)}
    </span>
  );
}

interface FillEmptyCellsRowProps {
  onFill: (effect: number) => void;
}

function FillEmptyCellsRow({ onFill }: FillEmptyCellsRowProps) {
  const [effect, setEffect] = useState<string>('0');

  const handleFill = () => {
    const numEffect = parseFloat(effect);
    if (!isNaN(numEffect)) {
      onFill(numEffect);
    } else {
      alert("Please enter a valid number for the treatment effect.");
    }
  };

  return (
    <div className="mt-6 flex items-center space-x-4 bg-light-background-secondary dark:bg-dark-background-secondary py-4 px-3 rounded-lg">
      <span className="font-medium text-light-text-primary dark:text-dark-text-primary">Treatment Effect Under Null:</span>
      <input
        type="number"
        value={effect}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEffect(e.target.value)}
        className="w-12 px-1 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
      />
      <Tooltip content="Fill empty cells assuming this treatment effect">
        <button
          onClick={handleFill}
          className="flex items-center space-x-2 px-2 py-2 bg-light-primary dark:bg-dark-primary text-light-background dark:text-dark-background rounded-md hover:bg-light-primary-dark dark:hover:bg-dark-primary-light focus:outline-none focus:ring-2 focus:ring-light-primary-dark dark:focus:ring-dark-primary-light transition-colors duration-200"
        >
          <MagicWandIcon />
          <span>Fill Empty Cells</span>
        </button>
      </Tooltip>
    </div>
  );
}
