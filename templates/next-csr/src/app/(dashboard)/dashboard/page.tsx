'use client';

import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Welcome{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        This is your dashboard. Start building your application from here.
      </p>
    </div>
  );
}
