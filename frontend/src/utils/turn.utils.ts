export type TurnQueueStatus =
  | { type: 'current' }
  | { type: 'next' }
  | { type: 'waiting'; playersAhead: number }

export function getTurnQueueStatus(
  turnOrder: string[],
  currentTurnPlayerId: string | null,
  playerId: string,
): TurnQueueStatus | null {
  if (!currentTurnPlayerId || turnOrder.length === 0) {
    return null
  }

  if (currentTurnPlayerId === playerId) {
    return { type: 'current' }
  }

  const currentIndex = turnOrder.indexOf(currentTurnPlayerId)
  const playerIndex = turnOrder.indexOf(playerId)

  if (currentIndex === -1 || playerIndex === -1) {
    return null
  }

  const distance =
    (playerIndex - currentIndex + turnOrder.length) % turnOrder.length

  if (distance === 1) {
    return { type: 'next' }
  }

  return { type: 'waiting', playersAhead: distance - 1 }
}

export function formatTurnStatus(status: TurnQueueStatus | null): string {
  if (!status || status.type !== 'current') {
    return 'Esperando turno'
  }
  return 'Es tu turno'
}

export function formatQueuePosition(status: TurnQueueStatus | null): string {
  if (!status) {
    return 'Sin información de cola'
  }

  if (status.type === 'current') {
    return 'Turno activo'
  }

  if (status.type === 'next') {
    return 'Eres el siguiente jugador'
  }

  return `Faltan ${status.playersAhead} jugador${status.playersAhead === 1 ? '' : 'es'} para tu turno`
}

export function formatTurnQueueMessage(status: TurnQueueStatus | null): string {
  return formatTurnStatus(status)
}

export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
