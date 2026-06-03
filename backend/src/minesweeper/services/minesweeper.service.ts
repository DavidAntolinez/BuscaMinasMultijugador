import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateGameDto } from '../dto/create-game.dto';
import { GameStatus } from '../enums/game-status.enum';
import { GameState } from '../interfaces/game-state.interface';
import { Game } from '../models/game.model';
import { AutoSolverService } from './auto-solver.service';
import { BoardGeneratorService } from './board-generator.service';
import { BoardMapperService } from './board-mapper.service';
import { GameEngineService } from './game-engine.service';
import { GameStoreService } from './game-store.service';

@Injectable()
export class MinesweeperService {
  constructor(
    private readonly gameStore: GameStoreService,
    private readonly boardGenerator: BoardGeneratorService,
    private readonly gameEngine: GameEngineService,
    private readonly autoSolver: AutoSolverService,
    private readonly boardMapper: BoardMapperService,
  ) {}

  createGame(dto: CreateGameDto): GameState {
    const totalCells = dto.rows * dto.columns;

    if (dto.mines >= totalCells) {
      throw new BadRequestException(
        'La cantidad de minas debe ser menor al total de celdas',
      );
    }

    const board = this.boardGenerator.generate(
      dto.rows,
      dto.columns,
      dto.mines,
    );
    const game = new Game(uuidv4(), dto.rows, dto.columns, dto.mines, board);
    this.gameStore.save(game);

    return this.boardMapper.toPublicState(game);
  }

  getGame(id: string): GameState {
    const game = this.findGameOrFail(id);
    return this.boardMapper.toPublicState(game);
  }

  revealCell(id: string, row: number, column: number): GameState {
    const game = this.findGameOrFail(id);
    this.gameEngine.revealCell(game, row, column);
    return this.boardMapper.toPublicState(game);
  }

  toggleFlag(id: string, row: number, column: number): GameState {
    const game = this.findGameOrFail(id);
    this.gameEngine.toggleFlag(game, row, column);
    return this.boardMapper.toPublicState(game);
  }

  autoSolve(id: string): GameState {
    const game = this.findGameOrFail(id);
    const result = this.autoSolver.solve(game);
    return this.boardMapper.toPublicState(game, result.outcome);
  }

  private findGameOrFail(id: string): Game {
    const game = this.gameStore.findById(id);
    if (!game) {
      throw new NotFoundException(`Partida con id ${id} no encontrada`);
    }
    return game;
  }
}
