import type { TimelineNode, PromotionStage } from "@/types";
import { parseResumeText, type ParseResult } from "./resume-parser";

export interface ParseResultWithAssist extends ParseResult {
  needsLLMAssist: boolean;
}

function mergeLeaderDirectorStages(stages: PromotionStage[]): PromotionStage[] {
  if (stages.length < 2) return stages;
  const merged: PromotionStage[] = [];
  let i = 0;
  while (i < stages.length) {
    const curr = stages[i];
    const next = stages[i + 1];
    // Merge if leader + director pair with same/empty period (no date range between them)
    if (
      next &&
      curr.leadershipType === "dotted" &&
      next.leadershipType === "solid" &&
      (curr.period === next.period || !curr.period || !next.period)
    ) {
      merged.push({
        ...next,
        id: next.id,
        title: `${curr.title} / ${next.title}`,
        responsibility: curr.responsibility || next.responsibility,
        outcome: curr.outcome || next.outcome,
        reflection: next.reflection,
      });
      i += 2;
    } else {
      merged.push(curr);
      i += 1;
    }
  }
  return merged;
}

function fixPromotionStages(timeline: TimelineNode[]): TimelineNode[] {
  return timeline.map((node) => {
    if (!node.promotionStages || node.promotionStages.length < 2) return node;
    const fixed = mergeLeaderDirectorStages(node.promotionStages);
    return fixed.length !== node.promotionStages.length
      ? { ...node, promotionStages: fixed }
      : node;
  });
}

/**
 * Wraps parseResumeText with post-processing:
 * 1. Flags results where regex parser found 0 timeline nodes or 0 skills (needsLLMAssist)
 * 2. Fixes overly aggressive leader/director stage splits
 */
export function parseResumeTextWithAssist(rawText: string, fileName: string): ParseResultWithAssist {
  const result = parseResumeText(rawText, fileName);
  const needsLLMAssist =
    result.data.timeline.length === 0 ||
    (result.data.skillProfile?.coverage.owned ?? 0) === 0;
  const timeline = fixPromotionStages(result.data.timeline);
  return {
    ...result,
    data: { ...result.data, timeline },
    needsLLMAssist,
  };
}
