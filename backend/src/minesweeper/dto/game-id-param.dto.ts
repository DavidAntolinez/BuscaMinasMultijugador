import { IsUUID } from 'class-validator';

export class GameIdParamDto {
  @IsUUID('4')
  id: string;
}
