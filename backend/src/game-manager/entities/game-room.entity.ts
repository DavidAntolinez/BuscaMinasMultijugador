import { RoomStatus } from '../enums/room-status.enum';
import { Player } from './player.entity';

export class GameRoom {
  id: string;
  creatorId: string;
  status: RoomStatus;
  boardId: string;
  players: Player[];
  currentTurnPlayerId: string | null;
  currentTurnStartedAt: Date | null;
  maxPlayers: number;
  rows: number;
  columns: number;
  mines: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  workerId: string;

  constructor(params: {
    id: string;
    creatorId: string;
    boardId: string;
    workerId: string;
    rows: number;
    columns: number;
    mines: number;
    maxPlayers: number;
    creatorUsername: string;
  }) {
    this.id = params.id;
    this.creatorId = params.creatorId;
    this.status = RoomStatus.WAITING;
    this.boardId = params.boardId;
    this.workerId = params.workerId;
    this.rows = params.rows;
    this.columns = params.columns;
    this.mines = params.mines;
    this.maxPlayers = params.maxPlayers;
    this.players = [new Player(params.creatorId, params.creatorUsername)];
    this.currentTurnPlayerId = null;
    this.currentTurnStartedAt = null;
    this.createdAt = new Date();
    this.startedAt = null;
    this.finishedAt = null;
  }
}
