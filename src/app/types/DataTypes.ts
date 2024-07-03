// types/DataTypes.ts
export type DataRow = {
    treatment: number | null;
    control: number | null;
    assignment: 0 | 1;
    isNewRow?: boolean;
  };