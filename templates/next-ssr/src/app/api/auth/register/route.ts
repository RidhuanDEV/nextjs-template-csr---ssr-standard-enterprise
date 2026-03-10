import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/modules/auth/schemas/auth.schema';
import { registerUser } from '@/modules/auth/services/auth.service';
import { handleApiError } from '@/server/middleware/error-handler';
import { checkRateLimit } from '@/server/middleware/rate-limit';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const { allowed } = await checkRateLimit(`register:${ip}`, { windowMs: 60_000, max: 5 });
    if (!allowed) {
      return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const input = registerSchema.parse(body);
    const { user, token } = await registerUser(input);

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
