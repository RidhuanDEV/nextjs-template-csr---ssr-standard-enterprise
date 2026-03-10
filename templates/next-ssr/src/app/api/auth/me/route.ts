import { NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { getCurrentUser } from '@/modules/auth/services/auth.service';
import { handleApiError } from '@/server/middleware/error-handler';

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getCurrentUser(session.sub);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
