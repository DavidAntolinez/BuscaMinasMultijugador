import { IsInt, Min } from 'class-validator';

export class CellActionDto {
  @IsInt()
  @Min(0)
  row: number;

  @IsInt()
  @Min(0)
  column: number;
}
