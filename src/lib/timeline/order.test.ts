import { describe, expect, it } from "vitest";
import type { TimelineNode } from "@/types";
import { getOrderedTimeline, getSafeTimelineIndex } from "./order";

function node(partial: Partial<TimelineNode>): TimelineNode {
  return {
    id: partial.id ?? crypto.randomUUID(),
    company: partial.company ?? "",
    position: partial.position ?? "",
    startDate: partial.startDate ?? "",
    endDate: partial.endDate ?? "",
    description: partial.description ?? "",
    highlights: partial.highlights ?? [],
    projects: [],
    skills: partial.skills ?? [],
    order: partial.order ?? 0,
  };
}

describe("timeline order", () => {
  it("keeps presentation navigation on a single ordered timeline", () => {
    const unordered = [
      node({ id: "early", startDate: "2020-01", order: 3 }),
      node({ id: "latest", startDate: "2024-03", order: 2 }),
      node({ id: "same-date-first", startDate: "2023-01", order: 1 }),
      node({ id: "same-date-second", startDate: "2023-01", order: 2 }),
    ];

    const ordered = getOrderedTimeline(unordered);

    expect(ordered.map((item) => item.id)).toEqual([
      "latest",
      "same-date-first",
      "same-date-second",
      "early",
    ]);
    expect(getSafeTimelineIndex(ordered, "same-date-second")).toBe(2);
  });

  it("falls back to the first ordered node when the active id is missing", () => {
    const ordered = getOrderedTimeline([
      node({ id: "old", startDate: "2020-01" }),
      node({ id: "new", startDate: "2024-01" }),
    ]);

    expect(getSafeTimelineIndex(ordered, null)).toBe(0);
    expect(getSafeTimelineIndex(ordered, "missing")).toBe(0);
  });
});
