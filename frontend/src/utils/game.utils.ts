import type { GameResult, PublicCell, PublicRoomState } from '../types/game.types'

export function countRevealedCells(board?: PublicCell[][]): number {
  if (!board) {
    return 0
  }

  return board.flat().filter((cell) => cell.revealed && !cell.hasMine).length
}

export function countFoundMines(board?: PublicCell[][]): number {
  if (!board) {
    return 0
  }

  return board.flat().filter((cell) => cell.flagged && cell.hasMine).length
}

export function buildGameResult(
  room: PublicRoomState,
  outcome: 'victory' | 'defeat',
  winnerId?: string | null,
): GameResult {
  const winner = room.players.find((player) => player.id === winnerId) ?? null
  const startedAt = room.startedAt ? new Date(room.startedAt).getTime() : Date.now()
  const finishedAt = room.finishedAt
    ? new Date(room.finishedAt).getTime()
    : Date.now()

  return {
    outcome,
    winnerId: winner?.id ?? null,
    winnerUsername: winner?.username ?? null,
    revealedCells: countRevealedCells(room.board),
    foundMines: countFoundMines(room.board),
    totalDurationMs: Math.max(0, finishedAt - startedAt),
  }
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

export function getCreatorUsername(room: PublicRoomState): string {
  return (
    room.players.find((player) => player.id === room.creatorId)?.username ??
    'Desconocido'
  )
}
