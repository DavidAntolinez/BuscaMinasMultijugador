import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ApiError } from '../services/apiClient'
import { gameApi } from '../services/gameApi.service'
import { useGameStore } from '../stores/gameStore'
import type { PublicRoomState } from '../types/game.types'

export function SearchGamePanel({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const playerId = useGameStore((state) => state.playerId)
  const username = useGameStore((state) => state.username)
  const setRoom = useGameStore((state) => state.setRoom)
  const isSubmitting = useGameStore((state) => state.isSubmitting)
  const setIsSubmitting = useGameStore((state) => state.setIsSubmitting)
  const [rooms, setRooms] = useState<PublicRoomState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)

  const loadRooms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const waitingRooms = await gameApi.listWaitingRooms()
      setRooms(waitingRooms)
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : 'No se pudieron cargar las salas.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

  const handleJoin = async (roomId: string) => {
    setJoinError(null)
    setIsSubmitting(true)
    try {
      const room = await gameApi.joinRoom(roomId, {
        playerId,
        username,
      })
      setRoom(room)
      navigate(`/waiting/${room.id}`)
    } catch (joinFailure) {
      setJoinError(
        joinFailure instanceof ApiError
          ? joinFailure.message
          : 'No se pudo unir a la sala.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel__actions panel__actions--start">
        <Button variant="ghost" onClick={onBack}>
          Volver
        </Button>
        <Button variant="secondary" onClick={() => void loadRooms()}>
          Actualizar
        </Button>
      </div>

      {loading ? <LoadingSpinner label="Buscando partidas..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}
      {joinError ? <ErrorMessage message={joinError} /> : null}

      {!loading && !error && rooms.length === 0 ? (
        <EmptyState
          title="No hay salas disponibles"
          description="Crea una partida nueva o vuelve a intentarlo más tarde."
        />
      ) : null}

      <ul className="room-list">
        {rooms.map((room) => (
          <li key={room.id} className="room-list__item">
            <div>
              <strong>{room.id}</strong>
              <p>
                {room.players.length}/{room.maxPlayers} jugadores · {room.rows}x
                {room.columns} · {room.mines} minas · {room.status}
              </p>
            </div>
            <Button disabled={isSubmitting} onClick={() => void handleJoin(room.id)}>
              Unirse
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
