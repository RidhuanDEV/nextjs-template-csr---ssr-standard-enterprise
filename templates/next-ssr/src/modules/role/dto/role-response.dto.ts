export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  _count: { users: number };
  createdAt: string;
  updatedAt: string;
}

export function toRoleResponse(role: {
  id: string;
  name: string;
  description: string | null;
  permissions: { key: string }[];
  _count: { users: number };
  createdAt: Date;
  updatedAt: Date;
}): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((p) => p.key),
    _count: role._count,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}
