import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useGameStore } from '../stores/gameStore'
import { GameOverPage } from './GameOverPage'

describe('GameOverPage', () => {
  it('shows victory message', () => {
    useGameStore.setState({
      gameResult: {
        outcome: 'victory',
        winnerId: 'p1',
        winnerUsername: 'Alice',
        revealedCells: 10,
        foundMines: 2,
        totalDurationMs: 120000,
      },
    })

    render(
      <MemoryRouter>
        <GameOverPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Has limpiado el tablero correctamente.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})
