import { RoomStatus } from '../enums/room-status.enum';
import { PublicCell } from '../../minesweeper/interfaces/public-cell.interface';

export interface PublicPlayer {
  id: string;
  username: string;
  joinedAt: string;
  isConnected: boolean;
  score: number;
  turnsPlayed: number;
}

export interface PublicRoomState {
  id: string;
  creatorId: string;
  status: RoomStatus;
  boardId: string;
  players: PublicPlayer[];
  currentTurnPlayerId: string | null;
  currentTurnStartedAt: string | null;
  turnRemainingMs: number | null;
  maxPlayers: number;
  rows: number;
  columns: number;
  mines: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  workerId: string;
  board?: PublicCell[][];
  outcome?: 'victory' | 'defeat';
}
