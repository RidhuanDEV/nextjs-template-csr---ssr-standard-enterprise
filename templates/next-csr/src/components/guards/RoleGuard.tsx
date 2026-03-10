'use client';

import { useAuthStore } from '@/store/auth.store';
import { hasRole, hasPermission } from '@/lib/permissions';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, permissions, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <>{fallback}</>;

  if (roles && !roles.some((role) => hasRole(user, role))) {
    return <>{fallback}</>;
  }

  if (permissions && !permissions.some((perm) => hasPermission(user, perm))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
