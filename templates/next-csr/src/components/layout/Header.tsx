'use client';

import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/modules/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{user?.name}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
