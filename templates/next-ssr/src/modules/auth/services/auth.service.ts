import { hash, compare } from 'bcryptjs';
import { prisma } from '@/server/db/prisma';
import { signToken, type JwtPayload } from '@/server/auth/jwt';
import { createAuditLog } from '@/server/middleware/audit-log';
import { AUDIT_ACTIONS } from '@/lib/constants';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import type { AuthUser } from '../types/auth.types';

export async function loginUser(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: { include: { permissions: { select: { key: true } } } } },
  });

  if (!user || user.deletedAt) {
    throw new Error('Invalid credentials');
  }

  const valid = await compare(input.password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  const permissions = user.role.permissions.map((p) => p.key);

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    permissions,
  };

  const token = await signToken(payload);

  await createAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.USER_LOGIN,
    entity: 'user',
    entityId: user.id,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      permissions,
    },
    token,
  };
}

export async function registerUser(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new Error('Email already registered');
  }

  const defaultRole = await prisma.role.findUnique({ where: { name: 'user' } });
  if (!defaultRole) {
    throw new Error('Default role not found. Run seed first.');
  }

  const hashedPassword = await hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
      roleId: defaultRole.id,
    },
    include: { role: { include: { permissions: { select: { key: true } } } } },
  });

  const permissions = user.role.permissions.map((p) => p.key);

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role.name,
    permissions,
  };

  const token = await signToken(payload);

  await createAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.USER_REGISTER,
    entity: 'user',
    entityId: user.id,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      permissions,
    },
    token,
  };
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    include: { role: { include: { permissions: { select: { key: true } } } } },
  });

  if (!user) {
    throw new Error('Not found');
  }

  const permissions = user.role.permissions.map((p) => p.key);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    permissions,
  };
}
