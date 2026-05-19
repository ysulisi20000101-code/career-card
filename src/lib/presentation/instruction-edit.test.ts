import { describe, expect, it } from "vitest";
import type { PresentationDraft } from "./types";
import { applyPresentationInstruction } from "./instruction-edit";

function draftWithSlides(count: number): PresentationDraft {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "draft-1",
    schemaVersion: 1,
    sourceResumeRevision: "resume",
    targetRole: "AI 产品经理",
    template: "agent-product-arc",
    slides: Array.from({ length: count }, (_, index) => ({
      id: `slide-${index}`,
      kind: index === 0 ? "hero" : "impact",
      title: index === 0 ? "AI Agent 产品故事" : `成果 ${index}`,
      body: "AI Agent 工作流将自动化覆盖率从 20% 提升到 70%，ROI 提升 18%。",
      bullets: ["流程自动化", "数据指标"],
      sourceRefs: [{ type: "profile" }],
    })),
    overlays: [],
    themeId: "dark-story",
    createdAt: now,
    updatedAt: now,
  };
}

describe("applyPresentationInstruction", () => {
  it("compresses a draft into a six-page visible version", () => {
    const result = applyPresentationInstruction(draftWithSlides(10), "压缩到 6 页");

    expect(result.draft.id).not.toBe("draft-1");
    expect(result.draft.slides.filter((slide) => !slide.hidden)).toHaveLength(6);
    expect(result.summary).toContain("6");
  });

  it("treats unsupported section requests as generic wording tweaks", () => {
    const result = applyPresentationInstruction(draftWithSlides(8), "加入目标公司分析页");

    expect(result.draft.id).not.toBe("draft-1");
  });

  it("turns AI Agent prompt into visible slide changes", () => {
    const result = applyPresentationInstruction(draftWithSlides(8), "突出 AI Agent 能力");

    expect(result.draft.slides[0]?.featurePills?.some((pill) => pill.label === "AI Agent")).toBe(true);
    expect(result.draft.slides[0]?.speakerNotes).toContain("AI / Agent");
  });

  it("applies page-specific review instructions only to the requested slide", () => {
    const result = applyPresentationInstruction(draftWithSlides(8), "只改第 3 页，让它更像真实项目复盘；不要新增事实");

    expect(result.draft.slides[0]?.summaryLine).toBeUndefined();
    expect(result.draft.slides[2]?.summaryLine).toContain("真实项目复盘");
    expect(result.draft.slides[2]?.speakerNotes).toContain("问题是什么");
    expect(result.changes?.items.some((item) => item.slideId === "slide-2")).toBe(true);
  });

  it("adds an eight-minute talk track without hiding slides", () => {
    const result = applyPresentationInstruction(draftWithSlides(9), "调整成 8 分钟讲法");

    expect(result.draft.slides.filter((slide) => !slide.hidden)).toHaveLength(9);
    expect(result.draft.slides.some((slide) => slide.speakerNotes?.includes("8 分钟讲法"))).toBe(true);
  });
});
