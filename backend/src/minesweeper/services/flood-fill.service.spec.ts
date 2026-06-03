import { Cell } from '../models/cell.model';
import { BoardGeneratorService } from './board-generator.service';
import { FloodFillService } from './flood-fill.service';

describe('FloodFillService', () => {
  let service: FloodFillService;

  beforeEach(() => {
    service = new FloodFillService(new BoardGeneratorService());
  });

  const buildBoard = (layout: string[]): Cell[][] => {
    const rows = layout.length;
    const columns = layout[0].length;
    const board: Cell[][] = [];

    for (let row = 0; row < rows; row += 1) {
      board[row] = [];
      for (let column = 0; column < columns; column += 1) {
        const symbol = layout[row][column];
        const cell = new Cell(row, column);
        cell.hasMine = symbol === '*';
        cell.adjacentMines =
          symbol === '*' ? 0 : Number.parseInt(symbol, 10) || 0;
        board[row][column] = cell;
      }
    }

    return board;
  };

  it('should reveal connected empty region and numeric borders', () => {
    const board = buildBoard(['000', '000', '000']);

    service.expand(board, 3, 3, 1, 1);

    expect(board[0][0].revealed).toBe(true);
    expect(board[0][1].revealed).toBe(true);
    expect(board[0][2].revealed).toBe(true);
    expect(board[1][0].revealed).toBe(true);
    expect(board[1][1].revealed).toBe(true);
    expect(board[1][2].revealed).toBe(true);
    expect(board[2][0].revealed).toBe(true);
    expect(board[2][1].revealed).toBe(true);
    expect(board[2][2].revealed).toBe(true);
  });

  it('should not reveal flagged cells during expansion', () => {
    const board = buildBoard(['000', '000', '000']);
    board[0][1].flagged = true;

    service.expand(board, 3, 3, 1, 0);

    expect(board[0][1].revealed).toBe(false);
    expect(board[0][1].flagged).toBe(true);
  });

  it('should stop at mines', () => {
    const board = buildBoard(['000', '0*0', '000']);

    service.expand(board, 3, 3, 0, 0);

    expect(board[1][1].revealed).toBe(false);
    expect(board[1][1].hasMine).toBe(true);
  });
});
