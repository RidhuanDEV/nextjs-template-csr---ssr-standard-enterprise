'use client';

import { useRouter } from 'next/navigation';
import type { RoleResponse } from '@/modules/role/dto/role-response.dto';
import { Button } from '@/components/ui/Button';

export function RolesTable({ roles }: { roles: RoleResponse[] }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Name</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Description</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Permissions</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">Users</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {roles.map((role) => (
            <tr key={role.id} className="bg-white dark:bg-zinc-950">
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{role.name}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{role.description || '-'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {p}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="text-xs text-zinc-500">+{role.permissions.length - 3}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{role._count.users}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => router.push(`/roles/${role.id}`)}>
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
