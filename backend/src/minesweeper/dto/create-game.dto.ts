import { IsInt, Max, Min } from 'class-validator';

export class CreateGameDto {
  @IsInt()
  @Min(1)
  @Max(50)
  rows: number;

  @IsInt()
  @Min(1)
  @Max(50)
  columns: number;

  @IsInt()
  @Min(1)
  mines: number;
}
