import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { gameSocket } from '../../services/gameSocket.service'
import { useGameStore } from '../../stores/gameStore'
import type { GameResult } from '../../types/game.types'

function getFinishedMessage(result: GameResult): string {
  if (result.outcome === 'victory') {
    return 'Partida finalizada - Tablero limpiado correctamente'
  }
  return 'Partida finalizada - Una mina explotó'
}

interface GameFinishedBannerProps {
  result: GameResult
}

export function GameFinishedBanner({ result }: GameFinishedBannerProps) {
  const navigate = useNavigate()
  const roomId = useGameStore((state) => state.room?.id)
  const resetSession = useGameStore((state) => state.resetSession)

  const handleBackToMenu = () => {
    if (roomId) {
      gameSocket.endRoomSession(roomId)
    } else {
      gameSocket.disconnect()
    }
    resetSession()
    navigate('/')
  }

  return (
    <div
      className={`game-finished-banner game-finished-banner--${result.outcome}`}
      role="status"
      aria-live="polite"
    >
      <p className="game-finished-banner__title">Partida finalizada</p>
      <p className="game-finished-banner__outcome">{getFinishedMessage(result)}</p>
      <Button variant="ghost" onClick={handleBackToMenu}>
        Volver al menú principal
      </Button>
    </div>
  )
}
