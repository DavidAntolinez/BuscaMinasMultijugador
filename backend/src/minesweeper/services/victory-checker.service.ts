import { Injectable } from '@nestjs/common';
import { GameStatus } from '../enums/game-status.enum';
import { Cell } from '../models/cell.model';
import { Game } from '../models/game.model';

@Injectable()
export class VictoryCheckerService {
  isVictory(game: Game): boolean {
    for (let row = 0; row < game.rows; row += 1) {
      for (let column = 0; column < game.columns; column += 1) {
        const cell = game.board[row][column];
        if (!cell.hasMine && !cell.revealed) {
          return false;
        }
      }
    }
    return true;
  }

  revealAllMines(board: Cell[][], rows: number, columns: number): void {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const cell = board[row][column];
        if (cell.hasMine) {
          cell.revealed = true;
        }
      }
    }
  }

  revealEntireBoard(game: Game): void {
    for (let row = 0; row < game.rows; row += 1) {
      for (let column = 0; column < game.columns; column += 1) {
        game.board[row][column].revealed = true;
      }
    }
  }

  markFinished(game: Game, status: GameStatus): void {
    game.status = status;
    game.touch();
  }
}
