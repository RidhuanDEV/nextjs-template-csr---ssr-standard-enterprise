import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/server/logger';

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export function createApiError(message: string, statusCode: number, errors?: Record<string, string[]>): ApiError {
  return { message, statusCode, errors };
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return NextResponse.json(
      createApiError('Validation failed', 400, fieldErrors),
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(createApiError('Unauthorized', 401), { status: 401 });
    }
    if (error.message.startsWith('Forbidden')) {
      return NextResponse.json(createApiError(error.message, 403), { status: 403 });
    }
    if (error.message === 'Not found') {
      return NextResponse.json(createApiError('Not found', 404), { status: 404 });
    }

    logger.error({ err: error }, 'Unhandled API error');
    return NextResponse.json(
      createApiError('Internal server error', 500),
      { status: 500 }
    );
  }

  logger.error({ err: error }, 'Unknown API error');
  return NextResponse.json(
    createApiError('Internal server error', 500),
    { status: 500 }
  );
}
