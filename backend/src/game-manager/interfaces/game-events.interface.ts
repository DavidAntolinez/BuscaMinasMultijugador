export interface GameSocketData {
  playerId?: string;
  roomId?: string;
  connectedAt?: string;
}

export interface ClientToGameEvents {
  'game:subscribe': (payload: {
    roomId: string;
    playerId: string;
  }) => void;
  'game:unsubscribe': (payload: { roomId: string }) => void;
}

export interface GameToClientEvents {
  'room.created': (payload: Record<string, unknown>) => void;
  'room.joined': (payload: Record<string, unknown>) => void;
  'room.left': (payload: Record<string, unknown>) => void;
  'room.started': (payload: Record<string, unknown>) => void;
  'room.finished': (payload: Record<string, unknown>) => void;
  'turn.started': (payload: Record<string, unknown>) => void;
  'turn.ended': (payload: Record<string, unknown>) => void;
  'turn.timeout': (payload: Record<string, unknown>) => void;
  'cell.revealed': (payload: Record<string, unknown>) => void;
  'flag.placed': (payload: Record<string, unknown>) => void;
  'flag.removed': (payload: Record<string, unknown>) => void;
  'game.won': (payload: Record<string, unknown>) => void;
  'game.lost': (payload: Record<string, unknown>) => void;
  'room.state': (payload: Record<string, unknown>) => void;
  'game:error': (payload: { message: string }) => void;
}

export interface GameInterServerEvents {
  ping: () => void;
}
