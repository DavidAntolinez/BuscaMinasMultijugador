import type { PublicCell } from '../../types/game.types'

interface CellProps {
  cell: PublicCell
  disabled: boolean
  onReveal: () => void
  onToggleFlag: () => void
}

export function Cell({ cell, disabled, onReveal, onToggleFlag }: CellProps) {
  const showExposedMine = Boolean(cell.hasMine) && !cell.flagged
  const classNames = [
    'cell',
    cell.revealed ? 'cell--revealed' : '',
    cell.flagged ? 'cell--flagged' : '',
    cell.revealed && cell.hasMine ? 'cell--mine cell--mine-hit' : '',
    showExposedMine && !cell.revealed ? 'cell--mine cell--mine-hidden' : '',
    disabled ? 'cell--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const showFlag = cell.flagged && !cell.revealed
  const showMine = showExposedMine
  const showAdjacent =
    cell.revealed && !cell.hasMine && typeof cell.adjacentMines === 'number'

  return (
    <button
      type="button"
      className={classNames}
      disabled={disabled}
      onClick={onReveal}
      onContextMenu={(event) => {
        event.preventDefault()
        if (!disabled) {
          onToggleFlag()
        }
      }}
      aria-label={`Celda ${cell.row}, ${cell.column}`}
    >
      {showFlag ? '🚩' : null}
      {showMine ? '💣' : null}
      {showAdjacent ? cell.adjacentMines : null}
    </button>
  )
}
