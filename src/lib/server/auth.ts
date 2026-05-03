import { NextResponse } from "next/server";

/**
 * Simple API key authentication middleware.
 *
 * When `API_SECRET` is set in the environment, requests to protected routes
 * must include either:
 *   - An `x-api-key` header matching the secret, OR
 *   - A Bearer token in the `Authorization` header matching the secret
 *
 * When `API_SECRET` is not set (local dev), all requests are allowed through.
 */
export function checkApiKey(request: Request): NextResponse | null {
  const secret = process.env.API_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[career-card] API_SECRET is not set — rejecting all write requests in production");
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.warn("[career-card] API_SECRET is not set — allowing all requests (dev mode)");
    return null;
  }

  const headerKey = request.headers.get("x-api-key") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (headerKey === secret || bearerToken === secret) {
    return null; // auth passed
  }

  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}
