import { describe, expect, it } from "vitest";
import { mockResumeData } from "@/lib/mock-data";
import { generateCareerSiteDraft } from "./generate-site-draft";

describe("agent-first v1 quality gate", () => {
  it("does not ship the engineering-first placeholder copy used by the prototype", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-04-29T00:00:00.000Z"),
    });
    const text = JSON.stringify(draft);

    expect(text).not.toContain("Agent-generated");
    expect(text).not.toContain("Career moments the site will lead with");
    expect(text).not.toContain("generated blocks");
    expect(text).not.toContain("Target role to be confirmed");
    expect(text).not.toContain("Add one concrete result");
  });

  it("keeps the first draft publish-aware instead of forcing a polished but unsafe site", () => {
    const data = structuredClone(mockResumeData);
    data.profile.summary = "";
    data.roleUnderstanding.oneLineInterpretation = "";
    data.timeline = data.timeline.map((node) => ({
      ...node,
      highlights: [],
      evidenceResult: undefined,
      storyOutcome: undefined,
    }));

    const draft = generateCareerSiteDraft(data, {
      now: new Date("2026-04-29T00:00:00.000Z"),
    });

    expect(draft.status).toBe("needs_review");
    expect(draft.review.missingFacts).toContain("一句话职业定位");
    expect(draft.versionHistory[0].summary).toContain("建议先补充");
  });
});
