import { type NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { handleApiError } from '@/server/middleware/error-handler';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getRoleById, updateRole, deleteRole } from '@/modules/role';
import { updateRoleSchema } from '@/modules/role';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.ROLES_READ);

    const { id } = await params;
    const role = await getRoleById(id);
    return NextResponse.json(role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.ROLES_UPDATE);

    const { id } = await params;
    const body = await req.json();
    const input = updateRoleSchema.parse(body);
    const role = await updateRole(id, input, session.sub);

    return NextResponse.json(role);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.ROLES_DELETE);

    const { id } = await params;
    await deleteRole(id, session.sub);

    return NextResponse.json({ message: 'Role deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
