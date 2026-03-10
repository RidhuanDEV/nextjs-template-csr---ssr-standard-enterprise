'use client';

import Link from 'next/link';
import { RegisterForm } from '@/modules/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create Account</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Sign up to get started</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
          Sign In
        </Link>
      </p>
    </>
  );
}
