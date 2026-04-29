import type { CareerSiteDraft } from "./types";

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateCareerSiteDraft(draft: CareerSiteDraft): string[] {
  const issues: string[] = [];

  if (!hasText(draft.hero.title)) issues.push("Hero title is missing.");
  if (!hasText(draft.positioning.targetRole)) issues.push("Target role is missing.");
  if (draft.sections.length < 3) issues.push("Site needs at least three sections.");
  if (draft.experienceBlocks.length === 0) issues.push("No featured experience block was generated.");
  if (draft.review.publishBlockers.length > 0) {
    issues.push(`Publish blockers remain: ${draft.review.publishBlockers.join(", ")}`);
  }

  const unconfirmedRisk = draft.sections
    .flatMap((section) => section.bullets)
    .some((bullet) => /第一|唯一|顶级|最佳|100%/.test(bullet));
  if (unconfirmedRisk) issues.push("Some claims may need manual evidence review.");

  return issues;
}

export function draftNeedsReview(draft: CareerSiteDraft): boolean {
  return draft.status === "needs_review" || validateCareerSiteDraft(draft).length > 0;
}
