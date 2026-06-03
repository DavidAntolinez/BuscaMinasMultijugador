import { describe, expect, it } from 'vitest'
import { extractRoomFromPayload } from './gameSocket.service'

describe('gameSocket.service', () => {
  it('extracts room from nested payload', () => {
    const room = {
      id: 'room-1',
      status: 'WAITING',
    }

    expect(extractRoomFromPayload({ room })).toEqual(room)
    expect(extractRoomFromPayload({})).toBeNull()
  })
})
