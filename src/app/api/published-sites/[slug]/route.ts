import { NextResponse } from "next/server";
import { createLocalPublishedSiteRepository, normalizeSlug } from "@/lib/share/published-site-repository";
import { findPublishedSiteBySlug } from "@/lib/server/commercial-repository";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = normalizeSlug(rawSlug);
  if (!slug) return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });

  const commercialSite = await findPublishedSiteBySlug(slug);
  if (commercialSite) {
    return NextResponse.json({
      site: {
        slug: commercialSite.slug,
        version: commercialSite.version,
        publishedAt: commercialSite.publishedAt,
        data: commercialSite.snapshot,
        id: commercialSite.id,
        cardId: commercialSite.cardId,
      },
    });
  }

  const site = await createLocalPublishedSiteRepository().find(slug);
  if (!site) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ site });
}
