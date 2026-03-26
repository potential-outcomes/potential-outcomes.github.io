// potential-outcomes/src/types/types.ts

export interface DataRow {
    id: string;
    data: (number | null)[];
    assignment: number | null;
    block: string | null;
    assignmentOriginalIndex: number | null;
  }    