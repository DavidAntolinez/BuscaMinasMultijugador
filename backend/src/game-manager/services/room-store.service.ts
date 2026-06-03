import { Injectable } from '@nestjs/common';
import { PublicRoomState } from '../interfaces/public-room-state.interface';

@Injectable()
export class RoomStoreService {
  private readonly rooms = new Map<string, PublicRoomState>();
  private readonly playerRoomIndex = new Map<string, string>();

  save(room: PublicRoomState): void {
    this.rooms.set(room.id, room);
    for (const player of room.players) {
      this.playerRoomIndex.set(player.id, room.id);
    }
  }

  findById(roomId: string): PublicRoomState | undefined {
    return this.rooms.get(roomId);
  }

  findByStatus(status?: PublicRoomState['status']): PublicRoomState[] {
    const rooms = Array.from(this.rooms.values());
    if (!status) {
      return rooms;
    }
    return rooms.filter((room) => room.status === status);
  }

  findRoomByPlayerId(playerId: string): PublicRoomState | undefined {
    const roomId = this.playerRoomIndex.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  delete(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      for (const player of room.players) {
        this.playerRoomIndex.delete(player.id);
      }
    }
    this.rooms.delete(roomId);
  }

  count(): number {
    return this.rooms.size;
  }
}
