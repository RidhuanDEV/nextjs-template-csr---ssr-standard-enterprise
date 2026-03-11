import type { ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { createLogger } from "@/server/logger";

const redisLogger = createLogger("redis");
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const REDIS_CONNECT_TIMEOUT_MS = 1_000;

function redactRedisUrl(value: string): string {
  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.password) {
      parsedUrl.password = "***";
    }

    return parsedUrl.toString();
  } catch {
    return "redis://<invalid-url>";
  }
}

function createRedisClient(): Redis {
  const client = new Redis(REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    retryStrategy(attempts) {
      return attempts >= 2 ? null : 250;
    },
  });

  let hasLoggedConnectionIssue = false;

  client.on("ready", () => {
    if (!hasLoggedConnectionIssue) {
      return;
    }

    hasLoggedConnectionIssue = false;
    redisLogger.info({ url: redactRedisUrl(REDIS_URL) }, "Redis connection restored");
  });

  client.on("error", (error) => {
    if (hasLoggedConnectionIssue) {
      return;
    }

    hasLoggedConnectionIssue = true;
    redisLogger.warn(
      {
        err: error,
        url: redactRedisUrl(REDIS_URL),
      },
      "Redis is unavailable; cache, rate limiting, and queue features will degrade gracefully until it becomes reachable",
    );
  });

  return client;
}

export const redis = globalThis.__appRedis__ ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__appRedis__ = redis;
}

function readRedisDatabaseIndex(parsedUrl: URL): number | undefined {
  const databasePath = parsedUrl.pathname.replace(/^\/+/, "");

  if (databasePath.length === 0) {
    return undefined;
  }

  const databaseIndex = Number(databasePath);

  if (!Number.isInteger(databaseIndex) || databaseIndex < 0) {
    return undefined;
  }

  return databaseIndex;
}

function isRedisConnectionError(error: Error): boolean {
  return (
    error.name === "AggregateError" ||
    error.name === "MaxRetriesPerRequestError" ||
    /ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|Connection is closed|Reached the max retries per request limit/i.test(
      error.message,
    )
  );
}

async function ensureRedisReady(): Promise<boolean> {
  if (redis.status === "ready" || redis.status === "connect") {
    return true;
  }

  if (redis.status === "connecting" || redis.status === "reconnecting") {
    return false;
  }

  try {
    await redis.connect();
    return true;
  } catch (error) {
    if (error instanceof Error && isRedisConnectionError(error)) {
      return false;
    }

    throw error;
  }
}

export async function runRedisCommand<T>(
  command: (client: Redis) => Promise<T>,
  fallbackValue: T,
): Promise<T> {
  if (!(await ensureRedisReady())) {
    return fallbackValue;
  }

  try {
    return await command(redis);
  } catch (error) {
    if (error instanceof Error && isRedisConnectionError(error)) {
      return fallbackValue;
    }

    throw error;
  }
}

export function createRedisConnectionOptions(): ConnectionOptions {
  const parsedUrl = new URL(REDIS_URL);
  const protocol = parsedUrl.protocol;

  if (protocol !== "redis:" && protocol !== "rediss:") {
    throw new Error("REDIS_URL must start with redis:// or rediss://");
  }

  const databaseIndex = readRedisDatabaseIndex(parsedUrl);

  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port.length > 0 ? Number(parsedUrl.port) : 6379,
    ...(parsedUrl.username ? { username: decodeURIComponent(parsedUrl.username) } : {}),
    ...(parsedUrl.password ? { password: decodeURIComponent(parsedUrl.password) } : {}),
    ...(databaseIndex !== undefined ? { db: databaseIndex } : {}),
    ...(protocol === "rediss:" ? { tls: {} } : {}),
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
  };
}

export async function cacheGet<T>(
  key: string,
  parse: (serializedValue: string) => T,
): Promise<T | null> {
  const data = await runRedisCommand((client) => client.get(key), null);

  if (data === null) {
    return null;
  }

  return parse(data);
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await runRedisCommand(async (client) => {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }, undefined);
}

export async function cacheDel(key: string): Promise<void> {
  await runRedisCommand(async (client) => {
    await client.del(key);
  }, undefined);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await runRedisCommand((client) => client.keys(pattern), Array<string>());
  if (keys.length > 0) {
    await runRedisCommand(async (client) => {
      await client.del(...keys);
    }, undefined);
  }
}
