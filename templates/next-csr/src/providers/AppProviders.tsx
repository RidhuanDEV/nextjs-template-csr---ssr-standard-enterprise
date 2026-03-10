'use client';

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { QueryProvider } from './QueryProvider';
import { ToastContainer } from '@/components/feedback/Toast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        {children}
        <ToastContainer />
      </QueryProvider>
    </ErrorBoundary>
  );
}
