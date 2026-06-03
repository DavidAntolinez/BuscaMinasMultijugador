import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameManagerModule } from './game-manager/game-manager.module';
import { MinesweeperModule } from './minesweeper/minesweeper.module';

@Module({
  imports: [MinesweeperModule, GameManagerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
