import { useGameStore } from '../../stores/gameStore'
import { useTurnTimer } from '../../hooks/useTurnTimer'
import {
  formatQueuePosition,
  formatTurnStatus,
  getTurnQueueStatus,
} from '../../utils/turn.utils'

export function TurnInfo() {
  const room = useGameStore((state) => state.room)
  const playerId = useGameStore((state) => state.playerId)
  const turnOrder = useGameStore((state) => state.turnOrder)
  const turnRemainingMs = useGameStore((state) => state.turnRemainingMs)
  const timerLabel = useTurnTimer(turnRemainingMs)

  if (!room) {
    return null
  }

  const queueStatus = getTurnQueueStatus(
    turnOrder,
    room.currentTurnPlayerId,
    playerId,
  )

  return (
    <div className="turn-info">
      <div>
        <span className="turn-info__label">Estado del turno</span>
        <strong>{formatTurnStatus(queueStatus)}</strong>
      </div>
      <div>
        <span className="turn-info__label">Posición en la cola</span>
        <strong>{formatQueuePosition(queueStatus)}</strong>
      </div>
      <div>
        <span className="turn-info__label">Tiempo restante del turno</span>
        <strong>{timerLabel}</strong>
      </div>
    </div>
  )
}
