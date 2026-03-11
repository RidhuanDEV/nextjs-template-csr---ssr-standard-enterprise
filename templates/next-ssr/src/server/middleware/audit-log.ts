import { prisma } from "@/server/db/prisma";
import { Prisma } from "@/generated/prisma/client";

// How to use:
// - Call createAuditLog inside the same transaction as the write operation whenever you need an
//   immutable record of who changed what.
// When to use:
// - Use for create/update/delete actions, permission-sensitive changes, and operational events that
//   matter for compliance or debugging.
// - Skip noisy read-only actions unless your product has explicit audit requirements for reads.

type AuditLogMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditLogMetadataValue[]
  | { [key: string]: AuditLogMetadataValue };

export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, AuditLogMetadataValue>;
}

type AuditLogClient = Pick<typeof prisma, "auditLog">;

export async function createAuditLog(
  entry: AuditLogEntry,
  client: AuditLogClient = prisma,
): Promise<void> {
  await client.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ? (entry.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}
