"use client";

const SESSION_KEY = "career-card:event-session";

function getEventSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

export function trackEvent(
  eventName: string,
  source: "edit" | "public" | "presentation" | "share",
  props: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      source,
      sessionId: getEventSessionId(),
      props,
    }),
    keepalive: true,
  }).catch(() => undefined);
}
