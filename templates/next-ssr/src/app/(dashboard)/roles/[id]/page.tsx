import { requireSession } from "@/server/auth/session";
import { requirePermission } from "@/server/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getRoleById } from "@/modules/role";
import { prisma } from "@/server/db/prisma";
import { EditRoleForm } from "./EditRoleForm";
import { DeleteRoleButton } from "./DeleteRoleButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoleDetailPage({ params }: PageProps) {
  const session = await requireSession();
  requirePermission(session, PERMISSIONS.ROLES_READ);

  const { id } = await params;
  const [role, allPermissions] = await Promise.all([
    getRoleById(id),
    prisma.permission.findMany({ orderBy: { key: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Edit Role
        </h1>
        <DeleteRoleButton roleId={role.id} />
      </div>
      <EditRoleForm
        role={role}
        allPermissions={allPermissions.map(
          (p: { key: string; description: string | null }) => ({
            key: p.key,
            description: p.description,
          }),
        )}
      />
    </div>
  );
}
