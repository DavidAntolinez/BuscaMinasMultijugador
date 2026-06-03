import { IsNotEmpty, IsString } from 'class-validator';

export class AutoSolveRoomDto {
  @IsString()
  @IsNotEmpty()
  requesterId: string;
}
