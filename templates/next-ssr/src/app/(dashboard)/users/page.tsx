import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { listUsers } from '@/modules/user';
import { UsersTable } from './UsersTable';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const session = await requireSession();
  requirePermission(session, PERMISSIONS.USERS_READ);

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';

  const result = await listUsers({ page, limit: 10, search: search || undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Users</h1>
        <Link
          href="/users/create"
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create User
        </Link>
      </div>
      <UsersTable data={result} currentSearch={search} />
    </div>
  );
}
