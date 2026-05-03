import { describe, expect, it } from "vitest";
import { mockResumeData } from "@/lib/mock-data";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import { materializeCareerSiteDraft } from "@/lib/agent/site-generator/draft-to-resume";

describe("draft materialization for CareerNarrativeSite", () => {
  it("materializes a generated draft into valid ResumeData", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-05-02T00:00:00.000Z"),
    });

    const rendered = materializeCareerSiteDraft(mockResumeData, draft, "warm-business");

    expect(rendered.profile.name).toBe("张三");
    expect(rendered.profile.title).toBeTruthy();
    expect(rendered.profile.summary).toBeTruthy();
    expect(rendered.timeline.length).toBeGreaterThan(0);
    expect(rendered.skills.length).toBeGreaterThan(0);
  });

  it("preserves original timeline data structure after materialization", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-05-02T00:00:00.000Z"),
    });

    const rendered = materializeCareerSiteDraft(mockResumeData, draft, "warm-business");

    for (const node of rendered.timeline) {
      expect(node.id).toBeTruthy();
      expect(node.company).toBeTruthy();
      expect(node.position).toBeTruthy();
      expect(typeof node.order).toBe("number");
    }
  });

  it("applies theme-specific styling when materializing", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-05-02T00:00:00.000Z"),
    });

    const warmRendered = materializeCareerSiteDraft(mockResumeData, draft, "warm-business");
    const techRendered = materializeCareerSiteDraft(mockResumeData, draft, "technical-builder");

    expect(warmRendered.profile.name).toBe("张三");
    expect(techRendered.profile.name).toBe("张三");
    expect(warmRendered.siteThemeId).toBe("warm-business");
    expect(techRendered.siteThemeId).toBe("technical-builder");
  });

  it("materializes draft with featured experience reordering", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-05-02T00:00:00.000Z"),
    });

    const rendered = materializeCareerSiteDraft(mockResumeData, draft, "warm-business");

    expect(rendered.timeline).toBeDefined();
    expect(Array.isArray(rendered.timeline)).toBe(true);
  });
});
