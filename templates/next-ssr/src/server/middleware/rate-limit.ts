import { runRedisCommand } from "@/server/cache/redis";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60_000, max: 60 },
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / config.windowMs)}`;

  return runRedisCommand(
    async (client) => {
      const current = await client.incr(windowKey);

      if (current === 1) {
        await client.pexpire(windowKey, config.windowMs);
      }

      return {
        allowed: current <= config.max,
        remaining: Math.max(0, config.max - current),
      };
    },
    {
      allowed: true,
      remaining: config.max,
    },
  );
}
