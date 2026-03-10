import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { listRoles } from '@/modules/role';
import { CreateUserForm } from './CreateUserForm';

export default async function CreateUserPage() {
  const session = await requireSession();
  requirePermission(session, PERMISSIONS.USERS_CREATE);

  const roles = await listRoles();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create User</h1>
      <CreateUserForm roles={roles.map((r) => ({ value: r.id, label: r.name }))} />
    </div>
  );
}
