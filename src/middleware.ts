// middleware.ts
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { match } from "path-to-regexp";

const loginRoutes = ["/login"];
const protectedRoutes = ["/dashboard", "/dashboard/:playlist_id"];

const matchesRoute = (patterns: string[], path: string) =>
  patterns.some((pattern) =>
    match(pattern, { decode: decodeURIComponent })(path),
  );

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isLoginRoute = matchesRoute(loginRoutes, path);
  const isProtectedRoute = matchesRoute(protectedRoutes, path);

  const cookiesStore = await cookies();
  const authenticated = cookiesStore.has("access_token");

  // Redirect authenticated users away from login pages
  if (isLoginRoute && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Redirect unauthenticated users to login for protected pages
  if (isProtectedRoute && !authenticated) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
