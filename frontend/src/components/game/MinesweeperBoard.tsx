import type { PublicCell } from '../../types/game.types'
import { Cell } from './Cell'

interface MinesweeperBoardProps {
  board: PublicCell[][]
  disabled: boolean
  onReveal: (row: number, column: number) => void
  onToggleFlag: (row: number, column: number) => void
}

export function MinesweeperBoard({
  board,
  disabled,
  onReveal,
  onToggleFlag,
}: MinesweeperBoardProps) {
  return (
    <div
      className={`board ${disabled ? 'board--disabled' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${board[0]?.length ?? 0}, 2.5rem)`,
      }}
    >
      {board.map((row) =>
        row.map((cell) => (
          <Cell
            key={`${cell.row}-${cell.column}`}
            cell={cell}
            disabled={disabled}
            onReveal={() => onReveal(cell.row, cell.column)}
            onToggleFlag={() => onToggleFlag(cell.row, cell.column)}
          />
        )),
      )}
    </div>
  )
}
