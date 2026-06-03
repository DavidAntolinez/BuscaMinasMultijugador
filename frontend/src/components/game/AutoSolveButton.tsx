import { Button } from '../ui/Button'

interface AutoSolveButtonProps {
  disabled: boolean
  loading: boolean
  onAutoSolve: () => void
}

export function AutoSolveButton({
  disabled,
  loading,
  onAutoSolve,
}: AutoSolveButtonProps) {
  return (
    <div className="game-controls">
      <Button
        variant="secondary"
        disabled={disabled || loading}
        onClick={onAutoSolve}
      >
        {loading ? 'Resolviendo...' : 'Autoresolver'}
      </Button>
    </div>
  )
}
