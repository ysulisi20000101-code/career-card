import { describe, expect, it } from "vitest";
import { isPresentationDraft } from "./route";

function draftWithSlides(count: number) {
  return {
    id: "draft",
    schemaVersion: 1,
    slides: Array.from({ length: count }, (_, index) => ({ id: `s-${index}`, kind: "hero" })),
  };
}

describe("interview-presentation route validation", () => {
  it("accepts modular interview-space self-story drafts", () => {
    expect(isPresentationDraft(draftWithSlides(15))).toBe(true);
  });

  it("rejects unexpectedly large draft payloads", () => {
    expect(isPresentationDraft(draftWithSlides(25))).toBe(false);
  });
});
