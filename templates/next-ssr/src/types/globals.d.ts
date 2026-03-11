import type { PrismaClient } from "../generated/prisma/client";
import type Redis from "ioredis";

declare global {
  var __appPrisma__: PrismaClient | undefined;
  var __appRedis__: Redis | undefined;
}

export {};
