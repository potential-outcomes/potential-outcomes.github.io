// DataInput.tsx
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  useSimulationData, 
  useSimulationState,
  useSimulationSettings,
  DataRow,
  Column,
  calculateColumnAverages,
  calculateColumnStandardDeviations,
  emptyRow,
  speedToDuration,
  useLatestStatisticBarRef
} from '@/contexts/SimulationContext';
import { Icons } from '../common/Icons';
import { ColumnHeader } from './ColumnHeader';
import { motion } from 'framer-motion';
import { Overlay } from './Overlay';
import DataControls from './DataControls';
import InputCell from './InputCell';

interface ColumnAveragesProps {
  averages: (number | null)[];
  standardDeviations: (number | null)[];
  columnColors: string[];
  showBlocks: boolean;
}

const ColumnAverages: React.FC<ColumnAveragesProps> = ({ averages, standardDeviations, columnColors, showBlocks }) => (
  <div className="flex flex-col bg-light-background-secondary dark:bg-dark-background-secondary border-t-2 border-light-primary dark:border-dark-primary">
    <div className="flex items-stretch h-10">
      <div className="w-12 flex-shrink-0 flex items-center justify-center font-medium">Avg</div>
      <div className="flex-grow flex">
        {averages.map((average, index) => (
          <div 
            key={index} 
            className={`flex-1 flex items-center justify-center font-medium ${columnColors[index]}`}
          >
            {average !== null ? (
              <>
                <span className="mr-1">x̄<sub>{index + 1}</sub>=</span>
                {average.toFixed(2)}
              </>
            ) : "--"}
          </div>
        ))}
      </div>
      {showBlocks && (<div className="w-24 flex-shrink-0" />)}
      <div className="w-14 flex-shrink-0" />
    </div>
    <div className="flex items-stretch h-10 -mt-2">
      <div className="w-12 flex-shrink-0 flex items-center justify-center font-medium">SD</div>
      <div className="flex-grow flex">
        {standardDeviations.map((stdev, index) => (
          <div 
            key={index} 
            className={`flex-1 flex items-center justify-center font-medium ${columnColors[index]}`}
          >
            {stdev !== null ? (
              <>
                <span className="mr-1">s<sub>{index + 1}</sub>=</span>
                {stdev.toFixed(2)}
              </>
            ) : "--"}
          </div>
        ))}
      </div>
      {showBlocks && (<div className="w-24 flex-shrink-0" />)}
      <div className="w-14 flex-shrink-0" />
    </div>
  </div>
);

interface TableRowProps {
  row: DataRow;
  index: number;
  updateCell: (rowIndex: number, columnIndex: number, value: number | null) => void;
  setAssignment: (rowIndex: number, assignment: number | null) => void;
  setBlock: (rowIndex: number, block: string | null) => void;
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  isUnactivated: boolean;
  toggleCollapse?: () => void;
  isCollapsed?: boolean;
  columns: Column[];
  showBlocks: boolean;
  duration?: number;
  isSimulating: boolean;
  collectionPoint: { x: number; y: number };
  triggerPhantom: boolean;
}

const TableRow: React.FC<TableRowProps> = ({ 
  row, 
  index, 
  updateCell, 
  setAssignment, 
  setBlock,
  addRow,
  deleteRow,
  isUnactivated,
  toggleCollapse,
  isCollapsed,
  columns,
  showBlocks,
  duration = 0.5,
  isSimulating,
  collectionPoint,
  triggerPhantom
}) => {
  return (
    <div className={`flex items-stretch w-full h-14 py-2 bg-light-background dark:bg-dark-background ${isUnactivated ? 'sticky bottom-0' : ''}`}>
      <div className="flex items-center justify-center w-12 flex-shrink-0 text-light-text-secondary dark:text-dark-text-secondary">
        {isUnactivated && toggleCollapse ? (
          <button
            onClick={toggleCollapse}
            className="focus:outline-none hover:opacity-80 transition-opacity"
            aria-label={isCollapsed ? "Expand rows" : "Collapse rows"}
            disabled={isSimulating}
          >
            {isCollapsed ? <Icons.Expand size={4} /> : <Icons.Collapse size={4} />}
          </button>
        ) : (
          index + 1
        )}
      </div>

      <div className="flex-grow h-full z-0">
        <Overlay
          assignment={row.assignment}
          setAssignment={(assignment) => !isSimulating && setAssignment(index, assignment)}
          children={
            row.data.map((cellValue, cellIndex) => (
              <InputCell
                key={cellIndex}
                value={cellValue}
                onChange={(value) => !isSimulating && updateCell(index, cellIndex, value)}
                delayedPlaceholder={row.assignment === cellIndex ? columns[cellIndex].name : "?"}
                disabled={isSimulating}
                collectionPoint={collectionPoint}
                isSimulating={isSimulating}
                triggerPhantom={row.assignment === cellIndex && triggerPhantom}
                phantomDuration={duration}
                rowIndex={index}
              />
            ))
          }
          rowIndex={index}
          duration={duration * 0.5}
          columnColors={columns.map((column) => column.color)}
        />
      </div>

      {showBlocks && (
        <div className="flex-shrink-0 w-24 px-2">
          <input
            type="text"
            value={row.block || ''}
            onChange={(e) => !isSimulating && setBlock(index, e.target.value || null)}
            className="w-full h-full px-2 bg-transparent border border-light-background-tertiary dark:border-dark-background-tertiary rounded"
            placeholder="Block"
            disabled={isSimulating}
          />
        </div>
      )}

      <div className="flex items-center justify-center w-14 flex-shrink-0">
        {isUnactivated ? (
          <button 
            onClick={addRow}
            className="text-light-text-tertiary hover:text-light-success dark:text-dark-text-tertiary dark:hover:text-dark-success focus:outline-none"
            aria-label="Add row"
            disabled={isSimulating}
          >
            <Icons.Add size={4}/>
          </button>
        ) : (
          <button 
            onClick={() => !isSimulating && deleteRow(index)}
            className="text-light-text-tertiary hover:text-light-error dark:text-dark-text-tertiary dark:hover:text-dark-error focus:outline-none"
            aria-label="Delete row"
            disabled={isSimulating}
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
    setBlock,
    renameColumn,
    addColumn, 
    removeColumn
  } = useSimulationData();

  const { simulationSpeed } = useSimulationSettings();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);
  const [triggerPhantom, setTriggerPhantom] = useState(false);
  const prevSimulationResultsLengthRef = useRef(0);
  const [editingColumnNames, setEditingColumnNames] = useState<boolean[]>(userData.columns.map(() => false));
  const [pulsate, setPulsate] = useState(false);
  const [collectionPoint, setCollectionPoint] = useState({ x: 500, y: 500 });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const averagesRef = useRef<HTMLDivElement>(null);

  const dataToDisplay = useMemo(() => {
    if (isSimulating && simulationResults && simulationResults.length > 0) {
      const lastSimulationResult = simulationResults[simulationResults.length - 1].rows;
      const dummyRow = emptyRow(userData.columns.length);
      return [...lastSimulationResult, dummyRow];
    } else {
      return userData.rows;
    }
  }, [isSimulating, simulationResults, userData.rows]);

  const duration = Math.min((speedToDuration(simulationSpeed)/900), 0.5);

  useEffect(() => {
    if (isSimulating && simulationResults) {
      const currentLength = simulationResults.length;
      if (currentLength > prevSimulationResultsLengthRef.current) {
        // Delay the start of triggerPhantom
        const startDelay = setTimeout(() => {
          setTriggerPhantom(true);
          const endTimer = setTimeout(() => setTriggerPhantom(false), 20);
          
          // Clean up the end timer when the effect is cleaned up
          return () => clearTimeout(endTimer);
        }, (500 * duration)); // Adjust this delay as needed (currently set to 100ms)
  
        prevSimulationResultsLengthRef.current = currentLength;
        
        // Clean up the start delay timer if the effect is cleaned up before it fires
        return () => clearTimeout(startDelay);
      }
    } else {
      prevSimulationResultsLengthRef.current = 0;
    }
  }, [isSimulating, simulationResults.length]);

  const latestStatisticBarRef = useLatestStatisticBarRef();

  useEffect(() => {
    if (latestStatisticBarRef.current) {
      const rect = latestStatisticBarRef.current.getBoundingClientRect();
      setCollectionPoint({
        x: rect.left + (rect.width / 4),
        y: rect.top - 20,
      });
    }
  }, [simulationResults.length, latestStatisticBarRef.current]);

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

  const toggleBlockingColumn = () => {
    if (isSimulating) return;
    setShowBlocks(!showBlocks);
  };

  const columnAverages = useMemo(() => calculateColumnAverages(dataToDisplay), [dataToDisplay, simulationResults.length]);
  const columnStandardDeviations = useMemo(() => calculateColumnStandardDeviations(dataToDisplay), [dataToDisplay, simulationResults.length]);

  const renderRows = useMemo(() => {
    const shouldIgnoreCollapse = dataToDisplay.length <= 5;

    let rows = dataToDisplay.map((row, index) => (
      <TableRow
        key={index}
        row={row}
        index={index}
        updateCell={updateCell}
        setAssignment={setAssignment}
        setBlock={setBlock}
        addRow={addRow}
        deleteRow={deleteRow}
        isUnactivated={index === dataToDisplay.length - 1}
        toggleCollapse={index === dataToDisplay.length - 1 ? () => setIsCollapsed(!isCollapsed) : undefined}
        isCollapsed={isCollapsed}
        columns={userData.columns}
        showBlocks={showBlocks}
        duration={isSimulating ? duration : 1.0}
        isSimulating={isSimulating}
        collectionPoint={collectionPoint}
        triggerPhantom={triggerPhantom}
      />
    ));

    if (isCollapsed && !shouldIgnoreCollapse) {
      const expandButton = (
        <div key="expand-button" className="flex items-center justify-center h-12 cursor-pointer border-b border-light-background-tertiary dark:border-dark-background-tertiary" onClick={() => !isSimulating && setIsCollapsed(false)}>
          <button className="flex items-center space-x-2 text-light-primary dark:text-dark-primary hover:text-light-primary-dark dark:hover:text-dark-primary-light focus:outline-none transition-colors duration-200" disabled={isSimulating}>
            <Icons.Expand size={4} />
            <span>Expand {dataToDisplay.length - 4} hidden rows</span>
          </button>
        </div>
      );

      rows = [rows[0], rows[1], expandButton, rows[rows.length - 2], rows[rows.length - 1]];
    }

    return rows;
  }, [dataToDisplay, isCollapsed, isSimulating, showBlocks, userData.columns, addRow, deleteRow, setAssignment, setBlock, updateCell, collectionPoint, triggerPhantom]);

  return (
    <>
      <DataControls toggleBlocking={toggleBlockingColumn} isBlockingEnabled={showBlocks} disabled={isSimulating}/>
      <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
        <motion.div 
          className={`flex flex-col bg-light-background dark:bg-dark-background rounded-lg relative overflow-hidden shadow-lg ${isSimulating ? 'border-2 border-light-secondary dark:border-dark-secondary' : 'border-1 border-slate-700/20'}`}
          animate={pulsate ? { scale: [1, 1.002, 1] } : {}}
          transition={{ duration: Math.min(speedToDuration(simulationSpeed)/1800, 0.25) }}
        >
          {pulsate && (
            <motion.div
              className="absolute inset-0 bg-white z-20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.075, 0] }}
              transition={{ duration: Math.min(speedToDuration(simulationSpeed)/1800, 0.25) }}
            />
          )}
          <div className="flex items-stretch w-full rounded-t-lg h-12 flex-shrink-0 bg-light-background-secondary dark:bg-dark-background-secondary border-b-2 border-light-primary dark:border-dark-primary">
            <div className="w-12 flex-shrink-0 flex items-center justify-center font-medium">#</div>
            <div className="flex-grow flex">
              {userData.columns.map((column, index) => (
                <div key={index} className="flex-1">
                  <ColumnHeader
                    isEditing={editingColumnNames[index]}
                    value={column.name}
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
                    removeColumn={() => !isSimulating && removeColumn(index)}
                    color={column.color}
                    removable={userData.columns.length > 2}
                    disabled={isSimulating}
                  />
                </div>
              ))}
            </div>

            {showBlocks && (
              <div className="w-24 flex-shrink-0 flex items-center px-6 font-medium">Block</div>
            )}
            <div className="flex items-center justify-center w-14 flex-shrink-0">
              {userData.colorStack.length > 0 ? (
                <button 
                  onClick={() => !isSimulating && addColumn("New Column")}
                  className="text-light-text-tertiary hover:text-light-success dark:text-dark-text-tertiary dark:hover:text-dark-success focus:outline-none"
                  aria-label="Add column"
                  disabled={isSimulating}
                >
                  <Icons.Add size={4}/>
                </button>
              ) : (
                <div className="w-8 flex-shrink-0"/>
              )}
            </div>
          </div>
          <div 
            ref={scrollContainerRef}
            className={`overflow-y-auto divide-y divide-light-background-tertiary dark:divide-dark-background-tertiary flex-grow ${
              isSimulating ? 'select-none' : ''
            }`}
          >
            {renderRows}
          </div>
          <div className="flex-shrink-0" ref={averagesRef}>
            <ColumnAverages 
              averages={columnAverages} 
              standardDeviations={columnStandardDeviations}
              columnColors={userData.columns.map((column) => column.color)}
              showBlocks={showBlocks}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}