import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlayerList } from '../components/game/PlayerList'
import { RoomInfo } from '../components/game/RoomInfo'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useGameSocket } from '../hooks/useGameSocket'
import { AppLayout } from '../layouts/AppLayout'
import { ApiError } from '../services/apiClient'
import { gameApi } from '../services/gameApi.service'
import { useGameStore } from '../stores/gameStore'

export function WaitingRoomPage() {
  const { roomId = '' } = useParams()
  const navigate = useNavigate()
  const playerId = useGameStore((state) => state.playerId)
  const room = useGameStore((state) => state.room)
  const setRoom = useGameStore((state) => state.setRoom)
  const connectionStatus = useGameStore((state) => state.connectionStatus)
  const isSubmitting = useGameStore((state) => state.isSubmitting)
  const setIsSubmitting = useGameStore((state) => state.setIsSubmitting)
  const [error, setError] = useState<string | null>(null)

  useGameSocket(roomId)

  useEffect(() => {
    if (!roomId) {
      return
    }

    void gameApi
      .getRoom(roomId)
      .then(setRoom)
      .catch(() => setError('No se pudo cargar la sala.'))
  }, [roomId, setRoom])

  useEffect(() => {
    if (room?.status === 'IN_PROGRESS') {
      navigate(`/game/${room.id}`)
    }
  }, [navigate, room])

  const handleStart = async () => {
    if (!roomId) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const updatedRoom = await gameApi.startRoom(roomId, playerId)
      setRoom(updatedRoom)
      navigate(`/game/${roomId}`)
    } catch (startError) {
      setError(
        startError instanceof ApiError
          ? startError.message
          : 'No se pudo iniciar la partida.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!room) {
    return (
      <AppLayout title="Sala de espera">
        {error ? <ErrorMessage message={error} /> : <LoadingSpinner />}
      </AppLayout>
    )
  }

  const isCreator = room.creatorId === playerId

  return (
    <AppLayout
      title="Sala de espera"
      subtitle={`Conexión WebSocket: ${connectionStatus}`}
    >
      <RoomInfo room={room} />
      <PlayerList players={room.players} />
      {error ? <ErrorMessage message={error} /> : null}

      {isCreator ? (
        <Button disabled={isSubmitting} onClick={() => void handleStart()}>
          {isSubmitting ? 'Iniciando...' : 'Iniciar Partida'}
        </Button>
      ) : (
        <p className="waiting-message">
          Esperando a que el creador inicie la partida...
        </p>
      )}
    </AppLayout>
  )
}
