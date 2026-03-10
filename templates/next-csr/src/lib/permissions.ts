import type { User } from '@/modules/auth/types/auth.types';

export function hasRole(user: User, role: string): boolean {
  return user.roles.includes(role);
}

export function hasAnyRole(user: User, roles: string[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function hasPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User, permissions: string[]): boolean {
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: User, permissions: string[]): boolean {
  return permissions.every((p) => user.permissions.includes(p));
}
