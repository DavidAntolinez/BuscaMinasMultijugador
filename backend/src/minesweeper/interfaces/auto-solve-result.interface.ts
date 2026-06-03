import { GameStatus } from '../enums/game-status.enum';

export interface AutoSolveResult {
  status: GameStatus;
  outcome: 'victory' | 'defeat';
  logicalMovesApplied: number;
  randomMovesApplied: number;
}
