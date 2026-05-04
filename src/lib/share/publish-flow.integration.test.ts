import { describe, expect, it } from "vitest";
import { mockResumeData } from "@/lib/mock-data";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import { applyDraftChat } from "@/lib/agent/conversation/apply-draft-chat";
import { buildPublishedSnapshotV2 } from "@/lib/share/snapshot";
import { normalizePublishedSnapshot, getSnapshotResumeData } from "@/lib/share/published-snapshot";

describe("publish flow integration", () => {
  it("generates draft, builds V2 snapshot, and normalizes it round-trip", () => {
    const now = new Date("2026-05-02T00:00:00.000Z");
    const draft = generateCareerSiteDraft(mockResumeData, { now });
    expect(draft.hero.title).toBeTruthy();
    expect(draft.sections.length).toBeGreaterThan(0);

    const snapshot = buildPublishedSnapshotV2({
      slug: "zhangsan",
      data: mockResumeData,
      now,
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot!.schemaVersion).toBe(2);
    expect(snapshot!.slug).toBe("zhangsan");
    expect(snapshot!.resumeData.profile.name).toBe("张三");

    const normalized = normalizePublishedSnapshot(snapshot, "zhangsan");
    expect(normalized).not.toBeNull();
    expect(normalized!.schemaVersion).toBe(2);

    const resumeData = getSnapshotResumeData(normalized!);
    expect(resumeData.profile.name).toBe("张三");
    expect(resumeData.timeline.length).toBeGreaterThan(0);
  });

  it("builds V2 snapshot without publicNarrative or renderOptions fields", () => {
    const snapshot = buildPublishedSnapshotV2({
      slug: "test-user",
      data: mockResumeData,
    });
    expect(snapshot).not.toBeNull();
    // V2 snapshots should only contain core metadata + resumeData
    const keys = Object.keys(snapshot!);
    expect(keys).toContain("schemaVersion");
    expect(keys).toContain("slug");
    expect(keys).toContain("version");
    expect(keys).toContain("publishedAt");
    expect(keys).toContain("resumeData");
    expect(keys).not.toContain("publicNarrative");
    expect(keys).not.toContain("renderOptions");
  });

  it("normalizes V1 snapshots for backward compatibility", () => {
    const v1Snapshot = {
      schemaVersion: 1,
      slug: "legacy-user",
      version: 1,
      publishedAt: "2025-01-01T00:00:00.000Z",
      data: mockResumeData,
    };
    const normalized = normalizePublishedSnapshot(v1Snapshot, "legacy-user");
    expect(normalized).not.toBeNull();
    expect(normalized!.schemaVersion).toBe(1);

    const resumeData = getSnapshotResumeData(normalized!);
    expect(resumeData.profile.name).toBe("张三");
  });

  it("refines draft via rules engine and materializes valid data", () => {
    const draft = generateCareerSiteDraft(mockResumeData, {
      now: new Date("2026-05-02T00:00:00.000Z"),
    });

    const result = applyDraftChat({
      draft,
      resumeData: mockResumeData,
      message: "更像 AI Agent 产品经理，风格技术化",
      now: new Date("2026-05-02T01:00:00.000Z"),
    });

    expect(result.draft.positioning.targetRole).toContain("AI Agent");
    expect(result.draft.style.preset).toBe("technical-builder");
    expect(result.changes.length).toBeGreaterThanOrEqual(2);
    expect(result.draft.versionHistory.length).toBeGreaterThan(
      draft.versionHistory.length,
    );
  });
});
