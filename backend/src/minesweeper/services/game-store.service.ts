import { Injectable } from '@nestjs/common';
import { Game } from '../models/game.model';

@Injectable()
export class GameStoreService {
  private readonly games = new Map<string, Game>();

  save(game: Game): Game {
    this.games.set(game.id, game);
    return game;
  }

  findById(id: string): Game | undefined {
    return this.games.get(id);
  }

  delete(id: string): boolean {
    return this.games.delete(id);
  }

  count(): number {
    return this.games.size;
  }
}
