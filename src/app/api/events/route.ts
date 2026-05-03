import { NextResponse } from "next/server";
import { checkApiKey } from "@/lib/server/auth";
import { isRecord, asString } from "@/lib/utils-helpers";

export const runtime = "nodejs";

let eventsLock: Promise<void> = Promise.resolve();
function withEventsLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = eventsLock.then(fn, fn);
  eventsLock = result.then(() => undefined, () => undefined);
  return result;
}

interface StoredEvent {
  id: string;
  eventName: string;
  sessionId: string;
  source: string;
  props: Record<string, unknown>;
  createdAt: string;
}

interface EventSummary {
  slug: string;
  opens: number;
  effectiveViews: number;
  contactClicks: number;
  lastViewedAt?: string;
}

function slugFrom(event: StoredEvent): string {
  return asString(event.props.slug);
}

async function getStoreFile(): Promise<string> {
  const path = await import("node:path");
  return path.join(process.cwd(), ".data", "events.json");
}

async function readEvents(): Promise<StoredEvent[]> {
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(await getStoreFile(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isStoredEvent) : [];
  } catch {
    return [];
  }
}

async function writeEvents(events: StoredEvent[]): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const file = await getStoreFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(events.slice(-5000), null, 2), "utf8");
}

function isStoredEvent(value: unknown): value is StoredEvent {
  if (!isRecord(value)) return false;
  return Boolean(asString(value.eventName) && asString(value.sessionId) && asString(value.source));
}

function summarizeEvents(events: StoredEvent[], slugs: string[]): EventSummary[] {
  return slugs.map((slug) => {
    const scoped = events.filter((event) => slugFrom(event) === slug && event.source === "public");
    const lastViewed = scoped
      .filter((event) => event.eventName === "page_opened" || event.eventName === "public_card_opened")
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))[0];
    return {
      slug,
      opens: scoped.filter((event) => event.eventName === "page_opened" || event.eventName === "public_card_opened").length,
      effectiveViews: scoped.filter((event) => event.eventName === "effective_viewed" || event.eventName === "public_card_effective_viewed").length,
      contactClicks: scoped.filter((event) => event.eventName === "contact_clicked").length,
      lastViewedAt: lastViewed?.createdAt,
    };
  });
}

export async function GET(request: Request) {
  const authFailure = checkApiKey(request);
  if (authFailure) return authFailure;

  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 20);
  const summaries = summarizeEvents(await readEvents(), slugs);
  return NextResponse.json({ summaries });
}

export async function POST(request: Request) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as {
      eventName?: string;
      sessionId?: string;
      source?: string;
      props?: Record<string, unknown>;
    };
    if (!body.eventName || !body.sessionId || !body.source) {
      return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 });
    }
    return await withEventsLock(async () => {
      const events = await readEvents();
      events.push({
        id: crypto.randomUUID(),
        eventName: body.eventName!,
        sessionId: body.sessionId!,
        source: body.source!,
        props: isRecord(body.props) ? body.props : {},
        createdAt: new Date().toISOString(),
      });
      await writeEvents(events);
      return NextResponse.json({ ok: true });
    });
  } catch {
    return NextResponse.json({ error: "EVENT_WRITE_FAILED" }, { status: 400 });
  }
}
