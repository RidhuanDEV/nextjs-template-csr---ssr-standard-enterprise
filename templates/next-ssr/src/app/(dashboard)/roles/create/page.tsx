import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { prisma } from '@/server/db/prisma';
import { CreateRoleForm } from './CreateRoleForm';

export default async function CreateRolePage() {
  const session = await requireSession();
  requirePermission(session, PERMISSIONS.ROLES_CREATE);

  const permissions = await prisma.permission.findMany({ orderBy: { key: 'asc' } });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create Role</h1>
      <CreateRoleForm permissions={permissions.map((p: { key: string; description: string | null }) => ({ key: p.key, description: p.description }))} />
    </div>
  );
}
