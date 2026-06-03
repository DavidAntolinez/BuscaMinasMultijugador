import { Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type {
  ClientToGameEvents,
  GameInterServerEvents,
  GameSocketData,
  GameToClientEvents,
} from './interfaces/game-events.interface';
import { WorkerEventType } from './interfaces/worker-messages.interface';
import { GameEventsBusService } from './services/game-events-bus.service';
import { GameManagerService } from './services/game-manager.service';

type GameServer = Server<
  ClientToGameEvents,
  GameToClientEvents,
  GameInterServerEvents,
  GameSocketData
>;

type GameSocket = Socket<
  ClientToGameEvents,
  GameToClientEvents,
  GameInterServerEvents,
  GameSocketData
>;

const GAME_EVENTS: WorkerEventType[] = [
  'room.created',
  'room.joined',
  'room.left',
  'room.started',
  'room.finished',
  'turn.started',
  'turn.ended',
  'turn.timeout',
  'cell.revealed',
  'flag.placed',
  'flag.removed',
  'game.won',
  'game.lost',
];

@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: process.env.WS_CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  },
})
export class GameManagerGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(GameManagerGateway.name);

  @WebSocketServer()
  private readonly server!: GameServer;

  constructor(
    private readonly eventsBus: GameEventsBusService,
    private readonly gameManagerService: GameManagerService,
  ) {}

  onModuleInit(): void {
    for (const eventName of GAME_EVENTS) {
      this.eventsBus.on(eventName, ({ roomId, payload }) => {
        this.server.to(this.roomChannel(roomId)).emit(eventName, payload);
      });
    }
  }

  handleConnection(client: GameSocket): void {
    client.data.connectedAt = new Date().toISOString();
    this.logger.log(`Game client connected: ${client.id}`);
  }

  async handleDisconnect(client: GameSocket): Promise<void> {
    const { roomId, playerId } = client.data;
    if (roomId && playerId) {
      await this.gameManagerService.handlePlayerDisconnect(roomId, playerId);
    }
  }

  @SubscribeMessage('game:subscribe')
  handleSubscribe(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: { roomId: string; playerId: string },
  ): void {
    client.join(this.roomChannel(payload.roomId));
    client.data.roomId = payload.roomId;
    client.data.playerId = payload.playerId;

    const room = this.gameManagerService.getRoom(payload.roomId);
    client.emit('room.state', room as unknown as Record<string, unknown>);
  }

  @SubscribeMessage('game:unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: GameSocket,
    @MessageBody() payload: { roomId: string },
  ): void {
    client.leave(this.roomChannel(payload.roomId));
    delete client.data.roomId;
    delete client.data.playerId;
  }

  private roomChannel(roomId: string): string {
    return `room:${roomId}`;
  }
}
