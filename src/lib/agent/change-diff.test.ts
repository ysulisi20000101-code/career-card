import { describe, expect, it } from "vitest";
import { diffCareerSiteDraft, diffPresentationDraft } from "./change-diff";
import type { CareerSiteDraft } from "@/lib/agent/site-generator/types";
import type { PresentationDraft } from "@/lib/presentation/types";

const basePresentation: PresentationDraft = {
  id: "p1",
  schemaVersion: 1,
  sourceResumeRevision: "r1",
  targetRole: "产品经理",
  template: "agent-product-arc",
  slides: [
    {
      id: "s1",
      kind: "hero",
      title: "旧标题",
      body: "旧正文",
      bullets: ["旧要点"],
      sourceRefs: [],
    },
  ],
  overlays: [],
  themeId: "light-story",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const baseSite: CareerSiteDraft = {
  id: "site-1",
  sourceResumeId: "resume-1",
  provider: "rules",
  status: "ready",
  positioning: {
    targetRole: "产品经理",
    headline: "张三｜产品经理",
    oneLinePitch: "旧定位",
    audience: "招聘方",
    coreStrengths: ["产品"],
  },
  narrative: {
    theme: "旧主题",
    storyArc: "旧主线",
    featuredExperienceIds: [],
    proofPoints: [],
  },
  hero: {
    eyebrow: "旧",
    title: "旧首页标题",
    subtitle: "旧副标题",
    primaryCta: "联系",
    secondaryCta: "了解",
  },
  sections: [
    {
      id: "positioning",
      kind: "positioning",
      title: "定位",
      body: "旧正文",
      bullets: ["旧要点"],
      sourceTimelineIds: [],
      confidence: 0.8,
    },
  ],
  experienceBlocks: [],
  style: {
    preset: "product-led",
    tone: "旧语气",
    density: "balanced",
    colorTheme: "blue",
    layoutStyle: "single",
    typography: "sans",
  },
  review: {
    confidence: 0.8,
    missingFacts: [],
    riskyClaims: [],
    publishBlockers: [],
  },
  versionHistory: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("agent change diff", () => {
  it("summarizes presentation slide changes", () => {
    const after: PresentationDraft = {
      ...basePresentation,
      slides: [{ ...basePresentation.slides[0]!, title: "新标题", bullets: ["新要点"], hidden: true }],
    };

    const diff = diffPresentationDraft(basePresentation, after, "更新 PPT");

    expect(diff.summary).toBe("更新 PPT");
    expect(diff.items.map((item) => item.label)).toContain("1. 新标题 标题");
    expect(diff.items.some((item) => item.label.includes("可见性"))).toBe(true);
  });

  it("summarizes career site copy and style changes", () => {
    const after: CareerSiteDraft = {
      ...baseSite,
      hero: { ...baseSite.hero, title: "新首页标题" },
      style: { ...baseSite.style, tone: "新语气" },
      positioning: { ...baseSite.positioning, oneLinePitch: "新定位" },
    };

    const diff = diffCareerSiteDraft(baseSite, after, "更新网站");

    expect(diff.items.map((item) => item.label)).toEqual(
      expect.arrayContaining(["首页标题", "一句话定位", "表达语气"]),
    );
  });
});
