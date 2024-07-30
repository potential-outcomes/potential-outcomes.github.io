// DataInput.tsx
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  useSimulationData, 
  useSimulationState,
  useSimulationHistory,
  UserDataState,
  DataRow,
  ExperimentalTestStatistic
} from '@/contexts/SimulationContext';
import TableRow from './TableRow';
import { Icons } from '../common/Icons';
import { Tooltip } from '../common/Tooltip';
import { ColumnHeader } from './ColumnHeader';
import { motion } from 'framer-motion';

export const COLUMN_PROPORTIONS = {
  index: 1,
  data: 6,
  assignment: 2,
  actions: 1
};

type AnimationType = 'flap' | 'slider';
type Mode = 'cover' | 'highlight';

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
    <div className="w-16 flex-shrink-0" />
    <div className="w-14 flex-shrink-0" />
  </div>
);

export default function DataInput() {
  const {
    userData,
    isSimulating,
    simulationResults
  } = useSimulationState();
  
  const {
    setUserData,
    addRow,
    deleteRow,
    updateCell,
    toggleAssignment,
    renameColumn
  } = useSimulationData();
  
  const { undo, redo } = useSimulationHistory();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingColumnNames, setEditingColumnNames] = useState<boolean[]>(userData.columnNames.map(() => false));
  
  const showModeButtons = false;
  const [mode, setMode] = useState<Mode>('cover');
  const [animationType, setAnimationType] = useState<AnimationType>('slider');

  const [pulsate, setPulsate] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dataToDisplay = (() => {
    if (isSimulating && simulationResults && simulationResults.length > 0) {
      const lastSimulationResult = simulationResults[simulationResults.length - 1].rows;
      const dummyRow = {
        data: new Array(userData.columnNames.length).fill(null),
        assignment: 0
      };
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

  const calculateColumnAverages = (rows: DataRow[]): (number | null)[] => {
    const groups = rows.reduce((acc, row, index) => {
      // Skip the last row if it's unactivated
      if (index === rows.length - 1 && row.data.every(cell => cell === null)) return acc;
  
      row.data.forEach((value, colIndex) => {
        if (value !== null && row.assignment === colIndex) {
          if (!acc[colIndex]) acc[colIndex] = [];
          acc[colIndex].push(value);
        }
      });
      return acc;
    }, {} as Record<number, number[]>);
  
    return userData.columnNames.map((_, index) => {
      const group = groups[index] || [];
      return group.length > 0 ? group.reduce((sum, value) => sum + value, 0) / group.length : null;
    });
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
        toggleAssignment={toggleAssignment}
        addRow={addRow}
        deleteRow={deleteRow}
        isUnactivated={index === dataToDisplay.length - 1}
        controlColumnIndex={userData.controlColumnIndex}
        toggleCollapse={index === dataToDisplay.length - 1 ? () => setIsCollapsed(!isCollapsed) : undefined}
        isCollapsed={isCollapsed}
        mode={mode}
        animationType={animationType}
      />
    ));

    if (isCollapsed && !shouldIgnoreCollapse) {
      const expandButton = (
        <div key="expand-button" className="flex items-center justify-center h-12 cursor-pointer border-b border-light-background-tertiary dark:border-dark-background-tertiary" onClick={() => setIsCollapsed(false)}>
          <button className="flex items-center space-x-2 text-light-primary dark:text-dark-primary hover:text-light-primary-dark dark:hover:text-dark-primary-light focus:outline-none transition-colors duration-200">
            <Icons.Expand size={5} />
            <span>Expand {dataToDisplay.length - 4} hidden rows</span>
          </button>
        </div>
      );

      rows = [rows[0], rows[1], expandButton, rows[rows.length - 2], rows[rows.length - 1]];
    }

    return rows;
  }, [dataToDisplay, isCollapsed, isSimulating, mode, animationType, userData.controlColumnIndex]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'highlight' ? 'cover' : 'highlight');
  };

  const toggleAnimationType = () => {
    setAnimationType(prevType => prevType === 'flap' ? 'slider' : 'flap');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 text-light-text-primary dark:text-dark-text-primary flex flex-col h-full">
      {showModeButtons && (
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          
          <>
            <button
              onClick={toggleMode}
              className="px-3 py-1 bg-light-accent dark:bg-dark-accent rounded"
            >
              {mode}
            </button>
            <button
              onClick={toggleAnimationType}
              className="px-3 py-1 bg-light-accent dark:bg-dark-accent rounded"
            >
              {animationType}
            </button>
          </>
          
        </div>
      </div>
      )}
  
      <motion.div 
         className={`flex-grow flex flex-col bg-light-background dark:bg-dark-background rounded-lg relative overflow-hidden ${isSimulating ? 'border-2 border-light-secondary dark:border-dark-secondary' : ''}`}
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
                  color={index === userData.controlColumnIndex ? 'text-light-primary dark:text-dark-primary' : 'text-light-accent dark:text-dark-accent'}
                />
              </div>
            ))}
          </div>
          <div className="w-16 flex-shrink-0 flex items-center justify-center font-medium">Assign</div>
          <div className="w-14 flex-shrink-0 flex justify-end items-center space-x-1 pr-1">
            <Tooltip content="Undo (Cmd+Z / Ctrl+Z)">
              <Icons.Undo 
                className="w-5 h-5 opacity-90 cursor-pointer text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors duration-200" 
                onClick={undo}
              />
            </Tooltip>
            <Tooltip content="Redo (Cmd+Shift+Z / Ctrl+Y)">
              <Icons.Redo 
                className="w-5 h-5 opacity-90 cursor-pointer text-light-text-secondary dark:text-dark-text-secondary hover:text-light-primary dark:hover:text-dark-primary transition-colors duration-200" 
                onClick={redo}
              />
            </Tooltip>
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