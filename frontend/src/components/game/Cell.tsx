import type { PublicCell } from '../../types/game.types'

interface CellProps {
  cell: PublicCell
  disabled: boolean
  onReveal: () => void
  onToggleFlag: () => void
}

export function Cell({ cell, disabled, onReveal, onToggleFlag }: CellProps) {
  const classNames = [
    'cell',
    cell.revealed ? 'cell--revealed' : '',
    cell.flagged ? 'cell--flagged' : '',
    cell.revealed && cell.hasMine ? 'cell--mine' : '',
    disabled ? 'cell--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

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
      {cell.flagged && !cell.revealed ? '🚩' : null}
      {cell.revealed && cell.hasMine ? '💣' : null}
      {cell.revealed && !cell.hasMine && cell.adjacentMines
        ? cell.adjacentMines
        : null}
    </button>
  )
}
