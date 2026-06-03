export class Cell {
  row: number;
  column: number;
  hasMine: boolean;
  adjacentMines: number;
  revealed: boolean;
  flagged: boolean;

  constructor(row: number, column: number) {
    this.row = row;
    this.column = column;
    this.hasMine = false;
    this.adjacentMines = 0;
    this.revealed = false;
    this.flagged = false;
  }
}
