import { DataRow } from '@/types/types';
import { ExperimentalTestStatistic, TestStatisticMeta, testStatistics } from './testStatistics';

export class SimulationResult {
    rows: DataRow[];
    private _testStatistics: { [key in ExperimentalTestStatistic]?: number };
    private testStatisticsFunctions: Record<ExperimentalTestStatistic, TestStatisticMeta>;
  
    constructor(
        rows: DataRow[],
        initialTestStatistics: { [key in ExperimentalTestStatistic]?: number } = {}
    ) {
      this.rows = rows;
      this._testStatistics = initialTestStatistics;
      this.testStatisticsFunctions = testStatistics;
    }
  
    getTestStatistic(testStatType: ExperimentalTestStatistic): number {
      if (this._testStatistics[testStatType] === undefined) {
        this._testStatistics[testStatType] = this.testStatisticsFunctions[testStatType].function(this.rows);
      }
      return this._testStatistics[testStatType]!;
    }
  }