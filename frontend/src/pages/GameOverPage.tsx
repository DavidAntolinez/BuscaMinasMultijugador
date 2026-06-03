import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { AppLayout } from '../layouts/AppLayout'
import { gameSocket } from '../services/gameSocket.service'
import { useGameStore } from '../stores/gameStore'
import { formatDuration } from '../utils/game.utils'

export function GameOverPage() {
  const navigate = useNavigate()
  const gameResult = useGameStore((state) => state.gameResult)
  const resetSession = useGameStore((state) => state.resetSession)

  const handleBackToMenu = () => {
    gameSocket.disconnect()
    resetSession()
    navigate('/')
  }

  if (!gameResult) {
    return (
      <AppLayout title="Fin de partida">
        <p>No hay resultados disponibles.</p>
        <Button onClick={handleBackToMenu}>Volver al menú principal</Button>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Fin de partida">
      <div className="game-over">
        <h2>
          {gameResult.outcome === 'victory'
            ? 'Has limpiado el tablero correctamente.'
            : 'Una mina explotó. La partida ha terminado.'}
        </h2>

        <dl className="room-info">
          <div>
            <dt>Jugador ganador</dt>
            <dd>{gameResult.winnerUsername ?? 'Sin ganador'}</dd>
          </div>
          <div>
            <dt>Celdas reveladas</dt>
            <dd>{gameResult.revealedCells}</dd>
          </div>
          <div>
            <dt>Minas encontradas</dt>
            <dd>{gameResult.foundMines}</dd>
          </div>
          <div>
            <dt>Tiempo total</dt>
            <dd>{formatDuration(gameResult.totalDurationMs)}</dd>
          </div>
        </dl>

        <Button onClick={handleBackToMenu}>Volver al menú principal</Button>
      </div>
    </AppLayout>
  )
}
