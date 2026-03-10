import { LogoutButton } from './LogoutButton';

export function Header({ userName }: { userName?: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
      <div className="flex items-center gap-4">
        {userName && <span className="text-sm text-zinc-600 dark:text-zinc-400">{userName}</span>}
        <LogoutButton />
      </div>
    </header>
  );
}
