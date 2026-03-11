import type { JwtPayload } from "./jwt";

export function hasPermission(
  session: JwtPayload,
  permission: string,
): boolean {
  return session.permissions.includes(permission);
}

export function hasAnyPermission(
  session: JwtPayload,
  permissions: string[],
): boolean {
  return permissions.some((p) => session.permissions.includes(p));
}

export function hasAllPermissions(
  session: JwtPayload,
  permissions: string[],
): boolean {
  return permissions.every((p) => session.permissions.includes(p));
}

export function hasRole(session: JwtPayload, role: string): boolean {
  return session.role === role;
}

export function requirePermission(
  session: JwtPayload,
  permission: string,
): void {
  if (!hasPermission(session, permission)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }
}

export function requireRole(session: JwtPayload, role: string): void {
  if (!hasRole(session, role)) {
    throw new Error(`Forbidden: requires role '${role}'`);
  }
}
