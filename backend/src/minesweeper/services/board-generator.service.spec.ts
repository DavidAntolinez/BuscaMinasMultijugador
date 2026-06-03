import { BoardGeneratorService } from './board-generator.service';

describe('BoardGeneratorService', () => {
  let service: BoardGeneratorService;

  beforeEach(() => {
    service = new BoardGeneratorService();
  });

  it('should create board with correct dimensions', () => {
    const board = service.generate(5, 4, 3);

    expect(board).toHaveLength(5);
    expect(board[0]).toHaveLength(4);
  });

  it('should place exact number of mines', () => {
    const board = service.generate(8, 8, 10);
    let mineCount = 0;

    for (const row of board) {
      for (const cell of row) {
        if (cell.hasMine) {
          mineCount += 1;
        }
      }
    }

    expect(mineCount).toBe(10);
  });

  it('should calculate adjacent mines for non-mine cells', () => {
    const board = service.generate(3, 3, 1);
    board[1][1].hasMine = false;
    board[0][0].hasMine = true;
    board[0][1].hasMine = false;
    board[0][2].hasMine = false;
    board[1][0].hasMine = false;
    board[1][2].hasMine = false;
    board[2][0].hasMine = false;
    board[2][1].hasMine = false;
    board[2][2].hasMine = false;

    const adjacent = service.countAdjacentMines(board, 3, 3, 1, 1);
    expect(adjacent).toBe(1);
  });

  it('should initialize all cells as hidden and unflagged', () => {
    const board = service.generate(3, 3, 2);

    for (const row of board) {
      for (const cell of row) {
        expect(cell.revealed).toBe(false);
        expect(cell.flagged).toBe(false);
      }
    }
  });

  it('should never place mine count equal to total cells', () => {
    const board = service.generate(4, 4, 15);
    let mineCount = 0;

    for (const row of board) {
      for (const cell of row) {
        if (cell.hasMine) {
          mineCount += 1;
        }
      }
    }

    expect(mineCount).toBe(15);
    expect(mineCount).toBeLessThan(16);
  });
});
