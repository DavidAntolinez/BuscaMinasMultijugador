import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Cell } from './Cell'

describe('Cell', () => {
  it('renders revealed adjacent mines', () => {
    render(
      <Cell
        cell={{
          row: 0,
          column: 0,
          revealed: true,
          flagged: false,
          adjacentMines: 3,
        }}
        disabled={false}
        onReveal={vi.fn()}
        onToggleFlag={vi.fn()}
      />,
    )

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows unrevealed mines after defeat', () => {
    render(
      <Cell
        cell={{
          row: 1,
          column: 1,
          revealed: false,
          flagged: false,
          hasMine: true,
        }}
        disabled
        onReveal={vi.fn()}
        onToggleFlag={vi.fn()}
      />,
    )

    expect(screen.getByText('💣')).toBeInTheDocument()
  })

  it('blocks interaction when disabled', async () => {
    const user = userEvent.setup()
    const onReveal = vi.fn()

    render(
      <Cell
        cell={{
          row: 0,
          column: 0,
          revealed: false,
          flagged: false,
        }}
        disabled
        onReveal={onReveal}
        onToggleFlag={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button'))
    expect(onReveal).not.toHaveBeenCalled()
  })
})
