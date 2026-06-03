import { describe, expect, it } from 'vitest'
import type { PublicRoomState } from '../types/game.types'
import { mergeRoomFromSocketPayload } from './roomState.utils'

const baseRoom = (): PublicRoomState => ({
  id: 'room-1',
  creatorId: 'p1',
  status: 'IN_PROGRESS',
  boardId: 'board-1',
  players: [],
  currentTurnPlayerId: 'p1',
  currentTurnStartedAt: '2026-01-01T00:00:00.000Z',
  turnRemainingMs: 120000,
  maxPlayers: 4,
  rows: 3,
  columns: 3,
  mines: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  startedAt: '2026-01-01T00:00:00.000Z',
  finishedAt: null,
  workerId: 'worker-1',
})

describe('mergeRoomFromSocketPayload', () => {
  it('uses embedded room when present', () => {
    const embedded = { ...baseRoom(), currentTurnPlayerId: 'p2' }
    const merged = mergeRoomFromSocketPayload(baseRoom(), { room: embedded })

    expect(merged?.currentTurnPlayerId).toBe('p2')
  })

  it('updates turn fields from turn.started payload without room', () => {
    const merged = mergeRoomFromSocketPayload(baseRoom(), {
      playerId: 'p2',
      startedAt: '2026-01-01T00:02:00.000Z',
      remainingMs: 120000,
    })

    expect(merged?.currentTurnPlayerId).toBe('p2')
    expect(merged?.currentTurnStartedAt).toBe('2026-01-01T00:02:00.000Z')
    expect(merged?.turnRemainingMs).toBe(120000)
  })

  it('merges board updates from cell.revealed payload', () => {
    const board = [[{ row: 0, column: 0, revealed: true, flagged: false }]]
    const merged = mergeRoomFromSocketPayload(baseRoom(), { board })

    expect(merged?.board).toEqual(board)
  })
})
