import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { Input } from '../components/ui/Input'
import { ApiError } from '../services/apiClient'
import { gameApi } from '../services/gameApi.service'
import { useGameStore } from '../stores/gameStore'
import type { CreateRoomFormValues } from '../types/game.types'
import {
  hasValidationErrors,
  validateCreateRoomForm,
} from '../utils/validation.utils'

const initialValues: CreateRoomFormValues = {
  rows: '10',
  columns: '10',
  mines: '15',
  maxPlayers: '4',
}

export function CreateGamePanel({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const playerId = useGameStore((state) => state.playerId)
  const username = useGameStore((state) => state.username)
  const setRoom = useGameStore((state) => state.setRoom)
  const isSubmitting = useGameStore((state) => state.isSubmitting)
  const setIsSubmitting = useGameStore((state) => state.setIsSubmitting)
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ReturnType<typeof validateCreateRoomForm>>(
    {},
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateCreateRoomForm(values)
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const room = await gameApi.createRoom({
        creatorId: playerId,
        creatorUsername: username,
        rows: Number.parseInt(values.rows, 10),
        columns: Number.parseInt(values.columns, 10),
        mines: Number.parseInt(values.mines, 10),
        maxPlayers: Number.parseInt(values.maxPlayers, 10),
      })
      setRoom(room)
      navigate(`/waiting/${room.id}`)
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'No se pudo crear la partida.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <Input
        label="Filas"
        type="number"
        min={1}
        value={values.rows}
        error={errors.rows}
        onChange={(event) => setValues({ ...values, rows: event.target.value })}
      />
      <Input
        label="Columnas"
        type="number"
        min={1}
        value={values.columns}
        error={errors.columns}
        onChange={(event) =>
          setValues({ ...values, columns: event.target.value })
        }
      />
      <Input
        label="Minas"
        type="number"
        min={1}
        value={values.mines}
        error={errors.mines}
        onChange={(event) => setValues({ ...values, mines: event.target.value })}
      />
      <Input
        label="Máximo de jugadores"
        type="number"
        min={1}
        value={values.maxPlayers}
        error={errors.maxPlayers}
        onChange={(event) =>
          setValues({ ...values, maxPlayers: event.target.value })
        }
      />

      {submitError ? <ErrorMessage message={submitError} /> : null}

      <div className="panel__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear sala'}
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
          Volver
        </Button>
      </div>
    </form>
  )
}
