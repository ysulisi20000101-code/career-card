"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CareerNarrativeSite } from "@/components/narrative/career-narrative-site";
import { loadPublishedResume } from "@/lib/share/storage";
import { resolveSharedResume } from "@/lib/share/strategy";
import { isPublishedSnapshotV2, normalizePublishedSnapshot, type PublishedSnapshotV2 } from "@/lib/share/published-snapshot";
import { sanitizeResumeData } from "@/lib/share/validation";
import { trackEvent } from "@/lib/events/client";
import type { ResumeData } from "@/types";

type ResolvedShare =
  | { kind: "v1"; data: ResumeData }
  | { kind: "v2"; site: PublishedSnapshotV2 };

export function ShareView() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [hydration, setHydration] = useState<{ hydrated: boolean; resolved: ResolvedShare | null }>({
    hydrated: false,
    resolved: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const hashOrLocalData = resolveSharedResume({
        hash: window.location.hash,
        slug,
        loadFromStorage: loadPublishedResume,
      });
      if (hashOrLocalData) {
        trackEvent("page_opened", "public", { slug, channel: "portable" });
        if (!cancelled) setHydration({ hydrated: true, resolved: { kind: "v1", data: hashOrLocalData } });
        return;
      }

      try {
        const response = await fetch(`/api/published-sites/${slug}`, { cache: "no-store" });
        if (!response.ok) throw new Error("not found");
        const payload = (await response.json()) as { site?: unknown };
        const site = normalizePublishedSnapshot(payload.site, slug);
        const data = site && !isPublishedSnapshotV2(site) ? sanitizeResumeData(site.data) : null;
        if (site) trackEvent("page_opened", "public", { slug, channel: window.location.hash ? "portable" : "link", schema_version: site.schemaVersion ?? 1 });
        if (!cancelled) {
          setHydration({
            hydrated: true,
            resolved: site ? (isPublishedSnapshotV2(site) ? { kind: "v2", site } : { kind: "v1", data: data ?? site.data }) : null,
          });
        }
      } catch {
        if (!cancelled) setHydration({ hydrated: true, resolved: null });
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const { hydrated, resolved } = hydration;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        正在加载候选人职业档案...
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-4 h-12 w-12 rounded-xl border border-zinc-200 bg-zinc-50" />
        <h1 className="text-xl font-semibold text-zinc-950">没有找到候选人职业档案</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          链接可能尚未发布、已经失效，或访问的不是完整公开链接。
        </p>
      </div>
    );
  }

  if (resolved.kind === "v2") {
    trackEvent("page_opened", "public", { slug, channel: "link" });
    return <CareerNarrativeSite data={resolved.site.resumeData} />;
  }

  return <CareerNarrativeSite data={resolved.data} />;
}
