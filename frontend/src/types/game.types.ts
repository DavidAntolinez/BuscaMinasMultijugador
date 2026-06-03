export type RoomStatus =
  | 'WAITING'
  | 'STARTING'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'FINISHED'
  | 'CANCELLED'

export interface PublicPlayer {
  id: string
  username: string
  joinedAt: string
  isConnected: boolean
  score: number
  turnsPlayed: number
}

export interface PublicCell {
  row: number
  column: number
  revealed: boolean
  flagged: boolean
  adjacentMines?: number
  hasMine?: boolean
}

export interface PublicRoomState {
  id: string
  creatorId: string
  status: RoomStatus
  boardId: string
  players: PublicPlayer[]
  currentTurnPlayerId: string | null
  currentTurnStartedAt: string | null
  turnRemainingMs: number | null
  maxPlayers: number
  rows: number
  columns: number
  mines: number
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  workerId: string
  board?: PublicCell[][]
  outcome?: 'victory' | 'defeat'
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface GameResult {
  outcome: 'victory' | 'defeat'
  winnerId: string | null
  winnerUsername: string | null
  revealedCells: number
  foundMines: number
  totalDurationMs: number
}

export interface CreateRoomPayload {
  creatorId: string
  creatorUsername: string
  rows: number
  columns: number
  mines: number
  maxPlayers: number
}

export interface JoinRoomPayload {
  playerId: string
  username: string
}

export interface CellActionPayload {
  playerId: string
  row: number
  column: number
}

export interface CreateRoomFormValues {
  rows: string
  columns: string
  mines: string
  maxPlayers: string
}

export type GameSocketEvent =
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
  | 'game.lost'
  | 'room.state'
