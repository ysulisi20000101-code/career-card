"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CareerNarrativeSite } from "@/components/narrative/career-narrative-site";
import { loadPublishedResume } from "@/lib/share/storage";
import { resolveSharedResume } from "@/lib/share/strategy";
import { sanitizeResumeData } from "@/lib/share/validation";
import { trackEvent } from "@/lib/events/client";
import type { ResumeData } from "@/types";

export function ShareView() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const effectiveTrackedRef = useRef(false);
  const [hydration, setHydration] = useState<{ hydrated: boolean; data: ResumeData | null }>({
    hydrated: false,
    data: null,
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
        trackEvent("public_card_opened", "public", { slug, channel: "portable" });
        if (!cancelled) setHydration({ hydrated: true, data: hashOrLocalData });
        return;
      }

      try {
        const response = await fetch(`/api/published-sites/${slug}`, { cache: "no-store" });
        if (!response.ok) throw new Error("not found");
        const payload = (await response.json()) as { site?: { data?: unknown } };
        const data = sanitizeResumeData(payload.site?.data);
        if (data) trackEvent("public_card_opened", "public", { slug, channel: window.location.hash ? "portable" : "link" });
        if (!cancelled) setHydration({ hydrated: true, data });
      } catch {
        const localData = resolveSharedResume({
          hash: "",
          slug,
          loadFromStorage: loadPublishedResume,
          includeStorage: true,
        });
        if (localData) {
          trackEvent("public_card_opened", "public", { slug, channel: "local" });
          if (!cancelled) setHydration({ hydrated: true, data: localData });
          return;
        }
        if (!cancelled) setHydration({ hydrated: true, data: null });
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!hydration.data || effectiveTrackedRef.current) return;
    let dwellPassed = false;

    function getScrollDepth() {
      const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      return Math.round((window.scrollY / scrollable) * 100);
    }

    function sendEffectiveView(trigger: string) {
      if (effectiveTrackedRef.current) return;
      effectiveTrackedRef.current = true;
      trackEvent("public_card_effective_viewed", "public", {
        slug,
        trigger,
        scroll_depth: getScrollDepth(),
      });
    }

    const timer = window.setTimeout(() => {
      dwellPassed = true;
      if (getScrollDepth() >= 35) sendEffectiveView("dwell_and_scroll");
    }, 12000);

    function handleScroll() {
      if (dwellPassed && getScrollDepth() >= 35) sendEffectiveView("scroll_after_dwell");
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hydration.data, slug]);

  const { hydrated, data } = hydration;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        正在加载候选人职业档案...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-6 text-center">
        <div className="mb-4 h-12 w-12 rounded-2xl border border-zinc-200 bg-zinc-50" />
        <h1 className="text-xl font-semibold text-zinc-950">没有找到候选人职业档案</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          链接可能尚未发布、已经失效，或访问的不是完整公开链接。
        </p>
      </div>
    );
  }

  return <CareerNarrativeSite data={data} />;
}
