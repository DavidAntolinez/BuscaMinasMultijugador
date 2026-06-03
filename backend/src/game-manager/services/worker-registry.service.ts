import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';
import {
  PendingWorkerRequest,
  WorkerCommandMessage,
  WorkerCommandPayload,
  WorkerCommandType,
  WorkerOutboundMessage,
  WorkerResponseMessage,
} from '../interfaces/worker-messages.interface';
import { GameEventsBusService } from './game-events-bus.service';
import { RoomStoreService } from './room-store.service';

interface ManagedWorker {
  roomId: string;
  workerId: string;
  worker: Worker;
  pending: Map<string, PendingWorkerRequest>;
  commandChain: Promise<unknown>;
}

@Injectable()
export class WorkerRegistryService implements OnModuleDestroy {
  private readonly logger = new Logger(WorkerRegistryService.name);
  private readonly workers = new Map<string, ManagedWorker>();
  private readonly workerScriptPath = join(__dirname, '../workers/game.worker.js');
  private static readonly REQUEST_TIMEOUT_MS = 10_000;

  constructor(
    private readonly roomStore: RoomStoreService,
    private readonly eventsBus: GameEventsBusService,
  ) {}

  async spawnWorker(roomId: string): Promise<string> {
    const workerId = uuidv4();

    const worker = new Worker(this.workerScriptPath, {
      workerData: { roomId, workerId },
    });

    const managed: ManagedWorker = {
      roomId,
      workerId,
      worker,
      pending: new Map(),
      commandChain: Promise.resolve(),
    };

    let readyResolved = false;
    const readyPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout esperando worker ready'));
      }, WorkerRegistryService.REQUEST_TIMEOUT_MS);

      worker.on('message', (message: WorkerOutboundMessage) => {
        if (
          !readyResolved &&
          'type' in message &&
          message.type === 'ready' &&
          message.roomId === roomId
        ) {
          readyResolved = true;
          clearTimeout(timeout);
          resolve();
        }

        this.handleWorkerMessage(roomId, message);
      });

      worker.on('error', (error) => {
        if (!readyResolved) {
          clearTimeout(timeout);
          reject(error);
        }
        this.logger.error(`Worker ${workerId} error`, error.stack);
      });

      worker.on('exit', (code) => {
        this.logger.log(`Worker ${workerId} exited with code ${code}`);
        this.workers.delete(roomId);
      });
    });

    this.workers.set(roomId, managed);
    await readyPromise;
    return workerId;
  }

  async sendCommand(
    roomId: string,
    command: WorkerCommandType,
    payload: WorkerCommandPayload,
  ): Promise<WorkerResponseMessage> {
    const managed = this.workers.get(roomId);
    if (!managed) {
      throw new InternalServerErrorException(
        `No existe worker activo para la sala ${roomId}`,
      );
    }

    const execute = async (): Promise<WorkerResponseMessage> => {
      const correlationId = uuidv4();
      const message: WorkerCommandMessage = {
        correlationId,
        command,
        payload,
      };

      const response = await new Promise<WorkerResponseMessage>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            managed.pending.delete(correlationId);
            reject(new Error(`Timeout ejecutando comando ${command}`));
          }, WorkerRegistryService.REQUEST_TIMEOUT_MS);

          managed.pending.set(correlationId, { resolve, reject, timeout });
          managed.worker.postMessage(message);
        },
      );

      if (response.room) {
        this.roomStore.save(response.room);
      }

      return response;
    };

    const chained = managed.commandChain.then(execute, execute);
    managed.commandChain = chained.catch(() => undefined);
    return chained;
  }

  async shutdownWorker(roomId: string): Promise<void> {
    const managed = this.workers.get(roomId);
    if (!managed) {
      return;
    }

    try {
      await this.sendCommand(roomId, 'SHUTDOWN', {});
    } catch {
      // Worker may already be stopped.
    }

    await managed.worker.terminate();
    this.workers.delete(roomId);
  }

  onModuleDestroy(): void {
    for (const roomId of this.workers.keys()) {
      void this.shutdownWorker(roomId);
    }
  }

  private handleWorkerMessage(
    roomId: string,
    message: WorkerOutboundMessage,
  ): void {
    const managed = this.workers.get(roomId);
    if (!managed) {
      return;
    }

    if ('correlationId' in message) {
      const pending = managed.pending.get(message.correlationId);
      if (pending) {
        clearTimeout(pending.timeout);
        managed.pending.delete(message.correlationId);
        pending.resolve(message);
      }
      return;
    }

    if ('type' in message && message.type === 'event') {
      this.eventsBus.publish(message.event, message.roomId, message.payload);

      const room = message.payload.room;
      if (room && typeof room === 'object' && 'id' in room) {
        this.roomStore.save(room as never);
      }

      if (
        message.event === 'room.finished' &&
        message.payload.reason !== undefined
      ) {
        void this.shutdownWorker(roomId);
      }
    }
  }
}
