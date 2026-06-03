import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class PlayerCellActionDto {
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @IsInt()
  @Min(0)
  row: number;

  @IsInt()
  @Min(0)
  column: number;
}
