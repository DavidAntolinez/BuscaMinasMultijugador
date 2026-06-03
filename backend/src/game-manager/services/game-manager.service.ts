import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateRoomDto } from '../dto/create-room.dto';
import { JoinRoomDto } from '../dto/join-room.dto';
import { PlayerCellActionDto } from '../dto/player-cell-action.dto';
import { AutoSolveRoomDto } from '../dto/auto-solve-room.dto';
import { StartRoomDto } from '../dto/start-room.dto';
import { RoomStatus } from '../enums/room-status.enum';
import { PublicRoomState } from '../interfaces/public-room-state.interface';
import { RoomStoreService } from './room-store.service';
import { WorkerRegistryService } from './worker-registry.service';

@Injectable()
export class GameManagerService {
  private readonly logger = new Logger(GameManagerService.name);

  constructor(
    private readonly workerRegistry: WorkerRegistryService,
    private readonly roomStore: RoomStoreService,
  ) {}

  async createRoom(dto: CreateRoomDto): Promise<PublicRoomState> {
    const totalCells = dto.rows * dto.columns;
    if (dto.mines >= totalCells) {
      throw new BadRequestException(
        'La cantidad de minas debe ser menor al total de celdas',
      );
    }

    const roomId = uuidv4();
    const workerId = await this.workerRegistry.spawnWorker(roomId);

    const response = await this.workerRegistry.sendCommand(roomId, 'INIT', {
      roomId,
      workerId,
      creatorId: dto.creatorId,
      creatorUsername: dto.creatorUsername,
      rows: dto.rows,
      columns: dto.columns,
      mines: dto.mines,
      maxPlayers: dto.maxPlayers,
    });

    if (!response.success || !response.room) {
      await this.workerRegistry.shutdownWorker(roomId);
      throw new BadRequestException(
        response.error ?? 'No se pudo crear la sala',
      );
    }

    this.roomStore.save(response.room);
    return response.room;
  }

  async joinRoom(roomId: string, dto: JoinRoomDto): Promise<PublicRoomState> {
    this.ensureRoomExists(roomId);

    const response = await this.workerRegistry.sendCommand(roomId, 'JOIN', {
      playerId: dto.playerId,
      username: dto.username,
    });

    return this.unwrapResponse(response);
  }

  async leaveRoom(roomId: string, playerId: string): Promise<PublicRoomState> {
    this.ensureRoomExists(roomId);

    const response = await this.workerRegistry.sendCommand(roomId, 'LEAVE', {
      playerId,
    });

    return this.unwrapResponse(response);
  }

  async startRoom(roomId: string, dto: StartRoomDto): Promise<PublicRoomState> {
    this.ensureRoomExists(roomId);

    const response = await this.workerRegistry.sendCommand(roomId, 'START', {
      requesterId: dto.requesterId,
    });

    return this.unwrapResponse(response);
  }

  async revealCell(
    roomId: string,
    dto: PlayerCellActionDto,
  ): Promise<PublicRoomState> {
    this.ensureRoomExists(roomId);

    const response = await this.workerRegistry.sendCommand(roomId, 'REVEAL', {
      playerId: dto.playerId,
      row: dto.row,
      column: dto.column,
    });

    return this.unwrapResponse(response);
  }

  async toggleFlag(
    roomId: string,
    dto: PlayerCellActionDto,
  ): Promise<PublicRoomState> {
    this.ensureRoomExists(roomId);

    const response = await this.workerRegistry.sendCommand(roomId, 'FLAG', {
      playerId: dto.playerId,
      row: dto.row,
      column: dto.column,
    });

    return this.unwrapResponse(response);
  }

  async autoSolveRoom(
    roomId: string,
    dto: AutoSolveRoomDto,
  ): Promise<PublicRoomState> {
    const room = this.roomStore.findById(roomId);
    if (!room) {
      throw new NotFoundException(`Sala ${roomId} no encontrada`);
    }

    if (dto.requesterId !== room.creatorId) {
      this.logger.warn(
        `Intento de autoresolver no autorizado en sala ${roomId} por jugador ${dto.requesterId}`,
      );
      throw new ForbiddenException(
        'Solo el creador de la sala puede autoresolver la partida',
      );
    }

    if (room.status !== RoomStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'La partida no está activa y no puede autoresolverse',
      );
    }

    if (!this.workerRegistry.hasWorker(roomId)) {
      throw new BadRequestException(
        `La sala ${roomId} no tiene una sesión activa en el worker`,
      );
    }

    const response = await this.workerRegistry.sendCommand(roomId, 'SOLVE', {
      requesterId: dto.requesterId,
    });

    return this.unwrapResponse(response);
  }

  getRoom(roomId: string): PublicRoomState {
    const room = this.roomStore.findById(roomId);
    if (!room) {
      throw new NotFoundException(`Sala ${roomId} no encontrada`);
    }
    return room;
  }

  listRooms(status?: RoomStatus): PublicRoomState[] {
    return this.roomStore.findByStatus(status);
  }

  async handlePlayerDisconnect(
    roomId: string,
    playerId: string,
  ): Promise<void> {
    const room = this.roomStore.findById(roomId);
    if (!room) {
      return;
    }

    if (this.isTerminalRoom(room)) {
      return;
    }

    if (!this.workerRegistry.hasWorker(roomId)) {
      this.logger.debug(
        `Desconexión ignorada para sala ${roomId}: worker ya liberado`,
      );
      return;
    }

    try {
      const response = await this.workerRegistry.sendCommand(
        roomId,
        'DISCONNECT',
        { playerId },
      );
      if (response.room) {
        this.roomStore.save(response.room);
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo notificar desconexión en sala ${roomId}: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    }
  }

  async handlePlayerReconnect(
    roomId: string,
    playerId: string,
  ): Promise<PublicRoomState> {
    const room = this.requirePlayableRoom(roomId);

    const response = await this.workerRegistry.sendCommand(roomId, 'RECONNECT', {
      playerId,
    });

    return this.unwrapResponse(response);
  }

  private isTerminalRoom(room: PublicRoomState): boolean {
    return (
      room.status === RoomStatus.FINISHED ||
      room.status === RoomStatus.CANCELLED
    );
  }

  private requirePlayableRoom(roomId: string): PublicRoomState {
    const room = this.roomStore.findById(roomId);
    if (!room) {
      throw new NotFoundException(`Sala ${roomId} no encontrada`);
    }

    if (this.isTerminalRoom(room)) {
      throw new BadRequestException(
        `La sala ${roomId} ya finalizó y no acepta reconexiones`,
      );
    }

    if (!this.workerRegistry.hasWorker(roomId)) {
      throw new BadRequestException(
        `La sala ${roomId} no tiene una sesión activa en el worker`,
      );
    }

    return room;
  }

  private ensureRoomExists(roomId: string): void {
    if (!this.roomStore.findById(roomId)) {
      throw new NotFoundException(`Sala ${roomId} no encontrada`);
    }
  }

  private unwrapResponse(response: {
    success: boolean;
    room?: PublicRoomState;
    error?: string;
  }): PublicRoomState {
    if (!response.success || !response.room) {
      throw new BadRequestException(response.error ?? 'Operación inválida');
    }

    this.roomStore.save(response.room);
    return response.room;
  }
}
