import { GameStatus } from '../enums/game-status.enum';
import { Cell } from './cell.model';

export class Game {
  id: string;
  rows: number;
  columns: number;
  mines: number;
  status: GameStatus;
  createdAt: Date;
  updatedAt: Date;
  board: Cell[][];

  constructor(
    id: string,
    rows: number,
    columns: number,
    mines: number,
    board: Cell[][],
  ) {
    this.id = id;
    this.rows = rows;
    this.columns = columns;
    this.mines = mines;
    this.status = GameStatus.IN_PROGRESS;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.board = board;
  }

  touch(): void {
    this.updatedAt = new Date();
  }
}
