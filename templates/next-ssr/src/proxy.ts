import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret",
);

const publicPaths = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];
const apiProtectedPaths = ["/api/users", "/api/roles"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // API routes protection
  if (apiProtectedPaths.some((p) => pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  // Page routes protection (redirect to login)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/roles")
  ) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};