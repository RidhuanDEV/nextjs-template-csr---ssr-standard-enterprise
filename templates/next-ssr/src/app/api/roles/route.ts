import { type NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { requirePermission } from '@/server/auth/permissions';
import { handleApiError } from '@/server/middleware/error-handler';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { listRoles, createRole } from '@/modules/role';
import { createRoleSchema } from '@/modules/role';

export async function GET() {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.ROLES_READ);

    const roles = await listRoles();
    return NextResponse.json(roles);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.ROLES_CREATE);

    const body = await req.json();
    const input = createRoleSchema.parse(body);
    const role = await createRole(input, session.sub);

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
