import { requireSession } from "@/server/auth/session";
import { requirePermission } from "@/server/auth/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { listRoles } from "@/modules/role";
import { RolesTable } from "./RolesTable";
import Link from "next/link";

export default async function RolesPage() {
  const session = await requireSession();
  requirePermission(session, PERMISSIONS.ROLES_READ);

  const roles = await listRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Roles
        </h1>
        <Link
          href="/roles/create"
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create Role
        </Link>
      </div>
      <RolesTable roles={roles} />
    </div>
  );
}
