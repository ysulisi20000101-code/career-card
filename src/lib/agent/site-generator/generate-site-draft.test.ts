import { describe, expect, it } from "vitest";
import { mockResumeData } from "@/lib/mock-data";
import { generateCareerSiteDraft } from "./generate-site-draft";
import { validateCareerSiteDraft } from "./validate-site-draft";

describe("generateCareerSiteDraft", () => {
  it("generates a complete site draft from resume data", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-04-29T00:00:00.000Z"),
    });

    expect(draft.status).toMatch(/ready|needs_review/);
    expect(draft.hero.title).toContain(mockResumeData.profile.name);
    expect(draft.positioning.targetRole.length).toBeGreaterThan(0);
    expect(draft.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["positioning", "proof", "experience", "contact"]),
    );
    expect(draft.experienceBlocks.length).toBeGreaterThan(0);
    expect(draft.experienceBlocks[0].sourceTimelineId).toBe(mockResumeData.timeline[0].id);
    expect(validateCareerSiteDraft(draft).filter((issue) => !issue.startsWith("Publish blockers"))).toEqual([]);
  });

  it("selects a technical builder style when the instruction asks for AI Agent emphasis", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      instruction: "更像 AI Agent 产品经理",
      now: new Date("2026-04-29T00:00:00.000Z"),
    });

    expect(draft.style.preset).toBe("technical-builder");
  });
});
