import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { GameFinishedBanner } from './GameFinishedBanner'

describe('GameFinishedBanner', () => {
  it('shows victory messages on the game screen', () => {
    render(
      <MemoryRouter>
        <GameFinishedBanner
          result={{
            outcome: 'victory',
            winnerId: 'p1',
            winnerUsername: 'Alice',
            revealedCells: 10,
            foundMines: 2,
            totalDurationMs: 120000,
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Partida finalizada')).toBeInTheDocument()
    expect(
      screen.getByText('Partida finalizada - Tablero limpiado correctamente'),
    ).toBeInTheDocument()
    expect(screen.getByText('Ganador: Alice')).toBeInTheDocument()
  })

  it('shows defeat messages on the game screen', () => {
    render(
      <MemoryRouter>
        <GameFinishedBanner
          result={{
            outcome: 'defeat',
            winnerId: null,
            winnerUsername: null,
            revealedCells: 4,
            foundMines: 0,
            totalDurationMs: 60000,
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Partida finalizada')).toBeInTheDocument()
    expect(
      screen.getByText('Partida finalizada - Una mina explotó'),
    ).toBeInTheDocument()
  })
})
