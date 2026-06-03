import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { WorkerEventType } from '../interfaces/worker-messages.interface';

export interface GameBusEvent {
  roomId: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class GameEventsBusService extends EventEmitter {
  publish(event: WorkerEventType, roomId: string, payload: Record<string, unknown>): void {
    this.emit(event, { roomId, payload } satisfies GameBusEvent);
  }
}
