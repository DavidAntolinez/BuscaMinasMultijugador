import { describe, expect, it } from 'vitest'
import { resolveGameEndFromRoom } from './gameEnd.utils'
import type { PublicRoomState } from '../types/game.types'

const baseRoom: PublicRoomState = {
  id: 'room-1',
  creatorId: 'p1',
  status: 'FINISHED',
  boardId: 'board-1',
  players: [],
  currentTurnPlayerId: null,
  currentTurnStartedAt: null,
  turnRemainingMs: null,
  maxPlayers: 2,
  rows: 2,
  columns: 2,
  mines: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  startedAt: '2026-01-01T00:01:00.000Z',
  finishedAt: '2026-01-01T00:05:00.000Z',
  workerId: 'worker-1',
}

describe('resolveGameEndFromRoom', () => {
  it('returns defeat when room outcome is defeat', () => {
    const result = resolveGameEndFromRoom({
      ...baseRoom,
      outcome: 'defeat',
      board: [[{ row: 0, column: 0, revealed: true, flagged: false, hasMine: true }]],
    })

    expect(result?.outcome).toBe('defeat')
  })

  it('returns victory when room outcome is victory', () => {
    const result = resolveGameEndFromRoom(
      {
        ...baseRoom,
        outcome: 'victory',
        board: [[{ row: 0, column: 0, revealed: true, flagged: false }]],
      },
      'p1',
    )

    expect(result?.outcome).toBe('victory')
  })
})
