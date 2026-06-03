import { IsNotEmpty, IsString } from 'class-validator';

export class StartRoomDto {
  @IsString()
  @IsNotEmpty()
  requesterId: string;
}
