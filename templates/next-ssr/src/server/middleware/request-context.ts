import { type JwtPayload } from "@/server/auth/jwt";

interface RequestContext {
  session: JwtPayload | null;
  requestId: string;
  ip: string;
}

export function createRequestContext(
  session: JwtPayload | null,
  headers: Headers,
): RequestContext {
  return {
    session,
    requestId: crypto.randomUUID(),
    ip: headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "unknown",
  };
}
