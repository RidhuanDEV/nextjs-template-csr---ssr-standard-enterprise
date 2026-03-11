import { Queue, Worker, type Processor } from "bullmq";
import { createRedisConnectionOptions } from "@/server/cache/redis";

const connection = createRedisConnectionOptions();

// How to use:
// - Call createQueue('queue-name') from services/routes when a task should run asynchronously.
// - Call createWorker('queue-name', processor) inside a worker entrypoint to process jobs.
// When to use:
// - Use queues for slow or retryable side effects such as email, exports, webhooks, media processing,
//   and third-party syncs.
// - Do NOT use queues for synchronous request validation or database writes that must finish before the
//   HTTP response is returned.

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export function createWorker<T>(name: string, processor: Processor<T>) {
  return new Worker<T>(name, processor, { connection });
}
