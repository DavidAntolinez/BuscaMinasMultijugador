import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  extractRoomFromPayload,
  gameSocket,
} from '../services/gameSocket.service'
import { useGameStore } from '../stores/gameStore'
import { resolveGameEndFromRoom } from '../utils/gameEnd.utils'
import { mergeRoomFromSocketPayload } from '../utils/roomState.utils'

export function useGameSocket(roomId: string | undefined): void {
  const navigate = useNavigate()
  const playerId = useGameStore((state) => state.playerId)
  const setRoom = useGameStore((state) => state.setRoom)
  const setTurnOrder = useGameStore((state) => state.setTurnOrder)
  const setTurnRemainingMs = useGameStore((state) => state.setTurnRemainingMs)
  const setConnectionStatus = useGameStore((state) => state.setConnectionStatus)
  const setGameResult = useGameStore((state) => state.setGameResult)

  useEffect(() => {
    if (!roomId) {
      return
    }

    gameSocket.acquireSession()
    setConnectionStatus('connecting')
    gameSocket.connect()
    gameSocket.subscribeRoom(roomId, playerId)

    const syncRoomFromPayload = (payload: Record<string, unknown>) => {
      const currentRoom = useGameStore.getState().room
      const nextRoom =
        extractRoomFromPayload(payload) ??
        mergeRoomFromSocketPayload(currentRoom, payload)

      if (nextRoom) {
        setRoom(nextRoom)
        setTurnRemainingMs(nextRoom.turnRemainingMs)
        const winnerId =
          typeof payload.playerId === 'string' && nextRoom.outcome === 'victory'
            ? payload.playerId
            : undefined
        const endResult = resolveGameEndFromRoom(nextRoom, winnerId)
        if (endResult) {
          setGameResult(endResult)
          gameSocket.endRoomSession(roomId)
        }
      }
    }

    const unsubscribers = [
      gameSocket.on('room.joined', syncRoomFromPayload),
      gameSocket.on('room.left', syncRoomFromPayload),
      gameSocket.on('room.started', (payload) => {
        setGameResult(null)
        syncRoomFromPayload(payload)
        const turnOrder = payload.turnOrder
        if (Array.isArray(turnOrder)) {
          setTurnOrder(turnOrder as string[])
        }
        navigate(`/game/${roomId}`)
      }),
      gameSocket.on('turn.started', syncRoomFromPayload),
      gameSocket.on('turn.ended', syncRoomFromPayload),
      gameSocket.on('turn.timeout', syncRoomFromPayload),
      gameSocket.on('cell.revealed', syncRoomFromPayload),
      gameSocket.on('flag.placed', syncRoomFromPayload),
      gameSocket.on('flag.removed', syncRoomFromPayload),
      gameSocket.on('game.won', syncRoomFromPayload),
      gameSocket.on('game.lost', syncRoomFromPayload),
      gameSocket.on('room.finished', (payload) => {
        syncRoomFromPayload(payload)
        const room = extractRoomFromPayload(payload)
        if (room?.status === 'CANCELLED') {
          gameSocket.endRoomSession(roomId)
          navigate('/')
        }
      }),
      gameSocket.on('room.state', (payload) => {
        if (payload.status === 'connected') {
          setConnectionStatus('connected')
        } else if (payload.status === 'disconnected') {
          setConnectionStatus('disconnected')
        } else if (payload.status === 'error') {
          setConnectionStatus(
            'error',
            typeof payload.message === 'string' ? payload.message : null,
          )
        } else if (payload.id) {
          setRoom(payload as never)
          if (typeof payload.turnRemainingMs === 'number') {
            setTurnRemainingMs(payload.turnRemainingMs)
          }
        }
      }),
    ]

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
      gameSocket.unsubscribeRoom(roomId)
      gameSocket.releaseSession()
    }
  }, [
    navigate,
    playerId,
    roomId,
    setConnectionStatus,
    setGameResult,
    setRoom,
    setTurnOrder,
    setTurnRemainingMs,
  ])
}
