import { PublicRoomState } from './public-room-state.interface';

export type WorkerCommandType =
  | 'INIT'
  | 'JOIN'
  | 'LEAVE'
  | 'START'
  | 'REVEAL'
  | 'FLAG'
  | 'DISCONNECT'
  | 'RECONNECT'
  | 'SHUTDOWN'
  | 'GET_STATE';

export interface WorkerInitPayload {
  roomId: string;
  workerId: string;
  creatorId: string;
  creatorUsername: string;
  rows: number;
  columns: number;
  mines: number;
  maxPlayers: number;
}

export interface WorkerJoinPayload {
  playerId: string;
  username: string;
}

export interface WorkerLeavePayload {
  playerId: string;
}

export interface WorkerStartPayload {
  requesterId: string;
}

export interface WorkerRevealPayload {
  playerId: string;
  row: number;
  column: number;
}

export interface WorkerFlagPayload {
  playerId: string;
  row: number;
  column: number;
}

export interface WorkerPlayerPayload {
  playerId: string;
}

export type WorkerCommandPayload =
  | WorkerInitPayload
  | WorkerJoinPayload
  | WorkerLeavePayload
  | WorkerStartPayload
  | WorkerRevealPayload
  | WorkerFlagPayload
  | WorkerPlayerPayload
  | Record<string, never>;

export interface WorkerCommandMessage {
  correlationId: string;
  command: WorkerCommandType;
  payload: WorkerCommandPayload;
}

export interface WorkerResponseMessage {
  correlationId: string;
  success: boolean;
  room?: PublicRoomState;
  error?: string;
}

export type WorkerEventType =
  | 'room.created'
  | 'room.joined'
  | 'room.left'
  | 'room.started'
  | 'room.finished'
  | 'turn.started'
  | 'turn.ended'
  | 'turn.timeout'
  | 'cell.revealed'
  | 'flag.placed'
  | 'flag.removed'
  | 'game.won'
  | 'game.lost';

export interface WorkerEventMessage {
  type: 'event';
  event: WorkerEventType;
  roomId: string;
  payload: Record<string, unknown>;
}

export interface WorkerReadyMessage {
  type: 'ready';
  roomId: string;
  workerId: string;
}

export interface WorkerErrorMessage {
  type: 'error';
  roomId: string;
  workerId: string;
  error: string;
}

export type WorkerOutboundMessage =
  | WorkerResponseMessage
  | WorkerEventMessage
  | WorkerReadyMessage
  | WorkerErrorMessage;

export interface PendingWorkerRequest {
  resolve: (response: WorkerResponseMessage) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}
