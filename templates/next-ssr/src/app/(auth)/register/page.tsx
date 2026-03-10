import { RegisterForm } from './RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Fill in your details to get started
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
