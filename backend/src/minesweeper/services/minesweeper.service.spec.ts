import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameStatus } from '../enums/game-status.enum';
import { MinesweeperModule } from '../minesweeper.module';
import { Cell } from '../models/cell.model';
import { Game } from '../models/game.model';
import { AutoSolverService } from './auto-solver.service';
import { BoardGeneratorService } from './board-generator.service';
import { BoardMapperService } from './board-mapper.service';
import { FloodFillService } from './flood-fill.service';
import { GameEngineService } from './game-engine.service';
import { GameStoreService } from './game-store.service';
import { MinesweeperService } from './minesweeper.service';
import { VictoryCheckerService } from './victory-checker.service';

describe('MinesweeperService', () => {
  let service: MinesweeperService;
  let gameStore: GameStoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MinesweeperModule],
    }).compile();

    service = module.get(MinesweeperService);
    gameStore = module.get(GameStoreService);
  });

  it('should create a hidden game board', () => {
    const state = service.createGame({ rows: 5, columns: 5, mines: 5 });

    expect(state.id).toBeDefined();
    expect(state.status).toBe(GameStatus.IN_PROGRESS);
    expect(state.board).toHaveLength(5);

    for (const row of state.board) {
      for (const cell of row) {
        expect(cell.revealed).toBe(false);
        expect(cell.hasMine).toBeUndefined();
        expect(cell.adjacentMines).toBeUndefined();
      }
    }
  });

  it('should reject invalid mine count', () => {
    expect(() =>
      service.createGame({ rows: 3, columns: 3, mines: 9 }),
    ).toThrow(BadRequestException);
  });

  it('should reveal cell and return updated state', () => {
    const created = service.createGame({ rows: 3, columns: 3, mines: 1 });
    const updated = service.revealCell(created.id, 0, 0);

    expect(updated.board[0][0].revealed).toBe(true);
  });

  it('should toggle flag', () => {
    const created = service.createGame({ rows: 3, columns: 3, mines: 1 });
    const flagged = service.toggleFlag(created.id, 1, 1);

    expect(flagged.board[1][1].flagged).toBe(true);
  });

  it('should throw when game is not found', () => {
    expect(() => service.getGame('00000000-0000-4000-8000-000000000000')).toThrow(
      NotFoundException,
    );
  });

  it('should auto solve and reveal entire board', () => {
    const board: Cell[][] = [
      [new Cell(0, 0), new Cell(0, 1)],
      [new Cell(1, 0), new Cell(1, 1)],
    ];
    board[1][1].hasMine = true;
    board[0][0].adjacentMines = 0;
    board[0][1].adjacentMines = 1;
    board[1][0].adjacentMines = 1;
    board[1][1].adjacentMines = 0;

    const game = new Game('solve-id', 2, 2, 1, board);
    gameStore.save(game);

    const solved = service.autoSolve(game.id);

    expect(solved.status).toBe(GameStatus.SOLVED);
    expect(solved.outcome).toBe('victory');
    expect(solved.board[1][1].revealed).toBe(true);
    expect(solved.board[1][1].hasMine).toBe(true);
  });
});

describe('VictoryCheckerService', () => {
  let service: VictoryCheckerService;

  beforeEach(() => {
    service = new VictoryCheckerService();
  });

  it('should detect victory when all safe cells are revealed', () => {
    const board: Cell[][] = [[new Cell(0, 0), new Cell(0, 1)]];
    board[0][1].hasMine = true;
    board[0][0].revealed = true;

    const game = new Game('victory-id', 1, 2, 1, board);
    expect(service.isVictory(game)).toBe(true);
  });

  it('should detect non-victory when safe cells remain hidden', () => {
    const board: Cell[][] = [[new Cell(0, 0), new Cell(0, 1)]];
    board[0][1].hasMine = true;

    const game = new Game('pending-id', 1, 2, 1, board);
    expect(service.isVictory(game)).toBe(false);
  });
});

describe('AutoSolverService', () => {
  let solver: AutoSolverService;
  let engine: GameEngineService;

  beforeEach(() => {
    const boardGenerator = new BoardGeneratorService();
    engine = new GameEngineService(
      new FloodFillService(boardGenerator),
      new VictoryCheckerService(),
      boardGenerator,
    );
    solver = new AutoSolverService(engine, new VictoryCheckerService());
  });

  it('should solve small board without hitting mine', () => {
    const board: Cell[][] = [
      [new Cell(0, 0), new Cell(0, 1), new Cell(0, 2)],
      [new Cell(1, 0), new Cell(1, 1), new Cell(1, 2)],
    ];
    board[1][2].hasMine = true;
    board[0][0].adjacentMines = 0;
    board[0][1].adjacentMines = 0;
    board[0][2].adjacentMines = 1;
    board[1][0].adjacentMines = 0;
    board[1][1].adjacentMines = 1;
    board[1][2].adjacentMines = 0;

    const game = new Game('auto-id', 2, 3, 1, board);
    const result = solver.solve(game);

    expect(result.outcome).toBe('victory');
    expect(game.status).toBe(GameStatus.SOLVED);
  });
});

describe('BoardMapperService', () => {
  it('should hide mine data for unrevealed cells', () => {
    const board: Cell[][] = [[new Cell(0, 0), new Cell(0, 1)]];
    board[0][1].hasMine = true;
    const game = new Game('mapper-id', 1, 2, 1, board);
    const mapper = new BoardMapperService();
    const state = mapper.toPublicState(game);

    expect(state.board[0][1].hasMine).toBeUndefined();
  });
});
