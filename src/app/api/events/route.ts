import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { createShareEvent, listShareEventSummaries } from "@/lib/server/commercial-repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 20);
  const summaries = await listShareEventSummaries(slugs);
  return NextResponse.json({ summaries });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = (await request.json()) as {
      eventName?: string;
      sessionId?: string;
      cardId?: string;
      publishedSiteId?: string;
      source?: "edit" | "public" | "presentation" | "share" | "billing";
      props?: Record<string, unknown>;
    };
    if (!body.eventName || !body.sessionId || !body.source) {
      return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 });
    }
    const event = await createShareEvent({
      userId: user?.id,
      cardId: body.cardId,
      publishedSiteId: body.publishedSiteId,
      eventName: body.eventName,
      sessionId: body.sessionId,
      source: body.source,
      props: body.props ?? {},
    });
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "EVENT_WRITE_FAILED" }, { status: 400 });
  }
}
