import type { GameResult, PublicRoomState } from '../types/game.types'
import { buildGameResult } from './game.utils'

export function resolveGameEndFromRoom(
  room: PublicRoomState,
  winnerId?: string | null,
): GameResult | null {
  if (room.outcome === 'victory' || room.outcome === 'defeat') {
    return buildGameResult(room, room.outcome, winnerId)
  }

  if (room.status !== 'FINISHED') {
    return null
  }

  const inferred = inferOutcomeFromBoard(room.board)
  if (!inferred) {
    return null
  }

  return buildGameResult(room, inferred, winnerId)
}

function inferOutcomeFromBoard(
  board: PublicRoomState['board'],
): 'victory' | 'defeat' | null {
  if (!board) {
    return null
  }

  const cells = board.flat()
  if (cells.some((cell) => cell.revealed && cell.hasMine)) {
    return 'defeat'
  }

  if (cells.some((cell) => !cell.revealed && cell.hasMine)) {
    return 'defeat'
  }

  return 'victory'
}
