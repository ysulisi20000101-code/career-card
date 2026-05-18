import type { ResumeData, SkillProfile, TimelineNode } from "@/types";
import type { CareerSiteDraft, CareerSiteExperienceBlock, CareerSiteSection } from "./types";
import { compact, unique } from "@/lib/utils-helpers";

function sectionByKind(draft: CareerSiteDraft, kind: CareerSiteSection["kind"]): CareerSiteSection | undefined {
  return draft.sections.find((section) => section.kind === kind);
}

function blockFor(blocks: CareerSiteExperienceBlock[], timelineId: string): CareerSiteExperienceBlock | undefined {
  return blocks.find((block) => block.sourceTimelineId === timelineId);
}

function reorderTimeline(nodes: TimelineNode[], featuredIds: string[]): TimelineNode[] {
  const priority = new Map(featuredIds.map((id, index) => [id, index]));
  return [...nodes].sort((a, b) => {
    const aPriority = priority.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bPriority = priority.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.order - b.order;
  });
}

function materializeSkillProfile(profile: SkillProfile | undefined, strengths: string[]): SkillProfile | undefined {
  if (!profile) return profile;
  return {
    ...profile,
    detectedSkillNames: unique([...strengths, ...profile.detectedSkillNames]),
  };
}

function materializeTimelineNode(
  node: TimelineNode,
  draft: CareerSiteDraft,
  index: number,
): TimelineNode {
  const block = blockFor(draft.experienceBlocks, node.id);
  const proof = sectionByKind(draft, "proof");
  const story = sectionByKind(draft, "story");
  const positioning = sectionByKind(draft, "positioning");
  const blockBullets = block?.bullets ?? [];
  const proofBullets = proof?.sourceTimelineIds.includes(node.id) ? proof.bullets : [];
  const featured = draft.narrative.featuredExperienceIds.includes(node.id);
  const storySource = featured ? draft.narrative.storyArc : story?.body;
  const actionLine = unique(blockBullets).slice(0, 3).join("；");
  const outcomeLine = unique([block?.summary, ...proofBullets, node.evidenceResult, node.storyOutcome])[0];

  return {
    ...node,
    order: index,
    position: block?.title && block.title !== node.company ? node.position : node.position,
    description: compact(block?.summary || node.description || positioning?.body || draft.positioning.oneLinePitch, 260),
    highlights: unique([
      ...blockBullets,
      ...proofBullets,
      ...node.highlights,
    ]).slice(0, 8),
    skills: unique([...draft.positioning.coreStrengths.slice(0, 6), ...node.skills]),
    storyTitle: block?.title || node.storyTitle || `${node.company} · ${node.position}`,
    storyScene: compact(block?.summary || node.storyScene || storySource || "", 220) || undefined,
    storyChallenge: compact(proof?.body || node.storyChallenge || draft.narrative.theme, 180) || undefined,
    storyAction: compact(actionLine || node.storyAction || block?.summary || "", 220) || undefined,
    storyOutcome: compact(outcomeLine || "", 220) || undefined,
    storyReflection: compact(draft.narrative.storyArc || node.storyReflection || "", 240) || undefined,
    evidenceProblem: compact(proof?.title || node.evidenceProblem || "", 140) || undefined,
    evidenceAction: compact(actionLine || node.evidenceAction || "", 180) || undefined,
    evidenceResult: compact(outcomeLine || "", 180) || undefined,
    evidenceProof: compact(unique([...proofBullets, ...blockBullets]).join("；"), 220) || undefined,
    evidenceStrength: featured ? "strong" : node.evidenceStrength,
  };
}

export function materializeCareerSiteDraft(
  data: ResumeData,
  draft: CareerSiteDraft,
  themeId?: string,
): ResumeData {
  const positioning = sectionByKind(draft, "positioning");
  const proof = sectionByKind(draft, "proof");
  const orderedTimeline = reorderTimeline(data.timeline, draft.narrative.featuredExperienceIds).map((node, index) =>
    materializeTimelineNode(node, draft, index),
  );
  const summary = unique([
    draft.hero.subtitle,
    draft.positioning.oneLinePitch,
    positioning?.body,
    draft.narrative.storyArc,
  ]).join(" ");

  return {
    ...data,
    siteThemeId: themeId ?? data.siteThemeId,
    profile: {
      ...data.profile,
      title: draft.positioning.targetRole || data.profile.title,
      summary: compact(summary || data.profile.summary || "", 360) || data.profile.summary,
    },
    timeline: orderedTimeline,
    skillProfile: materializeSkillProfile(data.skillProfile, draft.positioning.coreStrengths),
    roleTemplateId: data.roleTemplateId ?? data.skillProfile?.templateId,
    roleUnderstanding: {
      ...data.roleUnderstanding,
      targetRoleTitle: draft.positioning.targetRole || data.roleUnderstanding.targetRoleTitle,
      oneLineInterpretation: draft.positioning.oneLinePitch || data.roleUnderstanding.oneLineInterpretation,
      priorityProblems:
        data.roleUnderstanding.priorityProblems.length > 0
          ? data.roleUnderstanding.priorityProblems
          : [
              {
                id: "agent-positioning",
                problem: draft.narrative.theme,
                impact: draft.narrative.storyArc,
                evidence: proof?.bullets[0],
              },
            ],
      experienceMappings:
        data.roleUnderstanding.experienceMappings.length > 0
          ? data.roleUnderstanding.experienceMappings
          : draft.narrative.proofPoints.slice(0, 4).map((point, index) => ({
              id: `agent-proof-${index + 1}`,
              requirement: draft.positioning.targetRole,
              myExperience: draft.narrative.featuredExperienceIds[index] ?? "",
              outcomeEvidence: point,
            })),
    },
  };
}
