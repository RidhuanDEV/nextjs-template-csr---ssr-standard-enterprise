import { prisma } from '@/server/db/prisma';
import { Prisma } from '@/generated/prisma/client';

export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      metadata: (entry.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });
}
