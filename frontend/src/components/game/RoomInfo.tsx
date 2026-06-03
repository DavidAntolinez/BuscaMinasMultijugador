import type { PublicRoomState } from '../../types/game.types'
import { getCreatorUsername } from '../../utils/game.utils'

export function RoomInfo({ room }: { room: PublicRoomState }) {
  return (
    <dl className="room-info">
      <div>
        <dt>ID partida</dt>
        <dd>{room.id}</dd>
      </div>
      <div>
        <dt>Estado</dt>
        <dd>{room.status}</dd>
      </div>
      <div>
        <dt>Jugadores</dt>
        <dd>
          {room.players.length} / {room.maxPlayers}
        </dd>
      </div>
      <div>
        <dt>Creador</dt>
        <dd>{getCreatorUsername(room)}</dd>
      </div>
      <div>
        <dt>Tablero</dt>
        <dd>
          {room.rows} x {room.columns} ({room.mines} minas)
        </dd>
      </div>
    </dl>
  )
}
