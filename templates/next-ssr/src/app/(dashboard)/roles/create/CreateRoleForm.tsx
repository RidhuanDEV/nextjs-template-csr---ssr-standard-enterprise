'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateRoleFormProps {
  permissions: { key: string; description: string | null }[];
}

export function CreateRoleForm({ permissions }: CreateRoleFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  function togglePermission(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.length === 0) {
      toast.error('Select at least one permission');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description') || undefined,
          permissions: selected,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to create role');
        return;
      }

      toast.success('Role created');
      router.push('/roles');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" name="name" placeholder="manager" required />
      <Input label="Description" name="description" placeholder="Optional description" />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Permissions
        </label>
        <div className="grid grid-cols-2 gap-2">
          {permissions.map((p) => (
            <label
              key={p.key}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(p.key)}
                onChange={() => togglePermission(p.key)}
                className="rounded"
              />
              <span className="text-zinc-900 dark:text-zinc-50">{p.key}</span>
            </label>
          ))}
        </div>
      </div>

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
