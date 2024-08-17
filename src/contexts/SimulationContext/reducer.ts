// contexts/SimulationContext/reducer.ts

import { SimulationState, SimulationAction, UserDataState } from './types';
import { emptyRow, filterValidRows, validateSimulationSpeed, validateSelectedTestStatistic, validateTotalSimulations, validatePValueType } from './utils';

export const simulationReducer = (state: SimulationState, action: SimulationAction): SimulationState => {
  const updateHistory = (newUserData: UserDataState): Partial<SimulationState> => ({
    past: [...state.past, state.data.userData],
    future: [],
    data: { ...state.data, userData: newUserData },
  });

  switch (action.type) {
    case 'SET_USER_DATA':
      return { ...state, ...updateHistory(action.payload) };

    case 'RESET_USER_DATA':
        const initialUserData: UserDataState = {
          rows: [{ data: [null, null], assignment: 0, block: null }],
          columns: [{name: "Control", color: "text-green-500" }, {name: "Treatment", color: "text-blue-500"}],
          colorStack: ['text-yellow-500', 'text-purple-500']
        };
        return { 
          ...state, 
          ...updateHistory(initialUserData),
          results: { simulationResults: [], pValue: null, observedStatistic: null }
        };
    
        case 'EMPTY_USER_DATA':
          const emptyRows = state.data.userData.rows.map(row => ({
            data: state.data.userData.columns.map(() => null),
            assignment: row.assignment,
            block: null
          }));
          return {
            ...state,
            ...updateHistory({
              ...state.data.userData,
              rows: emptyRows
            })
          };

    case 'ADD_ROW':
      const newRow = emptyRow(state.data.userData.columns.length);

      const newRows = [...state.data.userData.rows];
      newRows[newRows.length - 1].assignment = 1;
      newRows.push(newRow);
      return { ...state, ...updateHistory({ ...state.data.userData, rows: newRows }) };

    case 'DELETE_ROW':
      const updatedRows = state.data.userData.rows.filter((_, index) => index !== action.payload);
      return { ...state, ...updateHistory({ ...state.data.userData, rows: updatedRows }) };

      case 'UPDATE_CELL': {
        const { rowIndex, columnIndex, value } = action.payload;
        const isLastRow = rowIndex === state.data.userData.rows.length - 1;
        const updatedRows = state.data.userData.rows.map((row, index) => {
            if (index === rowIndex) {
              const updatedRow = { 
                ...row, 
                data: [...row.data.slice(0, columnIndex), value, ...row.data.slice(columnIndex + 1)] 
              };

              if (isLastRow) {
                updatedRow.assignment = columnIndex;
              }
              
              return updatedRow;
            }
            return row;
          });
        
        if (isLastRow && value !== null) {
          updatedRows.push(emptyRow(state.data.userData.columns.length));
        }
      
        const updatedUserData = {
          ...state.data.userData,
          rows: updatedRows
        };
        return { ...state, ...updateHistory(updatedUserData) };
      }
      
      case 'SET_ASSIGNMENT': {
        const { rowIndex, assignment } = action.payload;
        console.log('setting assignment to: ', assignment)
        const isLastRow = rowIndex === state.data.userData.rows.length - 1;
        const updatedRows = state.data.userData.rows.map((row, index) => 
          index === rowIndex
            ? { ...row, assignment: assignment == null ? assignment : (assignment % state.data.userData.columns.length) }
            : row
        );
      
        if (isLastRow) {
          updatedRows.push(emptyRow(state.data.userData.columns.length));
        }
      
        const newUserData = {
          ...state.data.userData,
          rows: updatedRows
        };
        return { ...state, ...updateHistory(newUserData) };
      }

      case 'RENAME_COLUMN':
        const { index, newName } = action.payload;
        const newColumns = [...state.data.userData.columns];
        newColumns[index] = { ...newColumns[index], name: newName };
        return { ...state, ...updateHistory({ ...state.data.userData, columns: newColumns }) };
      
      case 'ADD_COLUMN':
        const newColumnName = action.payload;
        const newColor = state.data.userData.colorStack[0] || 'text-gray-500'; // Default color if stack is empty
        const newColorStack = state.data.userData.colorStack.slice(1); // Remove the used color from the stack
        
        const rowsWithNewColumn = state.data.userData.rows.map(row => ({
          ...row,
          data: [...row.data, null],
        }));
      
        return {
          ...state,
          ...updateHistory({
            ...state.data.userData,
            rows: rowsWithNewColumn,
            columns: [...state.data.userData.columns, { name: newColumnName, color: newColor }],
            colorStack: newColorStack,
          }),
        };
      
      case 'REMOVE_COLUMN':
        const columnIndexToRemove = action.payload;
        if (state.data.userData.columns.length <= 2) {
          // Prevent removing columns if there are only two left
          return state;
        }
        
        const removedColumn = state.data.userData.columns[columnIndexToRemove];
        const rowsWithColumnRemoved = state.data.userData.rows.map(row => ({
          ...row,
          data: row.data.filter((_, index) => index !== columnIndexToRemove),
          assignment: row.assignment === null ? null : 
                      (row.assignment >= columnIndexToRemove ? row.assignment - 1 : row.assignment),
        }));
        const updatedColumns = state.data.userData.columns.filter((_, index) => index !== columnIndexToRemove);
        const updatedColorStack = [...state.data.userData.colorStack, removedColumn.color];
      
        return {
          ...state,
          ...updateHistory({
            ...state.data.userData,
            rows: rowsWithColumnRemoved,
            columns: updatedColumns,
            colorStack: updatedColorStack,
          }),
        };

    case 'SET_SIMULATION_SPEED':
      if (validateSimulationSpeed(action.payload)) {
        return { ...state, settings: { ...state.settings, simulationSpeed: action.payload } };
      }
      return state;

    case 'SET_SELECTED_TEST_STATISTIC':
      if (validateSelectedTestStatistic(action.payload)) {
        return { ...state, settings: { ...state.settings, selectedTestStatistic: action.payload } };
      }
      return state;

    case 'SET_TOTAL_SIMULATIONS':
      if (validateTotalSimulations(action.payload)) {
        return { ...state, settings: { ...state.settings, totalSimulations: action.payload } };
      }
      return state;

    case 'SET_P_VALUE_TYPE':
      if (validatePValueType(action.payload)) {
        return { ...state, settings: { ...state.settings, pValueType: action.payload } };
      }
      return state;

    case 'START_SIMULATION':
      return { ...state, control: { ...state.control, isSimulating: true } };

    case 'PAUSE_SIMULATION':
      return { ...state, control: { ...state.control, isSimulating: false } };

    case 'CLEAR_SIMULATION_DATA':
      return { ...state, results: { simulationResults: [], pValue: null, observedStatistic: null } };

    case 'SET_SIMULATION_RESULTS':
      return { ...state, results: { ...state.results, simulationResults: action.payload } };

    case 'SET_P_VALUE':
      return { ...state, results: { ...state.results, pValue: action.payload } };

    case 'SET_OBSERVED_STATISTIC':
      return { ...state, results: { ...state.results, observedStatistic: action.payload } };

    case 'UNDO':
      if (state.past.length > 0) {
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        return {
          ...state,
          past: newPast,
          data: { ...state.data, userData: previous },
          future: [state.data.userData, ...state.future],
        };
      }
      return state;

    case 'REDO':
      if (state.future.length > 0) {
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
          ...state,
          past: [...state.past, state.data.userData],
          data: { ...state.data, userData: next },
          future: newFuture,
        };
      }
      return state;

    default:
      return state;
  }
};