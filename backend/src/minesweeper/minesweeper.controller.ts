import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CellActionDto } from './dto/cell-action.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { GameIdParamDto } from './dto/game-id-param.dto';
import type { GameState } from './interfaces/game-state.interface';
import { MinesweeperService } from './services/minesweeper.service';

@Controller('minesweeper/games')
export class MinesweeperController {
  constructor(private readonly minesweeperService: MinesweeperService) {}

  @Post()
  createGame(@Body() dto: CreateGameDto): GameState {
    return this.minesweeperService.createGame(dto);
  }

  @Get(':id')
  getGame(@Param() params: GameIdParamDto): GameState {
    return this.minesweeperService.getGame(params.id);
  }

  @Patch(':id/reveal')
  revealCell(
    @Param() params: GameIdParamDto,
    @Body() dto: CellActionDto,
  ): GameState {
    return this.minesweeperService.revealCell(
      params.id,
      dto.row,
      dto.column,
    );
  }

  @Patch(':id/flag')
  toggleFlag(
    @Param() params: GameIdParamDto,
    @Body() dto: CellActionDto,
  ): GameState {
    return this.minesweeperService.toggleFlag(
      params.id,
      dto.row,
      dto.column,
    );
  }

  @Post(':id/solve')
  autoSolve(@Param() params: GameIdParamDto): GameState {
    return this.minesweeperService.autoSolve(params.id);
  }
}
