import type { PublicCell, PublicRoomState } from '../types/game.types'
import { extractRoomFromPayload } from '../services/gameSocket.service'

export function mergeRoomFromSocketPayload(
  currentRoom: PublicRoomState | null,
  payload: Record<string, unknown>,
): PublicRoomState | null {
  const embeddedRoom = extractRoomFromPayload(payload)
  if (embeddedRoom) {
    return embeddedRoom
  }

  if (!currentRoom) {
    return null
  }

  if (
    typeof payload.playerId === 'string' &&
    (typeof payload.startedAt === 'string' ||
      typeof payload.remainingMs === 'number')
  ) {
    return {
      ...currentRoom,
      currentTurnPlayerId: payload.playerId,
      currentTurnStartedAt:
        typeof payload.startedAt === 'string'
          ? payload.startedAt
          : currentRoom.currentTurnStartedAt,
      turnRemainingMs:
        typeof payload.remainingMs === 'number'
          ? payload.remainingMs
          : currentRoom.turnRemainingMs,
    }
  }

  if (Array.isArray(payload.board)) {
    return {
      ...currentRoom,
      board: payload.board as PublicCell[][],
    }
  }

  return null
}

export function applySocketPayloadToRoom(
  currentRoom: PublicRoomState | null,
  payload: Record<string, unknown>,
): PublicRoomState | null {
  return mergeRoomFromSocketPayload(currentRoom, payload)
}
