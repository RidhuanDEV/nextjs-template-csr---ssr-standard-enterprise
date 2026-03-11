"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { UserResponse } from "@/modules/user/dto/user-response.dto";

interface EditUserFormProps {
  user: UserResponse;
  roles: { value: string; label: string }[];
}

export function EditUserForm({ user, roles }: EditUserFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: formData.get("name"),
      email: formData.get("email"),
      roleId: formData.get("roleId"),
    };

    const password = formData.get("password") as string;
    if (password) {
      body.password = password;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update user");
        return;
      }

      toast.success("User updated");
      router.push("/users");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" name="name" defaultValue={user.name} required />
      <Input
        label="Email"
        name="email"
        type="email"
        defaultValue={user.email}
        required
      />
      <Input
        label="New Password"
        name="password"
        type="password"
        placeholder="Leave blank to keep current"
      />
      <Select
        label="Role"
        name="roleId"
        options={roles}
        defaultValue={user.role.id}
      />
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
