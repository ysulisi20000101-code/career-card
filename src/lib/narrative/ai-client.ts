import type {
  AiPromotionSuggestion,
  AiStorySuggestion,
} from "@/lib/ai/minimax-provider";
import type { TimelineNode } from "@/types";

export type AiStoryResult = AiStorySuggestion;
export type AiPromotionResult = AiPromotionSuggestion;

export async function organizeTimelineStoryWithAI(
  node: TimelineNode,
): Promise<AiStoryResult> {
  const response = await fetch("/api/narrative/story", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ node }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "AI 整理失败，请稍后重试");
  }
  return payload.suggestion as AiStoryResult;
}

export async function extractPromotionStagesWithAI(
  node: TimelineNode,
): Promise<AiPromotionResult> {
  const response = await fetch("/api/narrative/promotion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ node }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "AI 推断晋升阶段失败，请稍后重试");
  }
  return payload.suggestion as AiPromotionResult;
}
