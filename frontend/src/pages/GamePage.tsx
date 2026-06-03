import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AutoSolveButton } from '../components/game/AutoSolveButton'
import { GameFinishedBanner } from '../components/game/GameFinishedBanner'
import { MinesweeperBoard } from '../components/game/MinesweeperBoard'
import { TurnInfo } from '../components/game/TurnInfo'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useGameSocket } from '../hooks/useGameSocket'
import { AppLayout } from '../layouts/AppLayout'
import { ApiError } from '../services/apiClient'
import { gameApi } from '../services/gameApi.service'
import { useGameStore } from '../stores/gameStore'
import type { PublicRoomState } from '../types/game.types'
import { resolveGameEndFromRoom } from '../utils/gameEnd.utils'

export function GamePage() {
  const { roomId = '' } = useParams()
  const playerId = useGameStore((state) => state.playerId)
  const room = useGameStore((state) => state.room)
  const setRoom = useGameStore((state) => state.setRoom)
  const gameResult = useGameStore((state) => state.gameResult)
  const setGameResult = useGameStore((state) => state.setGameResult)
  const isSubmitting = useGameStore((state) => state.isSubmitting)
  const setIsSubmitting = useGameStore((state) => state.setIsSubmitting)
  const [error, setError] = useState<string | null>(null)
  const [isAutoSolving, setIsAutoSolving] = useState(false)

  useGameSocket(roomId)

  const applyRoomUpdate = (updatedRoom: PublicRoomState, winnerId?: string | null) => {
    setRoom(updatedRoom)
    const endResult = resolveGameEndFromRoom(updatedRoom, winnerId)
    if (endResult) {
      setGameResult(endResult)
    }
  }

  const isGameFinished =
    Boolean(gameResult) || room?.status === 'FINISHED' || Boolean(room?.outcome)
  const isMyTurn = room?.currentTurnPlayerId === playerId
  const isCreator = room?.creatorId === playerId
  const canAutoSolve =
    isCreator && room?.status === 'IN_PROGRESS' && !isGameFinished
  const boardDisabled =
    isGameFinished ||
    !isMyTurn ||
    room?.status !== 'IN_PROGRESS' ||
    isSubmitting ||
    isAutoSolving

  const handleAutoSolve = async () => {
    if (!roomId || !canAutoSolve || isAutoSolving) {
      return
    }

    setIsAutoSolving(true)
    setError(null)
    try {
      const updatedRoom = await gameApi.autoSolveRoom(roomId, playerId)
      applyRoomUpdate(
        updatedRoom,
        updatedRoom.outcome === 'victory' ? playerId : undefined,
      )
    } catch (actionError) {
      setError(
        actionError instanceof ApiError
          ? actionError.message
          : 'No se pudo autoresolver la partida.',
      )
    } finally {
      setIsAutoSolving(false)
    }
  }

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
      applyRoomUpdate(
        updatedRoom,
        updatedRoom.outcome === 'victory' ? playerId : undefined,
      )
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
      applyRoomUpdate(updatedRoom)
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
    <AppLayout
      title={isGameFinished ? 'Partida finalizada' : 'Partida en curso'}
      subtitle={`Sala ${room.id}`}
    >
      {gameResult ? <GameFinishedBanner result={gameResult} /> : null}
      {!isGameFinished ? <TurnInfo /> : null}
      {canAutoSolve ? (
        <AutoSolveButton
          disabled={isSubmitting}
          loading={isAutoSolving}
          onAutoSolve={handleAutoSolve}
        />
      ) : null}
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
