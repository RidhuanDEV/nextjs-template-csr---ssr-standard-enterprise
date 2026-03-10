import { type NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { handleApiError } from '@/server/middleware/error-handler';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { getUserById, updateUser, deleteUser } from '@/modules/user';
import { updateUserSchema } from '@/modules/user';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.USERS_READ);

    const { id } = await params;
    const user = await getUserById(id);
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.USERS_UPDATE);

    const { id } = await params;
    const body = await req.json();
    const input = updateUserSchema.parse(body);
    const user = await updateUser(id, input, session.sub);

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.USERS_DELETE);

    const { id } = await params;
    await deleteUser(id, session.sub);

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
