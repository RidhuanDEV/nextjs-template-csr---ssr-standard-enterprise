import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/middleware/audit-log";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { toRoleResponse, type RoleResponse } from "../dto/role-response.dto";
import type { CreateRoleInput, UpdateRoleInput } from "../schemas/role.schema";

const roleInclude = {
  permissions: { select: { key: true } },
  _count: { select: { users: true } },
} as const;

export async function listRoles(): Promise<RoleResponse[]> {
  const roles = await prisma.role.findMany({
    include: roleInclude,
    orderBy: { name: "asc" },
  });

  return roles.map(toRoleResponse);
}

export async function getRoleById(id: string): Promise<RoleResponse> {
  const role = await prisma.role.findUnique({
    where: { id },
    include: roleInclude,
  });

  if (!role) throw new Error("Not found");

  return toRoleResponse(role);
}

export async function createRole(input: CreateRoleInput, actorId: string): Promise<RoleResponse> {
  const exists = await prisma.role.findUnique({ where: { name: input.name } });
  if (exists) throw new Error("Role name already exists");

  const roleId = await prisma.$transaction(async (tx) => {
    const createdRole = await tx.role.create({
      data: {
        name: input.name,
        ...(input.description !== undefined ? { description: input.description } : {}),
        permissions: {
          connect: input.permissions.map((key) => ({ key })),
        },
      },
    });

    return createdRole.id;
  });

  await createAuditLog({
    userId: actorId,
    action: AUDIT_ACTIONS.ROLE_CREATED,
    entity: "role",
    entityId: roleId,
    metadata: { name: input.name },
  });

  return getRoleById(roleId);
}

export async function updateRole(
  id: string,
  input: UpdateRoleInput,
  actorId: string,
): Promise<RoleResponse> {
  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.permissions && {
          permissions: {
            set: input.permissions.map((key) => ({ key })),
          },
        }),
      },
    });
  });

  await createAuditLog({
    userId: actorId,
    action: AUDIT_ACTIONS.ROLE_UPDATED,
    entity: "role",
    entityId: id,
    metadata: { fields: Object.keys(input) },
  });

  return getRoleById(id);
}

export async function deleteRole(id: string, actorId: string): Promise<void> {
  const usersCount = await prisma.user.count({ where: { roleId: id } });
  if (usersCount > 0) throw new Error("Cannot delete role with assigned users");

  await prisma.role.delete({ where: { id } });

  await createAuditLog({
    userId: actorId,
    action: AUDIT_ACTIONS.ROLE_DELETED,
    entity: "role",
    entityId: id,
  });
}
