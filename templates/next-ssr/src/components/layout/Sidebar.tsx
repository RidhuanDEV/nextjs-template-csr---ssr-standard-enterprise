import Link from 'next/link';
import { cn } from '@/utils/cn';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Users', href: '/users' },
  { label: 'Roles', href: '/roles' },
];

export function Sidebar({ currentPath }: { currentPath: string }) {
  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">App</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              currentPath.startsWith(item.href)
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
