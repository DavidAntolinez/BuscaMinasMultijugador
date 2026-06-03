import { IsUUID } from 'class-validator';

export class RoomIdParamDto {
  @IsUUID('4')
  id: string;
}
