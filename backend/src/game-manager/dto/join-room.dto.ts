import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsString()
  @MinLength(2)
  username: string;
}
