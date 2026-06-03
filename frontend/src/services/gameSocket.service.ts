import { io, type Socket } from 'socket.io-client'
import { env } from '../config/env'
import type { GameSocketEvent, PublicRoomState } from '../types/game.types'

type EventHandler = (payload: Record<string, unknown>) => void

class GameSocketService {
  private socket: Socket | null = null
  private readonly handlers = new Map<GameSocketEvent, Set<EventHandler>>()

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(`${env.wsUrl}/game`, {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
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

    const events: GameSocketEvent[] = [
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

    for (const eventName of events) {
      this.socket.on(eventName, (payload: Record<string, unknown>) => {
        this.dispatch(eventName, payload)
      })
    }

    return this.socket
  }

  subscribeRoom(roomId: string, playerId: string): void {
    const socket = this.connect()
    socket.emit('game:subscribe', { roomId, playerId })
  }

  unsubscribeRoom(roomId: string): void {
    this.socket?.emit('game:unsubscribe', { roomId })
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
    this.handlers.clear()
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected)
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
