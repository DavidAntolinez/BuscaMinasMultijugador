import { GameStatus } from '../enums/game-status.enum';
import { PublicCell } from './public-cell.interface';

export interface GameState {
  id: string;
  rows: number;
  columns: number;
  mines: number;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
  board: PublicCell[][];
  outcome?: 'victory' | 'defeat';
}
