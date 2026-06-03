import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ioMock = vi.fn()

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => ioMock(...args),
}))

describe('gameSocket.service lifecycle', () => {
  beforeEach(() => {
    vi.resetModules()
    ioMock.mockReset()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('creates socket with autoConnect disabled', async () => {
    const fakeSocket = {
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      io: { opts: { reconnection: true } },
    }

    ioMock.mockReturnValue(fakeSocket)

    const { gameSocket } = await import('./gameSocket.service')
    gameSocket.acquireSession()
    gameSocket.connect()

    expect(ioMock).toHaveBeenCalledWith(
      expect.stringContaining('/game'),
      expect.objectContaining({
        autoConnect: false,
        reconnection: true,
      }),
    )
    expect(fakeSocket.connect).toHaveBeenCalled()
  })

  it('disables reconnection on intentional disconnect', async () => {
    const fakeSocket = {
      connected: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      io: { opts: { reconnection: true } },
    }

    ioMock.mockReturnValue(fakeSocket)

    const { gameSocket } = await import('./gameSocket.service')
    gameSocket.acquireSession()
    gameSocket.connect()
    gameSocket.disconnect()

    expect(fakeSocket.io.opts.reconnection).toBe(false)
    expect(fakeSocket.disconnect).toHaveBeenCalled()
  })
})

describe('extractRoomFromPayload', () => {
  it('extracts embedded room', async () => {
    const { extractRoomFromPayload } = await import('./gameSocket.service')
    const room = { id: 'room-1', status: 'WAITING' }
    expect(extractRoomFromPayload({ room })).toEqual(room)
    expect(extractRoomFromPayload({})).toBeNull()
  })
})
