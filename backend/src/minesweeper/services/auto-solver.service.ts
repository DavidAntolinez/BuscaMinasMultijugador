import { Injectable } from '@nestjs/common';
import { GameStatus } from '../enums/game-status.enum';
import { AutoSolveResult } from '../interfaces/auto-solve-result.interface';
import { Game } from '../models/game.model';
import { GameEngineService } from './game-engine.service';
import { VictoryCheckerService } from './victory-checker.service';

@Injectable()
export class AutoSolverService {
  constructor(
    private readonly gameEngine: GameEngineService,
    private readonly victoryChecker: VictoryCheckerService,
  ) {}

  /**
   * Strategy:
   * 1. Constraint propagation — if N neighbors must be mines, flag them;
   *    if N mines already flagged, reveal remaining neighbors.
   * 2. When stuck, reveal a known-safe cell using server-side board knowledge.
   * 3. Reveal entire board and set SOLVED (victory) or LOST if a mine was hit.
   */
  solve(game: Game): AutoSolveResult {
    this.gameEngine.assertGameInProgress(game);

    let logicalMovesApplied = 0;
    let randomMovesApplied = 0;
    let hitMine = false;

    while (game.status === GameStatus.IN_PROGRESS) {
      const logicalProgress = this.applyLogicalRules(game);
      logicalMovesApplied += logicalProgress;

      if (game.status !== GameStatus.IN_PROGRESS) {
        break;
      }

      if (logicalProgress > 0) {
        continue;
      }

      const safeCell = this.findSafeCell(game);
      if (!safeCell) {
        break;
      }

      const target = game.board[safeCell.row][safeCell.column];
      if (target.hasMine) {
        hitMine = true;
        this.gameEngine.revealCell(game, safeCell.row, safeCell.column);
        break;
      }

      this.gameEngine.revealCell(game, safeCell.row, safeCell.column);
      randomMovesApplied += 1;

      if (game.status !== GameStatus.IN_PROGRESS) {
        if (game.status === GameStatus.LOST) {
          hitMine = true;
        }
        break;
      }
    }

    this.victoryChecker.revealEntireBoard(game);

    if (hitMine || game.status === GameStatus.LOST) {
      this.victoryChecker.markFinished(game, GameStatus.LOST);
      return {
        status: GameStatus.LOST,
        outcome: 'defeat',
        logicalMovesApplied,
        randomMovesApplied,
      };
    }

    this.victoryChecker.markFinished(game, GameStatus.SOLVED);
    return {
      status: GameStatus.SOLVED,
      outcome: 'victory',
      logicalMovesApplied,
      randomMovesApplied,
    };
  }

  private applyLogicalRules(game: Game): number {
    let moves = 0;

    for (let row = 0; row < game.rows; row += 1) {
      for (let column = 0; column < game.columns; column += 1) {
        const cell = game.board[row][column];
        if (!cell.revealed || cell.adjacentMines === 0) {
          continue;
        }

        const neighbors = this.gameEngine.getNeighbors(game, row, column);
        const hiddenNeighbors = neighbors.filter(
          ({ cell: neighbor }) => !neighbor.revealed,
        );
        const unrevealedUnflagged = hiddenNeighbors.filter(
          ({ cell: neighbor }) => !neighbor.flagged,
        );
        const flaggedCount = hiddenNeighbors.filter(
          ({ cell: neighbor }) => neighbor.flagged,
        ).length;
        const requiredMines = cell.adjacentMines;

        if (
          flaggedCount === requiredMines &&
          unrevealedUnflagged.length > 0
        ) {
          for (const { row: targetRow, column: targetColumn } of unrevealedUnflagged) {
            this.gameEngine.revealCell(game, targetRow, targetColumn);
            moves += 1;
            if (game.status !== GameStatus.IN_PROGRESS) {
              return moves;
            }
          }
        }

        if (
          unrevealedUnflagged.length > 0 &&
          unrevealedUnflagged.length === requiredMines - flaggedCount
        ) {
          for (const { row: targetRow, column: targetColumn, cell: targetCell } of unrevealedUnflagged) {
            if (!targetCell.flagged) {
              targetCell.flagged = true;
              game.touch();
              moves += 1;
            }
          }
        }
      }
    }

    return moves;
  }

  private findSafeCell(
    game: Game,
  ): { row: number; column: number } | undefined {
    for (let row = 0; row < game.rows; row += 1) {
      for (let column = 0; column < game.columns; column += 1) {
        const cell = game.board[row][column];
        if (!cell.revealed && !cell.flagged && !cell.hasMine) {
          return { row, column };
        }
      }
    }
    return undefined;
  }
}
