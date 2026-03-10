import { hash } from 'bcryptjs';
import { prisma } from '@/server/db/prisma';
import { createAuditLog } from '@/server/middleware/audit-log';
import { cacheDel, cacheDelPattern } from '@/server/cache/redis';
import { AUDIT_ACTIONS } from '@/lib/constants';
import { paginate, type PaginatedResponse } from '@/lib/query/pagination';
import { buildUserQuery } from '../queries/user.query';
import type { CreateUserInput, UpdateUserInput, SearchUserInput } from '../schemas/user.schema';
import type { UserResponse } from '../dto/user-response.dto';

function toResponse(user: {
  id: string;
  email: string;
  name: string;
  role: { id: string; name: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: { id: user.role.id, name: user.role.name },
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers(params: SearchUserInput): Promise<PaginatedResponse<UserResponse>> {
  const query = buildUserQuery(params);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: query.where,
      skip: query.skip,
      take: query.take,
      orderBy: query.orderBy,
      include: { role: true },
    }),
    prisma.user.count({ where: query.where }),
  ]);

  return paginate(users.map(toResponse), total, params.page, params.limit);
}

export async function getUserById(id: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: { role: true },
  });

  if (!user) throw new Error('Not found');

  return toResponse(user);
}

export async function createUser(input: CreateUserInput, actorId: string): Promise<UserResponse> {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new Error('Email already registered');

  const hashedPassword = await hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        roleId: input.roleId,
      },
      include: { role: true },
    });

    return created;
  });

  await createAuditLog({
    userId: actorId,
    action: AUDIT_ACTIONS.USER_CREATED,
    entity: 'user',
    entityId: user.id,
    metadata: { name: user.name, email: user.email },
  });

  await cacheDelPattern('users:*');

  return toResponse(user);
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string): Promise<UserResponse> {
  const data: Record<string, unknown> = { ...input };

  if (input.password) {
    data.password = await hash(input.password, 12);
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id, deletedAt: null },
      data,
      include: { role: true },
    });

    return updated;
  });

  await createAuditLog({
    userId: actorId,
    action: AUDIT_ACTIONS.USER_UPDATED,
    entity: 'user',
    entityId: user.id,
    metadata: { fields: Object.keys(input) },
  });

  await cacheDel(`users:${id}`);
  await cacheDelPattern('users:list:*');

  return toResponse(user);
}

export async function deleteUser(id: string, actorId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
  });

  await createAuditLog({
    userId: actorId,
    action: AUDIT_ACTIONS.USER_DELETED,
    entity: 'user',
    entityId: id,
  });

  await cacheDel(`users:${id}`);
  await cacheDelPattern('users:list:*');
}
