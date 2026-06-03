import { v4 as uuidv4 } from 'uuid';
import { RoomStatus } from '../enums/room-status.enum';
import { WorkerEventMessage } from '../interfaces/worker-messages.interface';
import { WorkerGameSession } from './worker-game-session';

describe('WorkerGameSession', () => {
  let session: WorkerGameSession;
  let events: WorkerEventMessage[];

  beforeEach(() => {
    events = [];
    session = new WorkerGameSession((event) => {
      events.push(event);
    });
  });

  afterEach(() => {
    session.handleCommand({
      correlationId: 'shutdown',
      command: 'SHUTDOWN',
      payload: {},
    });
  });

  const initRoom = (roomId = uuidv4()) => {
    const workerId = uuidv4();
    const response = session.handleCommand({
      correlationId: 'init',
      command: 'INIT',
      payload: {
        roomId,
        workerId,
        creatorId: 'creator-1',
        creatorUsername: 'Alice',
        rows: 3,
        columns: 3,
        mines: 2,
        maxPlayers: 4,
      },
    });

    expect(response.success).toBe(true);
    return { roomId, workerId, response };
  };

  it('should create room in WAITING state and emit room.created', () => {
    const { response } = initRoom();

    expect(response.room?.status).toBe(RoomStatus.WAITING);
    expect(response.room?.players).toHaveLength(1);
    expect(events.some((event) => event.event === 'room.created')).toBe(true);
  });

  it('should allow joining while waiting', () => {
    const { roomId } = initRoom();

    const joinResponse = session.handleCommand({
      correlationId: 'join',
      command: 'JOIN',
      payload: {
        playerId: 'player-2',
        username: 'Bob',
      },
    });

    expect(joinResponse.success).toBe(true);
    expect(joinResponse.room?.players).toHaveLength(2);
    expect(events.some((event) => event.event === 'room.joined')).toBe(true);
  });

  it('should reject duplicate join', () => {
    initRoom();

    session.handleCommand({
      correlationId: 'join-dup',
      command: 'JOIN',
      payload: {
        playerId: 'creator-1',
        username: 'Alice',
      },
    });

    const duplicate = session.handleCommand({
      correlationId: 'join-dup-2',
      command: 'JOIN',
      payload: {
        playerId: 'creator-1',
        username: 'Alice',
      },
    });

    expect(duplicate.success).toBe(false);
  });

  it('should start game only by creator', () => {
    initRoom();

    const invalidStart = session.handleCommand({
      correlationId: 'start-invalid',
      command: 'START',
      payload: { requesterId: 'other-player' },
    });

    expect(invalidStart.success).toBe(false);

    const validStart = session.handleCommand({
      correlationId: 'start-valid',
      command: 'START',
      payload: { requesterId: 'creator-1' },
    });

    expect(validStart.success).toBe(true);
    expect(validStart.room?.status).toBe(RoomStatus.IN_PROGRESS);
    expect(validStart.room?.currentTurnPlayerId).toBeDefined();
    expect(events.some((event) => event.event === 'room.started')).toBe(true);
    expect(events.some((event) => event.event === 'turn.started')).toBe(true);
  });

  it('should end turn after reveal but not after flag', () => {
    initRoom();
    session.handleCommand({
      correlationId: 'start',
      command: 'START',
      payload: { requesterId: 'creator-1' },
    });

    const state = session.toPublicState();
    const currentPlayerId = state.currentTurnPlayerId!;

    const flagResponse = session.handleCommand({
      correlationId: 'flag',
      command: 'FLAG',
      payload: {
        playerId: currentPlayerId,
        row: 0,
        column: 0,
      },
    });

    expect(flagResponse.success).toBe(true);
    expect(session.toPublicState().currentTurnPlayerId).toBe(currentPlayerId);

    const revealResponse = session.handleCommand({
      correlationId: 'reveal',
      command: 'REVEAL',
      payload: {
        playerId: currentPlayerId,
        row: 0,
        column: 1,
      },
    });

    expect(revealResponse.success).toBe(true);
    expect(events.some((event) => event.event === 'cell.revealed')).toBe(true);
    expect(events.some((event) => event.event === 'turn.ended')).toBe(true);

    const turnStartedEvent = events.find((event) => event.event === 'turn.started');
    expect(turnStartedEvent).toBeDefined();
    expect(turnStartedEvent?.payload.room).toBeDefined();
    expect(
      (turnStartedEvent?.payload.room as { currentTurnPlayerId: string })
        .currentTurnPlayerId,
    ).toBeDefined();
  });

  it('should cancel room when last player leaves', () => {
    initRoom();

    const leaveResponse = session.handleCommand({
      correlationId: 'leave',
      command: 'LEAVE',
      payload: { playerId: 'creator-1' },
    });

    expect(leaveResponse.success).toBe(true);
    expect(leaveResponse.room?.status).toBe(RoomStatus.CANCELLED);
    expect(events.some((event) => event.event === 'room.finished')).toBe(true);
  });
});
