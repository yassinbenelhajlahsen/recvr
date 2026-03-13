import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i;

const MOBILE_ALLOWED = [
  "/",
  "/mobile",
  "/api",
  "/_next",
  "/favicon",
  "/privacy",
  "/terms-of-service",
];

const CORS_ORIGINS: string[] = [
  "https://recvr.fit",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000"]
    : []),
];

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function isMobileAllowed(pathname: string): boolean {
  return MOBILE_ALLOWED.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ua = request.headers.get("user-agent") ?? "";
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = CORS_ORIGINS.includes(origin);

  // CORS preflight for API routes
  if (pathname.startsWith("/api") && request.method === "OPTIONS") {
    if (isAllowedOrigin) {
      return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
    }
    return new NextResponse(null, { status: 403 });
  }

  // Redirect mobile UAs on gated routes before running auth
  if (MOBILE_UA_RE.test(ua) && !isMobileAllowed(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/mobile";
    return NextResponse.redirect(url);
  }

  const response = await updateSession(request);

  // Append CORS headers to API responses
  if (pathname.startsWith("/api") && isAllowedOrigin) {
    const headers = corsHeaders(origin);
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
