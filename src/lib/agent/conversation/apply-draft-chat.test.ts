import { describe, expect, it } from "vitest";
import { mockResumeData } from "@/lib/mock-data";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import { applyDraftChat } from "./apply-draft-chat";

describe("applyDraftChat", () => {
  it("updates style and positioning for AI Agent requests", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-04-29T00:00:00.000Z"),
    });

    const result = applyDraftChat({
      draft,
      resumeData: mockResumeData,
      message: "风格更科技感，定位更像 AI Agent 产品经理",
      now: new Date("2026-04-29T01:00:00.000Z"),
    });

    expect(result.draft.style.preset).toBe("technical-builder");
    expect(result.draft.positioning.targetRole).toContain("AI Agent");
    expect(result.draft.hero.subtitle).toContain("Agent");
    expect(result.changes.length).toBeGreaterThanOrEqual(2);
    expect(result.draft.versionHistory).toHaveLength(draft.versionHistory.length + 1);
  });

  it("tightens vague claims without inventing new facts", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-04-29T00:00:00.000Z"),
    });

    const result = applyDraftChat({
      draft,
      resumeData: mockResumeData,
      message: "这段经历太虚，改得更实在一点",
      now: new Date("2026-04-29T01:00:00.000Z"),
    });

    expect(result.draft.style.tone).toContain("证据");
    expect(result.draft.review.riskyClaims).toContain("请复核所有没有简历来源的强结论表达。");
  });

  it("asks a follow-up when the request is too vague", () => {
    const result = applyDraftChat({
      resumeData: mockResumeData,
      message: "帮我再好一点",
      now: new Date("2026-04-29T01:00:00.000Z"),
    });

    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.changes[0]).toContain("不够具体");
  });
});
