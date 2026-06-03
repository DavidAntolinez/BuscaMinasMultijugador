import { describe, expect, it } from 'vitest'
import {
  validateCreateRoomForm,
  validateUsername,
} from './validation.utils'

describe('validation.utils', () => {
  it('validates username', () => {
    expect(validateUsername('')).toBe('Ingresa un nombre de usuario.')
    expect(validateUsername('ab')).toBeUndefined()
  })

  it('rejects zero rows and columns', () => {
    const errors = validateCreateRoomForm({
      rows: '0',
      columns: '0',
      mines: '1',
      maxPlayers: '2',
    })

    expect(errors.rows).toBe('El número de filas debe ser mayor que cero.')
    expect(errors.columns).toBe('El número de columnas debe ser mayor que cero.')
  })

  it('rejects mines greater than board size', () => {
    const errors = validateCreateRoomForm({
      rows: '10',
      columns: '10',
      mines: '100',
      maxPlayers: '4',
    })

    expect(errors.mines).toBe('La cantidad de minas excede el tamaño del tablero.')
  })
})
