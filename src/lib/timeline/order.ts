import type { TimelineNode } from "@/types";

const FALLBACK_TIMESTAMP = -8640000000000000;

function getTimestamp(value: string): number {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? FALLBACK_TIMESTAMP : ts;
}

export function getOrderedTimeline(nodes: TimelineNode[]): TimelineNode[] {
  return [...nodes].sort((a, b) => {
    const diff = getTimestamp(b.startDate) - getTimestamp(a.startDate);
    if (diff !== 0) return diff;

    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;

    return a.id.localeCompare(b.id);
  });
}

export function getSafeTimelineIndex(
  timeline: TimelineNode[],
  activeTimelineId: string | null,
): number {
  if (timeline.length === 0) return -1;
  if (!activeTimelineId) return 0;
  const index = timeline.findIndex((node) => node.id === activeTimelineId);
  return index === -1 ? 0 : index;
}
