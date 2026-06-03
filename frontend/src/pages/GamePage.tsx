import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MinesweeperBoard } from '../components/game/MinesweeperBoard'
import { TurnInfo } from '../components/game/TurnInfo'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useGameSocket } from '../hooks/useGameSocket'
import { AppLayout } from '../layouts/AppLayout'
import { ApiError } from '../services/apiClient'
import { gameApi } from '../services/gameApi.service'
import { useGameStore } from '../stores/gameStore'

export function GamePage() {
  const { roomId = '' } = useParams()
  const playerId = useGameStore((state) => state.playerId)
  const room = useGameStore((state) => state.room)
  const setRoom = useGameStore((state) => state.setRoom)
  const isSubmitting = useGameStore((state) => state.isSubmitting)
  const setIsSubmitting = useGameStore((state) => state.setIsSubmitting)
  const [error, setError] = useState<string | null>(null)

  useGameSocket(roomId)

  const isMyTurn = room?.currentTurnPlayerId === playerId
  const boardDisabled = !isMyTurn || room?.status !== 'IN_PROGRESS' || isSubmitting

  const handleReveal = async (row: number, column: number) => {
    if (!roomId || boardDisabled) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const updatedRoom = await gameApi.revealCell(roomId, {
        playerId,
        row,
        column,
      })
      setRoom(updatedRoom)
    } catch (actionError) {
      setError(
        actionError instanceof ApiError
          ? actionError.message
          : 'No se pudo revelar la celda.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleFlag = async (row: number, column: number) => {
    if (!roomId || boardDisabled) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const updatedRoom = await gameApi.toggleFlag(roomId, {
        playerId,
        row,
        column,
      })
      setRoom(updatedRoom)
    } catch (actionError) {
      setError(
        actionError instanceof ApiError
          ? actionError.message
          : 'No se pudo actualizar la bandera.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!room?.board) {
    return (
      <AppLayout title="Partida">
        <LoadingSpinner label="Cargando tablero..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Partida en curso" subtitle={`Sala ${room.id}`}>
      <TurnInfo />
      {error ? <ErrorMessage message={error} /> : null}
      <MinesweeperBoard
        board={room.board}
        disabled={boardDisabled}
        onReveal={handleReveal}
        onToggleFlag={handleToggleFlag}
      />
    </AppLayout>
  )
}
