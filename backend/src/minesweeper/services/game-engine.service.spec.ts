import { BadRequestException, ConflictException } from '@nestjs/common';
import { GameStatus } from '../enums/game-status.enum';
import { Cell } from '../models/cell.model';
import { Game } from '../models/game.model';
import { BoardGeneratorService } from './board-generator.service';
import { FloodFillService } from './flood-fill.service';
import { GameEngineService } from './game-engine.service';
import { VictoryCheckerService } from './victory-checker.service';

describe('GameEngineService', () => {
  let service: GameEngineService;

  beforeEach(() => {
    service = new GameEngineService(
      new FloodFillService(new BoardGeneratorService()),
      new VictoryCheckerService(),
      new BoardGeneratorService(),
    );
  });

  const createManualGame = (): Game => {
    const board: Cell[][] = [
      [new Cell(0, 0), new Cell(0, 1), new Cell(0, 2)],
      [new Cell(1, 0), new Cell(1, 1), new Cell(1, 2)],
      [new Cell(2, 0), new Cell(2, 1), new Cell(2, 2)],
    ];

    board[1][1].hasMine = true;
    board[0][0].adjacentMines = 0;
    board[0][1].adjacentMines = 1;
    board[0][2].adjacentMines = 0;
    board[1][0].adjacentMines = 1;
    board[1][1].adjacentMines = 0;
    board[1][2].adjacentMines = 1;
    board[2][0].adjacentMines = 0;
    board[2][1].adjacentMines = 1;
    board[2][2].adjacentMines = 0;

    return new Game('test-id', 3, 3, 1, board);
  };

  it('should reveal single numeric cell', () => {
    const game = createManualGame();

    service.revealCell(game, 0, 1);

    expect(game.board[0][1].revealed).toBe(true);
    expect(game.status).toBe(GameStatus.IN_PROGRESS);
  });

  it('should apply flood fill on empty cell', () => {
    const game = createManualGame();

    service.revealCell(game, 0, 0);

    expect(game.board[0][0].revealed).toBe(true);
    expect(game.board[0][1].revealed).toBe(true);
    expect(game.board[1][0].revealed).toBe(true);
    expect(game.board[0][2].revealed).toBe(false);
    expect(game.board[1][1].revealed).toBe(false);
  });

  it('should flood fill across a long connected zero region', () => {
    const game = createManualGame();
    for (let row = 0; row < game.rows; row += 1) {
      for (let column = 0; column < game.columns; column += 1) {
        const cell = game.board[row][column];
        cell.hasMine = false;
        cell.adjacentMines = 0;
      }
    }
    game.board[2][2].adjacentMines = 1;
    game.board[2][2].hasMine = false;

    service.revealCell(game, 0, 0);

    expect(game.board[0][0].revealed).toBe(true);
    expect(game.board[0][2].revealed).toBe(true);
    expect(game.board[2][0].revealed).toBe(true);
    expect(game.board[2][2].revealed).toBe(true);
  });

  it('should lose and reveal all mines when hitting a mine', () => {
    const game = createManualGame();

    service.revealCell(game, 1, 1);

    expect(game.status).toBe(GameStatus.LOST);
    expect(game.board[1][1].revealed).toBe(true);
  });

  it('should reject revealing flagged cells', () => {
    const game = createManualGame();
    game.board[0][0].flagged = true;

    expect(() => service.revealCell(game, 0, 0)).toThrow(ConflictException);
  });

  it('should reject revealing already revealed cells', () => {
    const game = createManualGame();
    game.board[0][1].revealed = true;

    expect(() => service.revealCell(game, 0, 1)).toThrow(ConflictException);
  });

  it('should toggle flag on hidden cell', () => {
    const game = createManualGame();

    service.toggleFlag(game, 2, 2);
    expect(game.board[2][2].flagged).toBe(true);

    service.toggleFlag(game, 2, 2);
    expect(game.board[2][2].flagged).toBe(false);
  });

  it('should reject flagging revealed cells', () => {
    const game = createManualGame();
    game.board[0][1].revealed = true;

    expect(() => service.toggleFlag(game, 0, 1)).toThrow(ConflictException);
  });

  it('should reject moves on finished games', () => {
    const game = createManualGame();
    game.status = GameStatus.WON;

    expect(() => service.revealCell(game, 0, 0)).toThrow(BadRequestException);
    expect(() => service.toggleFlag(game, 0, 0)).toThrow(BadRequestException);
  });

  it('should detect victory when all safe cells are revealed', () => {
    const board: Cell[][] = [[new Cell(0, 0), new Cell(0, 1)]];
    board[0][1].hasMine = true;
    board[0][0].adjacentMines = 1;

    const game = new Game('win-id', 1, 2, 1, board);

    service.revealCell(game, 0, 0);

    expect(game.status).toBe(GameStatus.WON);
  });
});
