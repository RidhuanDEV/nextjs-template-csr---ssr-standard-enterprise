import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getUserById } from '@/modules/user';
import { listRoles } from '@/modules/role';
import { EditUserForm } from './EditUserForm';
import { DeleteUserButton } from './DeleteUserButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const session = await requireSession();
  requirePermission(session, PERMISSIONS.USERS_READ);

  const { id } = await params;
  const [user, roles] = await Promise.all([getUserById(id), listRoles()]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Edit User</h1>
        <DeleteUserButton userId={user.id} />
      </div>
      <EditUserForm
        user={user}
        roles={roles.map((r) => ({ value: r.id, label: r.name }))}
      />
    </div>
  );
}
