import { Queue, Worker, type Processor, type ConnectionOptions } from 'bullmq';
import { redis } from '@/server/cache/redis';

const connection = redis as unknown as ConnectionOptions;

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export function createWorker<T>(name: string, processor: Processor<T>) {
  return new Worker<T>(name, processor, { connection });
}
