import type { CareerSiteDraft } from "./types";
import { hasText } from "@/lib/utils-helpers";

export function validateCareerSiteDraft(draft: CareerSiteDraft): string[] {
  const issues: string[] = [];

  if (!hasText(draft.hero.title)) issues.push("首屏标题缺失。");
  if (!hasText(draft.positioning.targetRole)) issues.push("目标岗位缺失。");
  if (draft.sections.length < 3) issues.push("网站至少需要三个有效区块。");
  if (draft.experienceBlocks.length === 0) issues.push("还没有生成代表经历区块。");
  if (draft.review.publishBlockers.length > 0) {
    issues.push(`仍有发布阻断项：${draft.review.publishBlockers.join("、")}。`);
  }

  const unconfirmedRisk = draft.sections
    .flatMap((section) => section.bullets)
    .some((bullet) => /第一|唯一|顶级|最佳|100%/.test(bullet));
  if (unconfirmedRisk) issues.push("存在可能需要人工确认的强结论表达。");

  return issues;
}

export function draftNeedsReview(draft: CareerSiteDraft): boolean {
  return draft.status === "needs_review" || validateCareerSiteDraft(draft).length > 0;
}
