import { NextResponse } from "next/server";
import { createLocalPublishedSiteRepository, normalizeSlug } from "@/lib/share/published-site-repository";
import { checkApiKey } from "@/lib/server/auth";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeSlug(rawSlug);
  if (!slug) return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });

  const repo = createLocalPublishedSiteRepository();
  const site = await repo.find(slug);
  if (!site) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ site });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = checkApiKey(_request);
  if (authError) return authError;

  const { slug: rawSlug } = await context.params;
  const slug = normalizeSlug(rawSlug);
  if (!slug) return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });

  const repo = createLocalPublishedSiteRepository();
  const site = await repo.find(slug);
  if (!site) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await repo.remove(slug);
  return NextResponse.json({ ok: true });
}
