import { IsEnum, IsOptional } from 'class-validator';
import { RoomStatus } from '../enums/room-status.enum';

export class ListRoomsQueryDto {
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;
}
