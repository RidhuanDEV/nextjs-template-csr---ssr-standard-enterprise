"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useToast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";

interface DeleteRoleButtonProps {
  roleId: string;
}

interface DeleteRoleErrorResponse {
  message?: string;
}

export function DeleteRoleButton({ roleId }: DeleteRoleButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const descriptionId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete(): Promise<void> {
    setLoading(true);

    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE" });

      if (!res.ok) {
        const data = (await res.json()) as DeleteRoleErrorResponse;
        toast.error(data.message || "Failed to delete role");
        return;
      }

      toast.success("Role deleted");
      router.push("/roles");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" loading={loading} onClick={() => setIsOpen(true)}>
        Delete
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-950"
          >
            <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Delete role
            </h2>
            <p id={descriptionId} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This action permanently removes the role. Continue only if you are sure.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={loading}
                onClick={() => void handleDelete()}
              >
                Delete role
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
