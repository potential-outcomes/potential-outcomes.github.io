// contexts/SimulationContext/reducer.ts

import { SimulationState, SimulationAction, UserDataState } from './types';
import { createNewRow as emptyRow, filterValidRows, validateSimulationSpeed, validateSelectedTestStatistic, validateTotalSimulations, validatePValueType } from './utils';

export const simulationReducer = (state: SimulationState, action: SimulationAction): SimulationState => {
  const updateHistory = (newUserData: UserDataState): Partial<SimulationState> => ({
    past: [...state.past, state.data.userData],
    future: [],
    data: { ...state.data, userData: newUserData },
  });

  switch (action.type) {
    case 'SET_USER_DATA':
      return { ...state, ...updateHistory(action.payload) };

    case 'CLEAR_USER_DATA':
        const initialUserData: UserDataState = {
          rows: [{ data: [null, null], assignment: 0 }],
          controlColumnIndex: 0,
          columnNames: ["Control", "Treatment"],
        };
        return { 
          ...state, 
          ...updateHistory(initialUserData),
          results: { simulationResults: [], pValue: null, observedStatistic: null }
        };

    case 'ADD_ROW':
        console.log('ADD_ROW');
      const newRow = emptyRow(state.data.userData.columnNames.length, 0);
      const newRows = [...state.data.userData.rows, newRow];
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
          updatedRows.push(emptyRow(state.data.userData.columnNames.length, 0));
        }
      
        const updatedUserData = {
          ...state.data.userData,
          rows: updatedRows
        };
        return { ...state, ...updateHistory(updatedUserData) };
      }
      
      case 'TOGGLE_ASSIGNMENT': {
        const rowIndex = action.payload;
        const isLastRow = rowIndex === state.data.userData.rows.length - 1;
        const updatedRows = state.data.userData.rows.map((row, index) => 
          index === rowIndex
            ? { ...row, assignment: (row.assignment + 1) % state.data.userData.columnNames.length }
            : row
        );
      
        if (isLastRow) {
          updatedRows.push(emptyRow(state.data.userData.columnNames.length, 0));
        }
      
        const newUserData = {
          ...state.data.userData,
          rows: updatedRows
        };
        return { ...state, ...updateHistory(newUserData) };
      }

    case 'SET_CONTROL_COLUMN':
      return { ...state, ...updateHistory({ ...state.data.userData, controlColumnIndex: action.payload }) };

    case 'RENAME_COLUMN':
      const { index, newName } = action.payload;
      const newColumnNames = [...state.data.userData.columnNames];
      newColumnNames[index] = newName;
      return { ...state, ...updateHistory({ ...state.data.userData, columnNames: newColumnNames }) };

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