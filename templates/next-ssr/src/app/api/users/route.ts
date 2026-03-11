import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { requirePermission } from "@/server/auth/permissions";
import { handleApiError } from "@/server/middleware/error-handler";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { listUsers, createUser } from "@/modules/user";
import { searchUserSchema, createUserSchema } from "@/modules/user";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.USERS_READ);

    const { searchParams } = new URL(req.url);
    const params = searchUserSchema.parse({
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
    });

    const result = await listUsers(params);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    requirePermission(session, PERMISSIONS.USERS_CREATE);

    const body = await req.json();
    const input = createUserSchema.parse(body);
    const user = await createUser(input, session.sub);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
