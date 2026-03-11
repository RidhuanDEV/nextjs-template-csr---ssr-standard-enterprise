import { PrismaClient } from "@/generated/prisma/client";
import { createMariaDbAdapter } from "@/server/db/adapter";

const adapter = createMariaDbAdapter();

export const prisma = globalThis.__appPrisma__ ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.__appPrisma__ = prisma;
}
