import type { CreateRoomFormValues } from '../types/game.types'

export interface ValidationErrors {
  rows?: string
  columns?: string
  mines?: string
  maxPlayers?: string
  username?: string
}

export function validateUsername(username: string): string | undefined {
  if (!username.trim()) {
    return 'Ingresa un nombre de usuario.'
  }
  if (username.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres.'
  }
  return undefined
}

export function validateCreateRoomForm(
  values: CreateRoomFormValues,
): ValidationErrors {
  const errors: ValidationErrors = {}
  const rows = Number.parseInt(values.rows, 10)
  const columns = Number.parseInt(values.columns, 10)
  const mines = Number.parseInt(values.mines, 10)
  const maxPlayers = Number.parseInt(values.maxPlayers, 10)

  if (Number.isNaN(rows) || rows <= 0) {
    errors.rows = 'El número de filas debe ser mayor que cero.'
  }

  if (Number.isNaN(columns) || columns <= 0) {
    errors.columns = 'El número de columnas debe ser mayor que cero.'
  }

  if (Number.isNaN(mines) || mines <= 0) {
    errors.mines = 'El número de minas debe ser mayor que cero.'
  } else if (!Number.isNaN(rows) && !Number.isNaN(columns) && rows > 0 && columns > 0) {
    const totalCells = rows * columns
    if (mines >= totalCells) {
      errors.mines = 'La cantidad de minas excede el tamaño del tablero.'
    }
  }

  if (Number.isNaN(maxPlayers) || maxPlayers <= 0) {
    errors.maxPlayers = 'El máximo de jugadores debe ser mayor que cero.'
  }

  return errors
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}
