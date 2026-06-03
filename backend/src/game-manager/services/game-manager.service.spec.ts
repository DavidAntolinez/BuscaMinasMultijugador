import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomStatus } from '../enums/room-status.enum';
import { GameManagerModule } from '../game-manager.module';
import { PublicRoomState } from '../interfaces/public-room-state.interface';
import { WorkerResponseMessage } from '../interfaces/worker-messages.interface';
import { GameManagerService } from './game-manager.service';
import { RoomStoreService } from './room-store.service';
import { WorkerRegistryService } from './worker-registry.service';

describe('GameManagerService', () => {
  let service: GameManagerService;
  let workerRegistry: jest.Mocked<WorkerRegistryService>;
  let roomStore: RoomStoreService;

  const sampleRoom = (): PublicRoomState => ({
    id: 'room-1',
    creatorId: 'creator-1',
    status: RoomStatus.WAITING,
    boardId: 'board-1',
    players: [
      {
        id: 'creator-1',
        username: 'Alice',
        joinedAt: new Date().toISOString(),
        isConnected: true,
        score: 0,
        turnsPlayed: 0,
      },
    ],
    currentTurnPlayerId: null,
    currentTurnStartedAt: null,
    turnRemainingMs: null,
    maxPlayers: 4,
    rows: 3,
    columns: 3,
    mines: 2,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    workerId: 'worker-1',
  });

  beforeEach(async () => {
    workerRegistry = {
      spawnWorker: jest.fn().mockResolvedValue('worker-1'),
      sendCommand: jest.fn(),
      shutdownWorker: jest.fn(),
      hasWorker: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<WorkerRegistryService>;

    const module: TestingModule = await Test.createTestingModule({
      imports: [GameManagerModule],
    })
      .overrideProvider(WorkerRegistryService)
      .useValue(workerRegistry)
      .compile();

    service = module.get(GameManagerService);
    roomStore = module.get(RoomStoreService);
  });

  it('should create room using worker init command', async () => {
    const room = sampleRoom();
    workerRegistry.sendCommand.mockResolvedValue({
      correlationId: '1',
      success: true,
      room,
    } satisfies WorkerResponseMessage);

    const created = await service.createRoom({
      creatorId: 'creator-1',
      creatorUsername: 'Alice',
      rows: 3,
      columns: 3,
      mines: 2,
      maxPlayers: 4,
    });

    expect(workerRegistry.spawnWorker).toHaveBeenCalled();
    expect(workerRegistry.sendCommand).toHaveBeenCalledWith(
      expect.any(String),
      'INIT',
      expect.objectContaining({ creatorId: 'creator-1' }),
    );
    expect(created.status).toBe(RoomStatus.WAITING);
  });

  it('should reject invalid mine count on create', async () => {
    await expect(
      service.createRoom({
        creatorId: 'creator-1',
        creatorUsername: 'Alice',
        rows: 2,
        columns: 2,
        mines: 4,
        maxPlayers: 2,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should join room through worker command', async () => {
    const room = sampleRoom();
    roomStore.save(room);
    workerRegistry.sendCommand.mockResolvedValue({
      correlationId: 'join',
      success: true,
      room: {
        ...room,
        players: [
          ...room.players,
          {
            id: 'player-2',
            username: 'Bob',
            joinedAt: new Date().toISOString(),
            isConnected: true,
            score: 0,
            turnsPlayed: 0,
          },
        ],
      },
    });

    const joined = await service.joinRoom('room-1', {
      playerId: 'player-2',
      username: 'Bob',
    });

    expect(joined.players).toHaveLength(2);
  });

  it('should ignore disconnect for finished rooms without worker commands', async () => {
    const room = {
      ...sampleRoom(),
      status: RoomStatus.FINISHED,
      finishedAt: new Date().toISOString(),
    };
    roomStore.save(room);
    workerRegistry.hasWorker.mockReturnValue(false);

    await service.handlePlayerDisconnect('room-1', 'creator-1');

    expect(workerRegistry.sendCommand).not.toHaveBeenCalled();
  });

  it('should ignore disconnect when worker was already released', async () => {
    roomStore.save(sampleRoom());
    workerRegistry.hasWorker.mockReturnValue(false);

    await service.handlePlayerDisconnect('room-1', 'creator-1');

    expect(workerRegistry.sendCommand).not.toHaveBeenCalled();
  });

  it('should reject auto solve from non-creator', async () => {
    const room = { ...sampleRoom(), status: RoomStatus.IN_PROGRESS };
    roomStore.save(room);

    await expect(
      service.autoSolveRoom('room-1', { requesterId: 'player-2' }),
    ).rejects.toThrow(ForbiddenException);
    expect(workerRegistry.sendCommand).not.toHaveBeenCalled();
  });

  it('should reject reconnect for finished rooms', async () => {
    roomStore.save({
      ...sampleRoom(),
      status: RoomStatus.FINISHED,
      finishedAt: new Date().toISOString(),
    });

    await expect(
      service.handlePlayerReconnect('room-1', 'creator-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
