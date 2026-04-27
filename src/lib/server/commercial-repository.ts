import type {
  AiSuggestion,
  CareerCard,
  ResumeSource,
  ShareEvent,
  PublishedSite,
} from "@/types/commercial";
import type { ResumeData } from "@/types";
import { createId, nowIso, readJsonStore, writeJsonStore } from "@/lib/server/json-store";
import { sanitizeResumeData } from "@/lib/share/validation";

type ResumeSourceStore = Record<string, ResumeSource>;
type CareerCardStore = Record<string, CareerCard>;
type PublishedSiteStore = Record<string, PublishedSite>;
type AiSuggestionStore = Record<string, AiSuggestion>;
type ShareEventStore = Record<string, ShareEvent>;

export async function createResumeSource(input: {
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  textLength: number;
  parseStatus: ResumeSource["parseStatus"];
  parseError?: string;
}): Promise<ResumeSource> {
  const store = await readJsonStore<ResumeSourceStore>("resume-sources.json", {});
  const now = nowIso();
  const source: ResumeSource = {
    id: createId("src"),
    createdAt: now,
    ...input,
  };
  store[source.id] = source;
  await writeJsonStore("resume-sources.json", store);
  return source;
}

export async function listCareerCards(userId: string): Promise<CareerCard[]> {
  const store = await readJsonStore<CareerCardStore>("career-cards.json", {});
  return Object.values(store)
    .filter((card) => card.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createCareerCard(input: {
  userId: string;
  title: string;
  data: ResumeData;
}): Promise<CareerCard> {
  const sanitized = sanitizeResumeData(input.data);
  if (!sanitized) throw new Error("INVALID_CARD_DATA");
  const store = await readJsonStore<CareerCardStore>("career-cards.json", {});
  const now = nowIso();
  const card: CareerCard = {
    id: createId("card"),
    userId: input.userId,
    title: input.title || sanitized.profile.name || "未命名职业名片",
    status: "draft",
    data: sanitized,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  store[card.id] = card;
  await writeJsonStore("career-cards.json", store);
  return card;
}

export async function updateCareerCard(input: {
  userId: string;
  cardId: string;
  title?: string;
  data?: ResumeData;
  status?: CareerCard["status"];
}): Promise<CareerCard> {
  const store = await readJsonStore<CareerCardStore>("career-cards.json", {});
  const current = store[input.cardId];
  if (!current || current.userId !== input.userId) throw new Error("CARD_NOT_FOUND");
  const sanitized = input.data ? sanitizeResumeData(input.data) : undefined;
  if (input.data && !sanitized) throw new Error("INVALID_CARD_DATA");
  const next: CareerCard = {
    ...current,
    title: input.title ?? current.title,
    data: sanitized ?? current.data,
    status: input.status ?? current.status,
    version: current.version + 1,
    updatedAt: nowIso(),
  };
  store[next.id] = next;
  await writeJsonStore("career-cards.json", store);
  return next;
}

export async function createPublishedSite(input: {
  userId: string;
  cardId: string;
  slug: string;
  snapshot: ResumeData;
}): Promise<PublishedSite> {
  const sanitized = sanitizeResumeData(input.snapshot);
  if (!sanitized) throw new Error("INVALID_SITE_DATA");
  const store = await readJsonStore<PublishedSiteStore>("published-sites-v2.json", {});
  const now = nowIso();
  const existingSlug = Object.values(store).find(
    (site) => site.slug === input.slug && !site.revokedAt && site.userId !== input.userId,
  );
  if (existingSlug) throw new Error("SLUG_TAKEN");
  const site: PublishedSite = {
    id: createId("site"),
    userId: input.userId,
    cardId: input.cardId,
    slug: input.slug,
    version: 1,
    publishedAt: now,
    snapshot: sanitized,
  };
  store[site.id] = site;
  await writeJsonStore("published-sites-v2.json", store);
  return site;
}

export async function findPublishedSiteBySlug(slug: string): Promise<PublishedSite | null> {
  const store = await readJsonStore<PublishedSiteStore>("published-sites-v2.json", {});
  return Object.values(store).find((site) => site.slug === slug && !site.revokedAt) ?? null;
}

export async function createAiSuggestion(input: {
  userId: string;
  cardId: string;
  type: AiSuggestion["type"];
  sourceVersion: number;
  payload: unknown;
}): Promise<AiSuggestion> {
  const store = await readJsonStore<AiSuggestionStore>("ai-suggestions.json", {});
  const now = nowIso();
  const suggestion: AiSuggestion = {
    id: createId("sug"),
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  store[suggestion.id] = suggestion;
  await writeJsonStore("ai-suggestions.json", store);
  return suggestion;
}

export async function createShareEvent(input: Omit<ShareEvent, "id" | "createdAt">): Promise<ShareEvent> {
  const store = await readJsonStore<ShareEventStore>("share-events.json", {});
  const event: ShareEvent = {
    id: createId("evt"),
    createdAt: nowIso(),
    ...input,
  };
  store[event.id] = event;
  await writeJsonStore("share-events.json", store);
  return event;
}

export interface ShareEventSummary {
  slug: string;
  opens: number;
  effectiveViews: number;
  lastViewedAt?: string;
}

export async function listShareEventSummaries(slugs: string[]): Promise<ShareEventSummary[]> {
  const wanted = new Set(slugs.filter(Boolean));
  if (wanted.size === 0) return [];
  const store = await readJsonStore<ShareEventStore>("share-events.json", {});
  const summaries = new Map<string, ShareEventSummary>();

  for (const event of Object.values(store)) {
    const slug = typeof event.props.slug === "string" ? event.props.slug : "";
    if (!wanted.has(slug)) continue;
    const current =
      summaries.get(slug) ??
      {
        slug,
        opens: 0,
        effectiveViews: 0,
        lastViewedAt: undefined,
      };
    if (event.eventName === "public_card_opened") current.opens += 1;
    if (event.eventName === "public_card_effective_viewed") current.effectiveViews += 1;
    if (!current.lastViewedAt || event.createdAt > current.lastViewedAt) {
      current.lastViewedAt = event.createdAt;
    }
    summaries.set(slug, current);
  }

  return Array.from(wanted).map(
    (slug) =>
      summaries.get(slug) ?? {
        slug,
        opens: 0,
        effectiveViews: 0,
      },
  );
}
