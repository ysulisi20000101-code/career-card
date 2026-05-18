import { NextResponse } from "next/server";

function sameOriginFromRequestUrl(request: Request, candidate: string | null): boolean {
  if (!candidate) return false;
  try {
    return new URL(candidate).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isSameOriginBrowserRequest(request: Request): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin") return true;

  const origin = request.headers.get("origin");
  if (origin && sameOriginFromRequestUrl(request, origin)) return true;

  const referer = request.headers.get("referer");
  return sameOriginFromRequestUrl(request, referer);
}

/**
 * Simple API key authentication middleware.
 *
 * When `API_SECRET` is set in the environment, requests to protected routes
 * must include either:
 *   - An `x-api-key` header matching the secret, OR
 *   - A Bearer token in the `Authorization` header matching the secret
 * Same-origin browser requests from the app are also allowed so enabling the
 * secret does not break first-party UI calls.
 *
 * When `API_SECRET` is not set (local dev), all requests are allowed through.
 */
export function checkApiKey(request: Request): NextResponse | null {
  const secret = process.env.API_SECRET;
  if (!secret) {
    console.warn("[career-card] API_SECRET is not set — allowing all requests. Set API_SECRET to enable authentication.");
    return null;
  }

  const headerKey = request.headers.get("x-api-key") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (headerKey === secret || bearerToken === secret) {
    return null; // auth passed
  }

  if (isSameOriginBrowserRequest(request)) {
    return null;
  }

  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}
