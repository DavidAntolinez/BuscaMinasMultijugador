import { Injectable } from '@nestjs/common';
import { GameStatus } from '../enums/game-status.enum';
import { GameState } from '../interfaces/game-state.interface';
import { PublicCell } from '../interfaces/public-cell.interface';
import { Cell } from '../models/cell.model';
import { Game } from '../models/game.model';

@Injectable()
export class BoardMapperService {
  toPublicState(game: Game, outcome?: 'victory' | 'defeat'): GameState {
    return {
      id: game.id,
      rows: game.rows,
      columns: game.columns,
      mines: game.mines,
      status: game.status,
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString(),
      board: this.toPublicBoard(game),
      ...(outcome ? { outcome } : {}),
    };
  }

  private toPublicBoard(game: Game): PublicCell[][] {
    const showAllMines =
      game.status === GameStatus.LOST || game.status === GameStatus.SOLVED;

    return game.board.map((row) =>
      row.map((cell) => this.toPublicCell(cell, showAllMines)),
    );
  }

  private toPublicCell(cell: Cell, showAllMines: boolean): PublicCell {
    const publicCell: PublicCell = {
      row: cell.row,
      column: cell.column,
      revealed: cell.revealed,
      flagged: cell.flagged,
    };

    if (cell.revealed) {
      if (cell.hasMine) {
        publicCell.hasMine = true;
      } else if (cell.adjacentMines > 0) {
        publicCell.adjacentMines = cell.adjacentMines;
      }
    } else if (showAllMines && cell.hasMine) {
      publicCell.hasMine = true;
    }

    return publicCell;
  }
}
