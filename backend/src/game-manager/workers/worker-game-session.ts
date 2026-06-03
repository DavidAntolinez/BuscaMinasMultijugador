import { GameStatus } from '../../minesweeper/enums/game-status.enum';
import { Game } from '../../minesweeper/models/game.model';
import { BoardGeneratorService } from '../../minesweeper/services/board-generator.service';
import { BoardMapperService } from '../../minesweeper/services/board-mapper.service';
import { FloodFillService } from '../../minesweeper/services/flood-fill.service';
import { GameEngineService } from '../../minesweeper/services/game-engine.service';
import { VictoryCheckerService } from '../../minesweeper/services/victory-checker.service';
import { GameRoom } from '../entities/game-room.entity';
import { Player } from '../entities/player.entity';
import { RoomStatus } from '../enums/room-status.enum';
import { PublicRoomState } from '../interfaces/public-room-state.interface';
import {
  WorkerCommandMessage,
  WorkerCommandPayload,
  WorkerEventMessage,
  WorkerEventType,
  WorkerInitPayload,
  WorkerJoinPayload,
  WorkerLeavePayload,
  WorkerPlayerPayload,
  WorkerRevealPayload,
  WorkerResponseMessage,
  WorkerStartPayload,
} from '../interfaces/worker-messages.interface';
import { TurnManager } from './turn-manager';

type EventEmitter = (event: WorkerEventMessage) => void;

export class WorkerGameSession {
  private readonly turnManager = new TurnManager();
  private readonly boardMapper = new BoardMapperService();
  private readonly gameEngine: GameEngineService;
  private readonly victoryChecker = new VictoryCheckerService();
  private room: GameRoom | null = null;
  private game: Game | null = null;
  private readonly emitEvent: EventEmitter;

  constructor(emitEvent: EventEmitter) {
    const boardGenerator = new BoardGeneratorService();
    this.gameEngine = new GameEngineService(
      new FloodFillService(boardGenerator),
      this.victoryChecker,
      boardGenerator,
    );
    this.emitEvent = emitEvent;
  }

  handleCommand(message: WorkerCommandMessage): WorkerResponseMessage {
    try {
      switch (message.command) {
        case 'INIT':
          return this.handleInit(message.correlationId, message.payload);
        case 'JOIN':
          return this.handleJoin(message.correlationId, message.payload);
        case 'LEAVE':
          return this.handleLeave(message.correlationId, message.payload);
        case 'START':
          return this.handleStart(message.correlationId, message.payload);
        case 'REVEAL':
          return this.handleReveal(message.correlationId, message.payload);
        case 'FLAG':
          return this.handleFlag(message.correlationId, message.payload);
        case 'DISCONNECT':
          return this.handleDisconnect(message.correlationId, message.payload);
        case 'RECONNECT':
          return this.handleReconnect(message.correlationId, message.payload);
        case 'GET_STATE':
          return this.successResponse(message.correlationId);
        case 'SHUTDOWN':
          this.shutdown();
          return this.successResponse(message.correlationId);
        default:
          return this.errorResponse(message.correlationId, 'Comando desconocido');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      return this.errorResponse(message.correlationId, errorMessage);
    }
  }

  private handleInit(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const initPayload = payload as WorkerInitPayload;
    const totalCells = initPayload.rows * initPayload.columns;

    if (initPayload.mines >= totalCells) {
      return this.errorResponse(
        correlationId,
        'La cantidad de minas debe ser menor al total de celdas',
      );
    }

    const boardGenerator = new BoardGeneratorService();
    const board = boardGenerator.generate(
      initPayload.rows,
      initPayload.columns,
      initPayload.mines,
    );

    this.game = new Game(
      initPayload.roomId,
      initPayload.rows,
      initPayload.columns,
      initPayload.mines,
      board,
    );
    this.game.status = GameStatus.IN_PROGRESS;

    this.room = new GameRoom({
      id: initPayload.roomId,
      creatorId: initPayload.creatorId,
      boardId: this.game.id,
      workerId: initPayload.workerId,
      rows: initPayload.rows,
      columns: initPayload.columns,
      mines: initPayload.mines,
      maxPlayers: initPayload.maxPlayers,
      creatorUsername: initPayload.creatorUsername,
    });

    this.publishEvent('room.created', {
      room: this.toPublicState(),
    });

    return this.successResponse(correlationId);
  }

  private handleJoin(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const joinPayload = payload as WorkerJoinPayload;
    const room = this.requireRoom();

    if (room.status !== RoomStatus.WAITING) {
      return this.errorResponse(
        correlationId,
        'Solo se puede unir a partidas en estado WAITING',
      );
    }

    if (room.players.length >= room.maxPlayers) {
      return this.errorResponse(correlationId, 'La sala está llena');
    }

    if (room.players.some((player) => player.id === joinPayload.playerId)) {
      return this.errorResponse(correlationId, 'El jugador ya está en la sala');
    }

    room.players.push(new Player(joinPayload.playerId, joinPayload.username));

    this.publishEvent('room.joined', {
      player: this.toPublicPlayer(room.players.at(-1)!),
      room: this.toPublicState(),
    });

    return this.successResponse(correlationId);
  }

  private handleLeave(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const leavePayload = payload as WorkerLeavePayload;
    const room = this.requireRoom();
    const playerIndex = room.players.findIndex(
      (player) => player.id === leavePayload.playerId,
    );

    if (playerIndex === -1) {
      return this.errorResponse(correlationId, 'Jugador no encontrado en la sala');
    }

    room.players.splice(playerIndex, 1);

    this.publishEvent('room.left', {
      playerId: leavePayload.playerId,
      room: this.toPublicState(),
    });

    if (room.players.length === 0) {
      this.finishRoom(RoomStatus.CANCELLED, 'room.finished', {
        reason: 'cancelled',
      });
    }

    return this.successResponse(correlationId);
  }

  private handleStart(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const startPayload = payload as WorkerStartPayload;
    const room = this.requireRoom();

    if (startPayload.requesterId !== room.creatorId) {
      return this.errorResponse(
        correlationId,
        'Solo el creador puede iniciar la partida',
      );
    }

    if (room.status !== RoomStatus.WAITING) {
      return this.errorResponse(
        correlationId,
        'La partida no está en estado WAITING',
      );
    }

    if (room.players.length === 0) {
      return this.errorResponse(
        correlationId,
        'Debe existir al menos un jugador',
      );
    }

    room.status = RoomStatus.STARTING;
    const turnOrder = this.turnManager.setupOrder(
      room.players.map((player) => player.id),
    );
    room.status = RoomStatus.IN_PROGRESS;
    room.startedAt = new Date();

    const firstPlayerId = this.turnManager.getCurrentPlayerId();
    room.currentTurnPlayerId = firstPlayerId;
    room.currentTurnStartedAt = new Date();
    this.turnManager.startTimer(() => this.handleTurnTimeout());

    this.publishEvent('room.started', {
      turnOrder,
      currentTurnPlayerId: firstPlayerId,
      room: this.toPublicState(),
    });
    this.publishEvent('turn.started', {
      playerId: firstPlayerId,
      startedAt: room.currentTurnStartedAt.toISOString(),
      remainingMs: TurnManager.TURN_DURATION_MS,
    });

    return this.successResponse(correlationId);
  }

  private handleReveal(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const revealPayload = payload as WorkerRevealPayload;
    const room = this.requireRoom();
    const game = this.requireGame();

    this.assertRoomPlayable(room);
    this.assertCurrentTurn(room, revealPayload.playerId);

    const previousStatus = game.status;
    this.gameEngine.revealCell(game, revealPayload.row, revealPayload.column);

    const player = this.findPlayer(revealPayload.playerId);
    player.score += 1;

    this.publishEvent('cell.revealed', {
      playerId: revealPayload.playerId,
      row: revealPayload.row,
      column: revealPayload.column,
      board: this.boardMapper.toPublicState(game).board,
    });

    if (game.status === GameStatus.LOST) {
      this.publishEvent('game.lost', {
        playerId: revealPayload.playerId,
        room: this.toPublicState(),
      });
      this.finishRoom(RoomStatus.FINISHED, 'room.finished', { reason: 'lost' });
      return this.successResponse(correlationId);
    }

    if (game.status === GameStatus.WON) {
      this.publishEvent('game.won', {
        playerId: revealPayload.playerId,
        room: this.toPublicState(),
      });
      this.finishRoom(RoomStatus.FINISHED, 'room.finished', { reason: 'won' });
      return this.successResponse(correlationId);
    }

    if (previousStatus === game.status) {
      this.endCurrentTurn('reveal');
    }

    return this.successResponse(correlationId);
  }

  private handleFlag(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const flagPayload = payload as WorkerRevealPayload;
    const room = this.requireRoom();
    const game = this.requireGame();

    this.assertRoomPlayable(room);
    this.assertCurrentTurn(room, flagPayload.playerId);

    const cell = game.board[flagPayload.row][flagPayload.column];
    const wasFlagged = cell.flagged;

    this.gameEngine.toggleFlag(game, flagPayload.row, flagPayload.column);

    this.publishEvent(wasFlagged ? 'flag.removed' : 'flag.placed', {
      playerId: flagPayload.playerId,
      row: flagPayload.row,
      column: flagPayload.column,
      board: this.boardMapper.toPublicState(game).board,
    });

    return this.successResponse(correlationId);
  }

  private handleDisconnect(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const playerPayload = payload as WorkerPlayerPayload;
    const room = this.requireRoom();
    const player = this.findPlayer(playerPayload.playerId);
    player.isConnected = false;

    if (
      room.status === RoomStatus.IN_PROGRESS &&
      room.currentTurnPlayerId === playerPayload.playerId
    ) {
      this.endCurrentTurn('disconnect');
    }

    if (
      room.status === RoomStatus.IN_PROGRESS &&
      room.players.every((entry) => !entry.isConnected)
    ) {
      room.status = RoomStatus.PAUSED;
    }

    return this.successResponse(correlationId);
  }

  private handleReconnect(
    correlationId: string,
    payload: WorkerCommandPayload,
  ): WorkerResponseMessage {
    const playerPayload = payload as WorkerPlayerPayload;
    const room = this.requireRoom();
    const player = this.findPlayer(playerPayload.playerId);
    player.isConnected = true;

    if (room.status === RoomStatus.PAUSED) {
      room.status = RoomStatus.IN_PROGRESS;
    }

    return this.successResponse(correlationId);
  }

  private handleTurnTimeout(): void {
    const room = this.requireRoom();
    if (room.status !== RoomStatus.IN_PROGRESS) {
      return;
    }

    this.publishEvent('turn.timeout', {
      playerId: room.currentTurnPlayerId,
      roomId: room.id,
    });
    this.endCurrentTurn('timeout');
  }

  private endCurrentTurn(reason: 'reveal' | 'timeout' | 'disconnect'): void {
    const room = this.requireRoom();
    const previousPlayerId = room.currentTurnPlayerId;

    if (previousPlayerId) {
      const player = this.findPlayer(previousPlayerId);
      player.turnsPlayed += 1;
    }

    this.publishEvent('turn.ended', {
      playerId: previousPlayerId,
      reason,
    });

    const { nextPlayerId } = this.turnManager.advanceTurn();
    room.currentTurnPlayerId = nextPlayerId;
    room.currentTurnStartedAt = nextPlayerId ? new Date() : null;

    if (nextPlayerId && room.status === RoomStatus.IN_PROGRESS) {
      this.turnManager.startTimer(() => this.handleTurnTimeout());
      this.publishEvent('turn.started', {
        playerId: nextPlayerId,
        startedAt: room.currentTurnStartedAt!.toISOString(),
        remainingMs: TurnManager.TURN_DURATION_MS,
      });
    } else {
      this.turnManager.clearTimer();
    }
  }

  private finishRoom(
    status: RoomStatus,
    event: WorkerEventType,
    payload: Record<string, unknown>,
  ): void {
    const room = this.requireRoom();
    room.status = status;
    room.finishedAt = new Date();
    room.currentTurnPlayerId = null;
    room.currentTurnStartedAt = null;
    this.turnManager.clearTimer();

    this.publishEvent(event, {
      ...payload,
      room: this.toPublicState(),
    });
  }

  private shutdown(): void {
    this.turnManager.clearTimer();
    this.room = null;
    this.game = null;
  }

  private assertRoomPlayable(room: GameRoom): void {
    if (room.status !== RoomStatus.IN_PROGRESS) {
      throw new Error('La partida no está en progreso');
    }
  }

  private assertCurrentTurn(room: GameRoom, playerId: string): void {
    if (room.currentTurnPlayerId !== playerId) {
      throw new Error('No es el turno del jugador');
    }
  }

  private findPlayer(playerId: string): Player {
    const room = this.requireRoom();
    const player = room.players.find((entry) => entry.id === playerId);
    if (!player) {
      throw new Error('Jugador no encontrado');
    }
    return player;
  }

  private requireRoom(): GameRoom {
    if (!this.room) {
      throw new Error('La sala no ha sido inicializada');
    }
    return this.room;
  }

  private requireGame(): Game {
    if (!this.game) {
      throw new Error('El tablero no ha sido inicializado');
    }
    return this.game;
  }

  private toPublicPlayer(player: Player) {
    return {
      id: player.id,
      username: player.username,
      joinedAt: player.joinedAt.toISOString(),
      isConnected: player.isConnected,
      score: player.score,
      turnsPlayed: player.turnsPlayed,
    };
  }

  toPublicState(): PublicRoomState {
    const room = this.requireRoom();
    const game = this.game;

    return {
      id: room.id,
      creatorId: room.creatorId,
      status: room.status,
      boardId: room.boardId,
      players: room.players.map((player) => this.toPublicPlayer(player)),
      currentTurnPlayerId: room.currentTurnPlayerId,
      currentTurnStartedAt: room.currentTurnStartedAt?.toISOString() ?? null,
      turnRemainingMs: this.turnManager.getRemainingMs(
        room.currentTurnStartedAt,
      ),
      maxPlayers: room.maxPlayers,
      rows: room.rows,
      columns: room.columns,
      mines: room.mines,
      createdAt: room.createdAt.toISOString(),
      startedAt: room.startedAt?.toISOString() ?? null,
      finishedAt: room.finishedAt?.toISOString() ?? null,
      workerId: room.workerId,
      board:
        room.status === RoomStatus.IN_PROGRESS ||
        room.status === RoomStatus.FINISHED ||
        room.status === RoomStatus.PAUSED
          ? game
            ? this.boardMapper.toPublicState(game).board
            : undefined
          : undefined,
    };
  }

  private publishEvent(
    event: WorkerEventType,
    payload: Record<string, unknown>,
  ): void {
    const room = this.requireRoom();
    this.emitEvent({
      type: 'event',
      event,
      roomId: room.id,
      payload: {
        ...payload,
        room: this.toPublicState(),
      },
    });
  }

  private successResponse(correlationId: string): WorkerResponseMessage {
    return {
      correlationId,
      success: true,
      room: this.room ? this.toPublicState() : undefined,
    };
  }

  private errorResponse(
    correlationId: string,
    error: string,
  ): WorkerResponseMessage {
    return {
      correlationId,
      success: false,
      error,
      room: this.room ? this.toPublicState() : undefined,
    };
  }
}
