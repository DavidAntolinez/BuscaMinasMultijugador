import { Injectable } from '@nestjs/common';
import { Cell } from '../models/cell.model';

@Injectable()
export class BoardGeneratorService {
  generate(rows: number, columns: number, mines: number): Cell[][] {
    const board = this.createEmptyBoard(rows, columns);
    this.placeMines(board, rows, columns, mines);
    this.calculateAdjacentMines(board, rows, columns);
    return board;
  }

  private createEmptyBoard(rows: number, columns: number): Cell[][] {
    const board: Cell[][] = [];
    for (let row = 0; row < rows; row += 1) {
      board[row] = [];
      for (let column = 0; column < columns; column += 1) {
        board[row][column] = new Cell(row, column);
      }
    }
    return board;
  }

  /**
   * Fisher-Yates shuffle on flat indices — O(rows * columns) time, O(rows * columns) space.
   */
  private placeMines(
    board: Cell[][],
    rows: number,
    columns: number,
    mines: number,
  ): void {
    const totalCells = rows * columns;
    const indices = Array.from({ length: totalCells }, (_, index) => index);

    for (let index = totalCells - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [indices[index], indices[swapIndex]] = [
        indices[swapIndex],
        indices[index],
      ];
    }

    for (let mineIndex = 0; mineIndex < mines; mineIndex += 1) {
      const flatIndex = indices[mineIndex];
      const row = Math.floor(flatIndex / columns);
      const column = flatIndex % columns;
      board[row][column].hasMine = true;
    }
  }

  /** Each cell checks up to 8 neighbors — O(rows * columns) time. */
  private calculateAdjacentMines(
    board: Cell[][],
    rows: number,
    columns: number,
  ): void {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if (board[row][column].hasMine) {
          continue;
        }
        board[row][column].adjacentMines = this.countAdjacentMines(
          board,
          rows,
          columns,
          row,
          column,
        );
      }
    }
  }

  countAdjacentMines(
    board: Cell[][],
    rows: number,
    columns: number,
    row: number,
    column: number,
  ): number {
    let count = 0;
    for (const [neighborRow, neighborColumn] of this.getNeighborCoordinates(
      rows,
      columns,
      row,
      column,
    )) {
      if (board[neighborRow][neighborColumn].hasMine) {
        count += 1;
      }
    }
    return count;
  }

  getNeighborCoordinates(
    rows: number,
    columns: number,
    row: number,
    column: number,
  ): Array<[number, number]> {
    const neighbors: Array<[number, number]> = [];
    for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
      for (let deltaColumn = -1; deltaColumn <= 1; deltaColumn += 1) {
        if (deltaRow === 0 && deltaColumn === 0) {
          continue;
        }
        const neighborRow = row + deltaRow;
        const neighborColumn = column + deltaColumn;
        if (
          neighborRow >= 0 &&
          neighborRow < rows &&
          neighborColumn >= 0 &&
          neighborColumn < columns
        ) {
          neighbors.push([neighborRow, neighborColumn]);
        }
      }
    }
    return neighbors;
  }
}
