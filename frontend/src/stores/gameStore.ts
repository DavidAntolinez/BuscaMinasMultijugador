import { create } from 'zustand'
import type {
  ConnectionStatus,
  GameResult,
  PublicRoomState,
} from '../types/game.types'
import {
  getOrCreatePlayerId,
  getStoredUsername,
  saveUsername,
} from '../utils/storage.utils'

interface GameStore {
  playerId: string
  username: string
  room: PublicRoomState | null
  turnOrder: string[]
  turnRemainingMs: number | null
  connectionStatus: ConnectionStatus
  connectionError: string | null
  gameResult: GameResult | null
  isSubmitting: boolean
  setUsername: (username: string) => void
  setRoom: (room: PublicRoomState | null) => void
  setTurnOrder: (turnOrder: string[]) => void
  setTurnRemainingMs: (value: number | null) => void
  setConnectionStatus: (status: ConnectionStatus, error?: string | null) => void
  setGameResult: (result: GameResult | null) => void
  setIsSubmitting: (value: boolean) => void
  resetSession: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  playerId: getOrCreatePlayerId(),
  username: getStoredUsername(),
  room: null,
  turnOrder: [],
  turnRemainingMs: null,
  connectionStatus: 'disconnected',
  connectionError: null,
  gameResult: null,
  isSubmitting: false,
  setUsername: (username) => {
    saveUsername(username)
    set({ username })
  },
  setRoom: (room) => set({ room }),
  setTurnOrder: (turnOrder) => set({ turnOrder }),
  setTurnRemainingMs: (turnRemainingMs) => set({ turnRemainingMs }),
  setConnectionStatus: (connectionStatus, connectionError = null) =>
    set({ connectionStatus, connectionError }),
  setGameResult: (gameResult) => set({ gameResult }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  resetSession: () =>
    set({
      room: null,
      turnOrder: [],
      turnRemainingMs: null,
      connectionStatus: 'disconnected',
      connectionError: null,
      gameResult: null,
      isSubmitting: false,
    }),
}))
