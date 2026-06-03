import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @IsString()
  @MinLength(2)
  creatorUsername: string;

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

  @IsInt()
  @Min(1)
  @Max(20)
  maxPlayers: number;
}
