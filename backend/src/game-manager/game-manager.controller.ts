import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { ListRoomsQueryDto } from './dto/list-rooms-query.dto';
import { PlayerCellActionDto } from './dto/player-cell-action.dto';
import { RoomIdParamDto } from './dto/room-id-param.dto';
import { StartRoomDto } from './dto/start-room.dto';
import type { PublicRoomState } from './interfaces/public-room-state.interface';
import { GameManagerService } from './services/game-manager.service';

@Controller('game-manager/rooms')
export class GameManagerController {
  constructor(private readonly gameManagerService: GameManagerService) {}

  @Post()
  createRoom(@Body() dto: CreateRoomDto): Promise<PublicRoomState> {
    return this.gameManagerService.createRoom(dto);
  }

  @Get()
  listRooms(@Query() query: ListRoomsQueryDto): PublicRoomState[] {
    return this.gameManagerService.listRooms(query.status);
  }

  @Get(':id')
  getRoom(@Param() params: RoomIdParamDto): PublicRoomState {
    return this.gameManagerService.getRoom(params.id);
  }

  @Post(':id/join')
  joinRoom(
    @Param() params: RoomIdParamDto,
    @Body() dto: JoinRoomDto,
  ): Promise<PublicRoomState> {
    return this.gameManagerService.joinRoom(params.id, dto);
  }

  @Post(':id/leave')
  leaveRoom(
    @Param() params: RoomIdParamDto,
    @Body('playerId') playerId: string,
  ): Promise<PublicRoomState> {
    return this.gameManagerService.leaveRoom(params.id, playerId);
  }

  @Post(':id/start')
  startRoom(
    @Param() params: RoomIdParamDto,
    @Body() dto: StartRoomDto,
  ): Promise<PublicRoomState> {
    return this.gameManagerService.startRoom(params.id, dto);
  }

  @Patch(':id/reveal')
  revealCell(
    @Param() params: RoomIdParamDto,
    @Body() dto: PlayerCellActionDto,
  ): Promise<PublicRoomState> {
    return this.gameManagerService.revealCell(params.id, dto);
  }

  @Patch(':id/flag')
  toggleFlag(
    @Param() params: RoomIdParamDto,
    @Body() dto: PlayerCellActionDto,
  ): Promise<PublicRoomState> {
    return this.gameManagerService.toggleFlag(params.id, dto);
  }
}
