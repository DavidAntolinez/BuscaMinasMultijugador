import { io, type Socket } from 'socket.io-client'
import { env } from '../config/env'
import type { GameSocketEvent, PublicRoomState } from '../types/game.types'

type EventHandler = (payload: Record<string, unknown>) => void

const SERVER_EVENTS: GameSocketEvent[] = [
  'room.created',
  'room.joined',
  'room.left',
  'room.started',
  'room.finished',
  'turn.started',
  'turn.ended',
  'turn.timeout',
  'cell.revealed',
  'flag.placed',
  'flag.removed',
  'game.won',
  'game.lost',
  'room.state',
]

/**
 * Socket lifecycle:
 * - No connection on app load (autoConnect: false).
 * - connect() only from useGameSocket / subscribeRoom while in waiting or game.
 * - disconnect() on leave route, game end, or menu — disables reconnection.
 * - reconnection: true only while session active (backend restart during play).
 */
class GameSocketService {
  private socket: Socket | null = null
  private subscribedRoomId: string | null = null
  private subscribedPlayerId: string | null = null
  private readonly handlers = new Map<GameSocketEvent, Set<EventHandler>>()
  private sessionRefCount = 0
  private listenersAttached = false

  acquireSession(): void {
    this.sessionRefCount += 1
  }

  releaseSession(): void {
    this.sessionRefCount = Math.max(0, this.sessionRefCount - 1)
    if (this.sessionRefCount === 0) {
      this.disconnect()
    }
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    if (!this.socket) {
      this.socket = io(`${env.wsUrl}/game`, {
        autoConnect: false,
        reconnection: true,
        transports: ['websocket'],
      })
      this.attachSocketListeners()
    }

    this.socket.io.opts.reconnection = true
    if (!this.socket.connected) {
      this.socket.connect()
    }

    return this.socket
  }

  subscribeRoom(roomId: string, playerId: string): void {
    const socket = this.connect()
    if (this.subscribedRoomId && this.subscribedRoomId !== roomId) {
      this.unsubscribeRoom(this.subscribedRoomId)
    }
    this.subscribedRoomId = roomId
    this.subscribedPlayerId = playerId
    socket.emit('game:subscribe', { roomId, playerId })
  }

  unsubscribeRoom(roomId: string): void {
    if (!this.socket?.connected) {
      if (this.subscribedRoomId === roomId) {
        this.subscribedRoomId = null
        this.subscribedPlayerId = null
      }
      return
    }

    this.socket.emit('game:unsubscribe', { roomId })
    if (this.subscribedRoomId === roomId) {
      this.subscribedRoomId = null
      this.subscribedPlayerId = null
    }
  }

  endRoomSession(roomId: string): void {
    this.unsubscribeRoom(roomId)
    this.sessionRefCount = 0
    this.disconnect()
  }

  on(event: GameSocketEvent, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  disconnect(): void {
    if (this.subscribedRoomId) {
      this.unsubscribeRoom(this.subscribedRoomId)
    }

    this.subscribedPlayerId = null
    this.sessionRefCount = 0

    if (this.socket) {
      this.socket.io.opts.reconnection = false
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.listenersAttached = false
    }
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected)
  }

  private attachSocketListeners(): void {
    if (!this.socket || this.listenersAttached) {
      return
    }

    this.listenersAttached = true

    this.socket.on('connect', () => {
      this.resubscribeIfNeeded()
      this.emitLocal('room.state', { status: 'connected' })
    })

    this.socket.on('disconnect', () => {
      this.emitLocal('room.state', { status: 'disconnected' })
    })

    this.socket.on('connect_error', (error: Error) => {
      this.emitLocal('room.state', {
        status: 'error',
        message: error.message,
      })
    })

    for (const eventName of SERVER_EVENTS) {
      this.socket.on(eventName, (payload: Record<string, unknown>) => {
        this.dispatch(eventName, payload)
      })
    }
  }

  private resubscribeIfNeeded(): void {
    if (!this.socket?.connected || !this.subscribedRoomId || !this.subscribedPlayerId) {
      return
    }

    this.socket.emit('game:subscribe', {
      roomId: this.subscribedRoomId,
      playerId: this.subscribedPlayerId,
    })
  }

  private dispatch(event: GameSocketEvent, payload: Record<string, unknown>): void {
    const handlers = this.handlers.get(event)
    if (!handlers) {
      return
    }

    for (const handler of handlers) {
      handler(payload)
    }
  }

  private emitLocal(event: GameSocketEvent, payload: Record<string, unknown>): void {
    this.dispatch(event, payload)
  }
}

export const gameSocket = new GameSocketService()

export function extractRoomFromPayload(
  payload: Record<string, unknown>,
): PublicRoomState | null {
  if (payload.room && typeof payload.room === 'object') {
    return payload.room as PublicRoomState
  }
  return null
}
