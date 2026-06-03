import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { GameStatus } from '../enums/game-status.enum';
import { Game } from '../models/game.model';
import { Cell } from '../models/cell.model';
import { BoardGeneratorService } from './board-generator.service';
import { FloodFillService } from './flood-fill.service';
import { VictoryCheckerService } from './victory-checker.service';

@Injectable()
export class GameEngineService {
  constructor(
    private readonly floodFill: FloodFillService,
    private readonly victoryChecker: VictoryCheckerService,
    private readonly boardGenerator: BoardGeneratorService,
  ) {}

  revealCell(game: Game, row: number, column: number): void {
    this.assertGameInProgress(game);
    this.assertValidCoordinates(game, row, column);

    const cell = game.board[row][column];

    if (cell.revealed) {
      throw new ConflictException('La celda ya está revelada');
    }

    if (cell.flagged) {
      throw new ConflictException(
        'No se puede limpiar una celda marcada con bandera',
      );
    }

    if (cell.hasMine) {
      cell.revealed = true;
      this.victoryChecker.revealAllMines(
        game.board,
        game.rows,
        game.columns,
      );
      this.victoryChecker.markFinished(game, GameStatus.LOST);
      return;
    }

    if (cell.adjacentMines === 0) {
      this.floodFill.expand(game.board, game.rows, game.columns, row, column);
    } else {
      cell.revealed = true;
    }

    if (this.victoryChecker.isVictory(game)) {
      this.victoryChecker.markFinished(game, GameStatus.WON);
    } else {
      game.touch();
    }
  }

  toggleFlag(game: Game, row: number, column: number): void {
    this.assertGameInProgress(game);
    this.assertValidCoordinates(game, row, column);

    const cell = game.board[row][column];

    if (cell.revealed) {
      throw new ConflictException(
        'No se puede marcar una celda que ya está revelada',
      );
    }

    cell.flagged = !cell.flagged;
    game.touch();
  }

  assertGameInProgress(game: Game): void {
    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'La partida ya finalizó y no acepta más movimientos',
      );
    }
  }

  assertValidCoordinates(game: Game, row: number, column: number): void {
    if (row < 0 || row >= game.rows || column < 0 || column >= game.columns) {
      throw new BadRequestException('Coordenadas fuera del tablero');
    }
  }

  getUnrevealedCells(game: Game): Array<{ row: number; column: number }> {
    const cells: Array<{ row: number; column: number }> = [];
    for (let row = 0; row < game.rows; row += 1) {
      for (let column = 0; column < game.columns; column += 1) {
        const cell = game.board[row][column];
        if (!cell.revealed && !cell.flagged) {
          cells.push({ row, column });
        }
      }
    }
    return cells;
  }

  getNeighbors(
    game: Game,
    row: number,
    column: number,
  ): Array<{ row: number; column: number; cell: Cell }> {
    return this.boardGenerator
      .getNeighborCoordinates(game.rows, game.columns, row, column)
      .map(([neighborRow, neighborColumn]) => ({
        row: neighborRow,
        column: neighborColumn,
        cell: game.board[neighborRow][neighborColumn],
      }));
  }
}
