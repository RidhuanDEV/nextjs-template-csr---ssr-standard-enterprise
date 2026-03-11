import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/server/logger";

// How to use:
// - Throw Zod errors from schema parsing and normal Error instances for common unauthorized/forbidden/not-found cases.
// - Throw createApiError(...) when you need an explicit HTTP status plus structured field errors from custom logic.
// When to extend manually:
// - Add mappings for Prisma errors, third-party provider failures, storage uploads, or queue-specific failures.

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export function createApiError(
  message: string,
  statusCode: number,
  errors?: Record<string, string[]>,
): ApiError {
  return {
    message,
    statusCode,
    ...(errors ? { errors } : {}),
  };
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "statusCode" in error &&
    typeof (error as ApiError).message === "string" &&
    typeof (error as ApiError).statusCode === "number"
  );
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return NextResponse.json(createApiError("Validation failed", 400, fieldErrors), {
      status: 400,
    });
  }

  if (isApiError(error)) {
    return NextResponse.json(error, {
      status: error.statusCode,
    });
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json(createApiError("Unauthorized", 401), {
        status: 401,
      });
    }
    if (error.message.startsWith("Forbidden")) {
      return NextResponse.json(createApiError(error.message, 403), {
        status: 403,
      });
    }
    if (error.message === "Not found") {
      return NextResponse.json(createApiError("Not found", 404), {
        status: 404,
      });
    }

    logger.error({ err: error }, "Unhandled API error");
    return NextResponse.json(createApiError("Internal server error", 500), {
      status: 500,
    });
  }

  logger.error({ err: error }, "Unknown API error");
  return NextResponse.json(createApiError("Internal server error", 500), {
    status: 500,
  });
}
