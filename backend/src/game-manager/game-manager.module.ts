import { Module } from '@nestjs/common';
import { MinesweeperModule } from '../minesweeper/minesweeper.module';
import { GameManagerController } from './game-manager.controller';
import { GameManagerGateway } from './game-manager.gateway';
import { GameEventsBusService } from './services/game-events-bus.service';
import { GameManagerService } from './services/game-manager.service';
import { RoomStoreService } from './services/room-store.service';
import { WorkerRegistryService } from './services/worker-registry.service';

@Module({
  imports: [MinesweeperModule],
  controllers: [GameManagerController],
  providers: [
    GameManagerService,
    RoomStoreService,
    WorkerRegistryService,
    GameEventsBusService,
    GameManagerGateway,
  ],
  exports: [GameManagerService, RoomStoreService, GameEventsBusService],
})
export class GameManagerModule {}
