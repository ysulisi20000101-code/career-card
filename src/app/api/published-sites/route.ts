import { NextResponse } from "next/server";
import { normalizeSlug } from "@/lib/share/published-site-repository";
import { buildPublishSnapshot } from "@/lib/share/snapshot";
import { getSubscription, requireSessionUser } from "@/lib/server/auth";
import { createCareerCard, createPublishedSite, listCareerCards, updateCareerCard } from "@/lib/server/commercial-repository";
import { canUseFormalPublish } from "@/lib/commercial/plans";
import type { ResumeData } from "@/types";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as { slug?: string; data?: unknown; cardId?: string; title?: string };
    const slug = normalizeSlug(body.slug ?? "");
    const data = body.data ? buildPublishSnapshot(body.data as ResumeData) : null;
    if (!slug || !data) {
      return NextResponse.json({ error: "INVALID_PUBLISH_PAYLOAD" }, { status: 400 });
    }

    const subscription = await getSubscription(user.id);
    const cards = await listCareerCards(user.id);
    const publishedCount = cards.filter((card) => card.status === "published").length;
    if (!canUseFormalPublish(subscription, publishedCount)) {
      return NextResponse.json({ error: "PUBLISH_QUOTA_EXCEEDED" }, { status: 402 });
    }

    const card = body.cardId
      ? undefined
      : await createCareerCard({
          userId: user.id,
          title: body.title || data.profile.name || slug,
          data,
        });
    const site = await createPublishedSite({
      userId: user.id,
      cardId: body.cardId ?? card!.id,
      slug,
      snapshot: data,
    });
    await updateCareerCard({
      userId: user.id,
      cardId: site.cardId,
      status: "published",
      data,
    });

    return NextResponse.json({ site });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PUBLISH_FAILED";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "SLUG_TAKEN" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
