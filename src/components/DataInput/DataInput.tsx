// DataInput.tsx
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  useSimulationData, 
  useSimulationState,
  DataRow,
  calculateColumnAverages,
  emptyRow
} from '@/contexts/SimulationContext';
import { Icons } from '../common/Icons';
import { ColumnHeader } from './ColumnHeader';
import { motion } from 'framer-motion';
import { Overlay } from './Overlay';
import InputCell from './InputCell';

export const COLUMN_PROPORTIONS = {
  index: 1,
  data: 6,
  assignment: 2,
  actions: 1
};

const ColumnAverages: React.FC<{ averages: (number | null)[], columnNames: string[] }> = ({ averages, columnNames }) => (
  <div className="flex items-stretch h-12 bg-light-background-secondary dark:bg-dark-background-secondary border-t-2 border-light-primary dark:border-dark-primary">
    <div className="w-12 flex-shrink-0 flex items-center justify-center font-medium">Avg</div>
    <div className="flex-grow flex">
      {averages.map((average, index) => (
        <div key={index} className="flex-1 flex items-center justify-center font-medium">
          {average !== null ? average.toFixed(2) : "--"}
        </div>
      ))}
    </div>
    {/* <div className="w-16 flex-shrink-0" /> */}
    <div className="w-14 flex-shrink-0" />
  </div>
);

interface TableRowProps {
  row: DataRow;
  index: number;
  updateCell: (rowIndex: number, columnIndex: number, value: number | null) => void;
  setAssignment: (rowIndex: number, assignment: number | null) => void;
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  isUnactivated: boolean;
  toggleCollapse?: () => void;
  isCollapsed?: boolean;
  columnNames: string[];
}

const TableRow: React.FC<TableRowProps> = ({ 
  row, 
  index, 
  updateCell, 
  setAssignment, 
  addRow,
  deleteRow,
  isUnactivated,
  toggleCollapse,
  isCollapsed,
  columnNames
}) => {
  return (
    <div className={`flex items-stretch w-full h-14 py-2 bg-light-background dark:bg-dark-background ${isUnactivated ? 'sticky bottom-0' : ''}`}>
      {/* Index Column */}
      <div className="flex items-center justify-center w-12 flex-shrink-0 text-light-text-secondary dark:text-dark-text-secondary">
        {isUnactivated && toggleCollapse ? (
          <button
            onClick={toggleCollapse}
            className="focus:outline-none hover:opacity-80 transition-opacity"
            aria-label={isCollapsed ? "Expand rows" : "Collapse rows"}
          >
            {isCollapsed ? <Icons.Expand size={4} /> : <Icons.Collapse size={4} />}
          </button>
        ) : (
          index + 1
        )}
      </div>

      {/* Data Column */}
      <div className="flex-grow h-full z-0">
        <Overlay
          assignment={row.assignment}
          setAssignment={(assignment) => setAssignment(index, assignment)}
          children={
            row.data.map((_, i) => (
              <InputCell
                key={i}
                value={row.data[i]}
                onChange={(value) => updateCell(index, i, value)}
                delayedPlaceholder={row.assignment === i ? columnNames[i] : "?"}
              />
            ))
          }
          index={index}
        />
      </div>

      {/* Assignment Toggle Column */}
      {/* <div className="flex items-center justify-center w-16 flex-shrink-0">
        <button
          onClick={() => setAssignment(index, row.assignment == null ? row.assignment : (row.assignment + 1) % row.data.length)}
          className={`w-6 h-6 rounded-md transition-colors duration-300
            ${isUnactivated 
              ? 'bg-light-background-tertiary dark:bg-dark-background-tertiary' 
              : row.assignment === 1
                ? 'bg-light-accent dark:bg-dark-accent' 
                : 'bg-light-primary dark:bg-dark-primary'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-primary dark:focus:ring-dark-primary`}
          aria-label={row.assignment === 1 ? "Treatment assigned" : "Control assigned"}
        />
      </div> */}

      {/* Action Column */}
      <div className="flex items-center justify-center w-14 flex-shrink-0">
        {isUnactivated ? (
          <button 
            onClick={addRow}
            className="text-light-text-tertiary hover:text-light-success dark:text-dark-text-tertiary dark:hover:text-dark-success focus:outline-none"
            aria-label="Add row"
          >
            <Icons.Add size={4}/>
          </button>
        ) : (
          <button 
            onClick={() => deleteRow(index)}
            className="text-light-text-tertiary hover:text-light-error dark:text-dark-text-tertiary dark:hover:text-dark-error focus:outline-none"
            aria-label="Delete row"
          >
            <Icons.Close size={4}/>
          </button>
        )}
      </div>
    </div>
  );
};

export default function DataInput() {
  const {
    userData,
    isSimulating,
    simulationResults
  } = useSimulationState();
  
  const {
    addRow,
    deleteRow,
    updateCell,
    setAssignment,
    renameColumn,
    addColumn, 
    removeColumn
  } = useSimulationData();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingColumnNames, setEditingColumnNames] = useState<boolean[]>(userData.columnNames.map(() => false));

  const [pulsate, setPulsate] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dataToDisplay = (() => {
    if (isSimulating && simulationResults && simulationResults.length > 0) {
      const lastSimulationResult = simulationResults[simulationResults.length - 1].rows;
      const dummyRow = emptyRow(lastSimulationResult[0].data.length);
      return [...lastSimulationResult, dummyRow];
    } else {
      return userData.rows;
    }
  })();

  useEffect(() => {
    if (!isSimulating && (userData.rows.length === 0 || !userData.rows[userData.rows.length - 1].data.some(cell => cell === null))) {
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
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [userData.rows.length]);

  const handleColumnNameChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSimulating) return;
    renameColumn(index, e.target.value.slice(0, 20));  // Limit to 20 characters
  };

  const columnAverages = useMemo(() => calculateColumnAverages(dataToDisplay), [dataToDisplay, userData.columnNames]);

  const renderRows = useMemo(() => {
    const shouldIgnoreCollapse = dataToDisplay.length <= 5;

    let rows = dataToDisplay.map((row, index) => (
      <TableRow
        key={index}
        row={row}
        index={index}
        updateCell={updateCell}
        setAssignment={setAssignment}
        addRow={addRow}
        deleteRow={deleteRow}
        isUnactivated={index === dataToDisplay.length - 1}
        toggleCollapse={index === dataToDisplay.length - 1 ? () => setIsCollapsed(!isCollapsed) : undefined}
        isCollapsed={isCollapsed}
        columnNames={userData.columnNames}
      />
    ));

    if (isCollapsed && !shouldIgnoreCollapse) {
      const expandButton = (
        <div key="expand-button" className="flex items-center justify-center h-12 cursor-pointer border-b border-light-background-tertiary dark:border-dark-background-tertiary" onClick={() => setIsCollapsed(false)}>
          <button className="flex items-center space-x-2 text-light-primary dark:text-dark-primary hover:text-light-primary-dark dark:hover:text-dark-primary-light focus:outline-none transition-colors duration-200">
            <Icons.Expand size={4} />
            <span>Expand {dataToDisplay.length - 4} hidden rows</span>
          </button>
        </div>
      );

      rows = [rows[0], rows[1], expandButton, rows[rows.length - 2], rows[rows.length - 1]];
    }

    return rows;
  }, [dataToDisplay, isCollapsed, isSimulating]);

  return (
    <div className="w-full max-w-4xl mx-auto text-light-text-primary dark:text-dark-text-primary flex flex-col h-full">
  
      <motion.div 
         className={`flex flex-col bg-light-background dark:bg-dark-background rounded-lg relative overflow-hidden shadow-lg ${isSimulating ? 'border-2 border-light-secondary dark:border-dark-secondary' : 'border-1 border-slate-700/20'}`}
        animate={pulsate ? { scale: [1, 1.002, 1] } : {}}
        transition={{ duration: 0.25 }}
      >
        {isSimulating && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed z-50" />
        )}
        {pulsate && (
          <motion.div
            className="absolute inset-0 bg-white bg-opacity-20 dark:bg-opacity-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.25 }}
          />
        )}
        <div className="flex-shrink-0 flex items-stretch rounded-t-lg h-12 bg-light-background-secondary dark:bg-dark-background-secondary border-b-2 border-light-primary dark:border-dark-primary">
          <div className="w-12 flex-shrink-0 flex items-center justify-center font-medium">#</div>
          <div className="flex-grow flex">
            {userData.columnNames.map((name, index) => (
              <div key={index} className="flex-1">
                <ColumnHeader
                  isEditing={editingColumnNames[index]}
                  value={name}
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
                  removeColumn={() => {removeColumn(index)}}
                  color={index === 0 ? 'text-light-primary dark:text-dark-primary' : 'text-light-accent dark:text-dark-accent'}
                  removable={userData.columnNames.length > 2}
                />
              </div>
            ))}
          </div>
          {/* <div className="w-16 flex-shrink-0 flex items-center justify-center font-medium">Assign</div> */}
          <button 
            onClick={() => {addColumn("New Column")}}
            className="text-light-text-tertiary hover:text-light-success dark:text-dark-text-tertiary dark:hover:text-dark-success focus:outline-none"
            aria-label="Add column"
          >
            <Icons.Add size={4}/>
          </button>
          <div className="w-14 flex-shrink-0 flex justify-end items-center space-x-1 pr-1">
          </div>
        </div>
        <div 
          ref={scrollContainerRef}
          className="overflow-y-auto divide-y divide-light-background-tertiary dark:divide-dark-background-tertiary"
        >
          {renderRows}
        </div>
        <div className="flex-shrink-0">
          <ColumnAverages averages={columnAverages} columnNames={userData.columnNames} />
        </div>
      </motion.div>
    </div>
  );
}