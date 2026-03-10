import { headers } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { getSession } from '@/server/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/dashboard';

  return (
    <div className="flex h-screen">
      <Sidebar currentPath={pathname} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={session?.email} />
        <main className="flex-1 overflow-auto bg-zinc-50 p-6 dark:bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
