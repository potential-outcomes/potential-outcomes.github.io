import { DataRow } from '@/types/types';
import { ExperimentalTestStatistic, TestStatisticMeta, testStatistics } from './testStatistics';

export class SimulationResult {
    rows: DataRow[];
    private _testStatistics: Map<string, number>;
    private testStatisticsFunctions: Record<ExperimentalTestStatistic, TestStatisticMeta>;
  
    constructor(rows: DataRow[]) {
      this.rows = rows;
      this._testStatistics = new Map();
      this.testStatisticsFunctions = testStatistics;
    }
  
    getTestStatistic(
      testStatType: ExperimentalTestStatistic,
      baselineColumn: number
    ): number {
      const cacheKey = `${testStatType}-${baselineColumn}`;
      
      if (!this._testStatistics.has(cacheKey)) {
        const result = this.testStatisticsFunctions[testStatType].function(
          this.rows,
          baselineColumn
        );
        this._testStatistics.set(cacheKey, result);
      }
      
      return this._testStatistics.get(cacheKey)!;
    }
}