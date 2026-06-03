import { Module } from '@nestjs/common';
import { MinesweeperController } from './minesweeper.controller';
import { AutoSolverService } from './services/auto-solver.service';
import { BoardGeneratorService } from './services/board-generator.service';
import { BoardMapperService } from './services/board-mapper.service';
import { FloodFillService } from './services/flood-fill.service';
import { GameEngineService } from './services/game-engine.service';
import { GameStoreService } from './services/game-store.service';
import { MinesweeperService } from './services/minesweeper.service';
import { VictoryCheckerService } from './services/victory-checker.service';

@Module({
  controllers: [MinesweeperController],
  providers: [
    MinesweeperService,
    GameStoreService,
    BoardGeneratorService,
    FloodFillService,
    VictoryCheckerService,
    GameEngineService,
    AutoSolverService,
    BoardMapperService,
  ],
  exports: [MinesweeperService, GameStoreService],
})
export class MinesweeperModule {}
