import { NextResponse } from "next/server";
import { normalizeSlug, createLocalPublishedSiteRepository } from "@/lib/share/published-site-repository";
import { buildPublishedSnapshotV2 } from "@/lib/share/snapshot";
import { checkApiKey } from "@/lib/server/auth";
import type { ResumeData } from "@/types";

export async function POST(request: Request) {
  const authError = checkApiKey(request);
  if (authError) return authError;

  try {
    if (request.headers.get("content-length")) {
      const length = Number(request.headers.get("content-length"));
      if (length > 50_000) {
        return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
      }
    }
    const body = (await request.json()) as { slug?: string; data?: unknown };
    const slug = normalizeSlug(body.slug ?? "");
    const snapshot = body.data ? buildPublishedSnapshotV2({ slug, data: body.data as ResumeData }) : null;
    if (!slug || !snapshot) {
      return NextResponse.json({ error: "INVALID_PUBLISH_PAYLOAD" }, { status: 400 });
    }

    const repo = createLocalPublishedSiteRepository();
    const site = await repo.save(snapshot);

    return NextResponse.json({ site });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PUBLISH_FAILED";
    const status = message === "SLUG_TAKEN" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
