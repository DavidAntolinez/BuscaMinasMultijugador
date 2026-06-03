import { describe, expect, it } from 'vitest'
import {
  formatQueuePosition,
  formatTurnStatus,
  getTurnQueueStatus,
} from './turn.utils'

describe('turn.utils', () => {
  it('detects current turn', () => {
    const status = getTurnQueueStatus(['p1', 'p2', 'p3'], 'p2', 'p2')
    expect(formatTurnStatus(status)).toBe('Es tu turno')
  })

  it('detects next player', () => {
    const status = getTurnQueueStatus(['p1', 'p2', 'p3'], 'p1', 'p2')
    expect(formatQueuePosition(status)).toBe('Eres el siguiente jugador')
  })

  it('detects waiting players ahead', () => {
    const status = getTurnQueueStatus(['p1', 'p2', 'p3'], 'p1', 'p3')
    expect(formatQueuePosition(status)).toBe('Faltan 1 jugador para tu turno')
  })
})
