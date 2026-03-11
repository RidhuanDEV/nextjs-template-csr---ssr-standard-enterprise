'use client';

import Link from 'next/link';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Sign In</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your credentials to access your account
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Sign Up
        </Link>
      </p>
    </>
  );
}
