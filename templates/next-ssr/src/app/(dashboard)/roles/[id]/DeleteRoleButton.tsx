'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/ui/Button';

export function DeleteRoleButton({ roleId }: { roleId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this role?')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete role');
        return;
      }

      toast.success('Role deleted');
      router.push('/roles');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="danger" size="sm" loading={loading} onClick={handleDelete}>
      Delete
    </Button>
  );
}
