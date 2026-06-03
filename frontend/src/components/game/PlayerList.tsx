import type { PublicPlayer } from '../../types/game.types'

export function PlayerList({ players }: { players: PublicPlayer[] }) {
  return (
    <ul className="player-list">
      {players.map((player) => (
        <li key={player.id} className="player-list__item">
          <span>{player.username}</span>
          <span className={player.isConnected ? 'badge badge--online' : 'badge badge--offline'}>
            {player.isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </li>
      ))}
    </ul>
  )
}
