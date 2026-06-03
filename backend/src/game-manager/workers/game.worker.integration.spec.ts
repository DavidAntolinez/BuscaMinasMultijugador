import { existsSync } from 'fs';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';

const workerScriptPath = join(
  process.cwd(),
  'dist',
  'game-manager',
  'workers',
  'game.worker.js',
);

const describeIntegration = existsSync(workerScriptPath)
  ? describe
  : describe.skip;

describeIntegration('Game Worker Integration', () => {

  it('should initialize worker session and respond to INIT', async () => {
    const roomId = uuidv4();
    const workerId = uuidv4();

    const worker = new Worker(workerScriptPath, {
      workerData: { roomId, workerId },
    });

    worker.on('error', (error) => {
      throw error;
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('ready timeout')),
        5000,
      );

      worker.on('message', (message) => {
        if (message.type === 'ready') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    const response = await new Promise<{
      success: boolean;
      room?: { status: string };
    }>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('init response timeout')),
        5000,
      );

      worker.on('message', (message) => {
        if ('correlationId' in message && message.correlationId === 'init-test') {
          clearTimeout(timeout);
          resolve(message);
        }
      });

        worker.postMessage({
          correlationId: 'init-test',
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
      },
    );

    expect(response.success).toBe(true);
    expect(response.room?.status).toBe('WAITING');

    await worker.terminate();
  }, 10_000);
});
