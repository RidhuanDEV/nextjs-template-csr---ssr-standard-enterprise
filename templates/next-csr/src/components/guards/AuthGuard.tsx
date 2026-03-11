'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) {
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsub;
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/login');
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) return <LoadingScreen />;

  return <>{children}</>;
}
