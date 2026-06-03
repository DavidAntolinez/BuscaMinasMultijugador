import type {
  CellActionPayload,
  CreateRoomPayload,
  JoinRoomPayload,
  PublicRoomState,
} from '../types/game.types'
import { apiRequest } from './apiClient'

export const gameApi = {
  createRoom(payload: CreateRoomPayload): Promise<PublicRoomState> {
    return apiRequest('/game-manager/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  listWaitingRooms(): Promise<PublicRoomState[]> {
    return apiRequest('/game-manager/rooms?status=WAITING')
  },

  getRoom(roomId: string): Promise<PublicRoomState> {
    return apiRequest(`/game-manager/rooms/${roomId}`)
  },

  joinRoom(roomId: string, payload: JoinRoomPayload): Promise<PublicRoomState> {
    return apiRequest(`/game-manager/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  leaveRoom(roomId: string, playerId: string): Promise<PublicRoomState> {
    return apiRequest(`/game-manager/rooms/${roomId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    })
  },

  startRoom(roomId: string, requesterId: string): Promise<PublicRoomState> {
    return apiRequest(`/game-manager/rooms/${roomId}/start`, {
      method: 'POST',
      body: JSON.stringify({ requesterId }),
    })
  },

  revealCell(roomId: string, payload: CellActionPayload): Promise<PublicRoomState> {
    return apiRequest(`/game-manager/rooms/${roomId}/reveal`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  toggleFlag(roomId: string, payload: CellActionPayload): Promise<PublicRoomState> {
    return apiRequest(`/game-manager/rooms/${roomId}/flag`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  autoSolveRoom(roomId: string, requesterId: string): Promise<PublicRoomState> {
    return apiRequest(`/game-manager/rooms/${roomId}/auto-solve`, {
      method: 'POST',
      body: JSON.stringify({ requesterId }),
    })
  },
}
