'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface CreateUserFormProps {
  roles: { value: string; label: string }[];
}

export function CreateUserForm({ roles }: CreateUserFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
          roleId: formData.get('roleId'),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to create user');
        return;
      }

      toast.success('User created');
      router.push('/users');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" name="name" placeholder="John Doe" required />
      <Input label="Email" name="email" type="email" placeholder="you@example.com" required />
      <Input label="Password" name="password" type="password" placeholder="••••••••" required minLength={8} />
      <Select label="Role" name="roleId" options={roles} />
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          Create
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
