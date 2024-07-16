// src/types/types.ts

export interface DataRow {
    data: (number | null)[];
    assignment: number;
  }
  
  export enum ExperimentalTestStatistic {
    DifferenceInMeans = 'differenceInMeans',
    WilcoxonRankSum = 'wilcoxonRankSum'
  }
  
  export interface TestStatisticMeta {
    name: string;
    function: (rows: DataRow[]) => number;
    supportsMultipleTreatments: boolean;
  }

  export interface UserDataState {
    rows: DataRow[];
    controlColumnIndex: number;
    columnNames: string[];
  }