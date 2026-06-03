import { parentPort, workerData } from 'worker_threads';
import {
  WorkerCommandMessage,
  WorkerEventMessage,
  WorkerOutboundMessage,
} from '../interfaces/worker-messages.interface';
import { WorkerGameSession } from './worker-game-session';

interface WorkerBootstrapData {
  roomId: string;
  workerId: string;
}

if (!parentPort) {
  throw new Error('game.worker.ts debe ejecutarse dentro de un Worker Thread');
}

const bootstrap = workerData as WorkerBootstrapData;
const session = new WorkerGameSession((event: WorkerEventMessage) => {
  parentPort!.postMessage(event satisfies WorkerOutboundMessage);
});

parentPort.postMessage({
  type: 'ready',
  roomId: bootstrap.roomId,
  workerId: bootstrap.workerId,
} satisfies WorkerOutboundMessage);

parentPort.on('message', (message: WorkerCommandMessage) => {
  const response = session.handleCommand(message);
  parentPort!.postMessage(response satisfies WorkerOutboundMessage);
});

parentPort.on('close', () => {
  session.handleCommand({
    correlationId: 'shutdown',
    command: 'SHUTDOWN',
    payload: {},
  });
});
