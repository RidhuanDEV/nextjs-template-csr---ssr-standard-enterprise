import { getSession } from '@/server/auth/session';

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Welcome{session?.email ? `, ${session.email}` : ''}
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        This is your dashboard. Start building your application from here.
      </p>
    </div>
  );
}
