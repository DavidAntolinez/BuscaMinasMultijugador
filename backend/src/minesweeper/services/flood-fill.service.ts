import { Injectable } from '@nestjs/common';
import { Cell } from '../models/cell.model';
import { BoardGeneratorService } from './board-generator.service';

@Injectable()
export class FloodFillService {
  constructor(private readonly boardGenerator: BoardGeneratorService) {}

  /**
   * BFS expansion from a zero-adjacent cell.
   * Reveals connected empty cells and numeric border cells.
   * O(rows * columns) worst case per invocation.
   */
  expand(
    board: Cell[][],
    rows: number,
    columns: number,
    startRow: number,
    startColumn: number,
  ): void {
    const queue: Array<[number, number]> = [[startRow, startColumn]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [row, column] = queue.shift()!;
      const key = `${row}:${column}`;

      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      const cell = board[row][column];
      if (cell.revealed || cell.flagged) {
        continue;
      }

      cell.revealed = true;

      if (cell.adjacentMines > 0) {
        continue;
      }

      for (const [neighborRow, neighborColumn] of this.boardGenerator.getNeighborCoordinates(
        rows,
        columns,
        row,
        column,
      )) {
        const neighbor = board[neighborRow][neighborColumn];
        if (neighbor.revealed || neighbor.flagged || neighbor.hasMine) {
          continue;
        }

        neighbor.revealed = true;

        if (neighbor.adjacentMines === 0) {
          queue.push([neighborRow, neighborColumn]);
        }
      }
    }
  }
}
