import type { ResumeData, SkillNode, TimelineNode } from "@/types";
import { getOrderedTimeline } from "@/lib/timeline/order";
import { getPublishChecks } from "@/lib/share/publish-checks";
import type {
  CareerSiteDraft,
  CareerSiteExperienceBlock,
  CareerSiteSection,
  CareerSiteStyle,
  CareerSiteStylePreset,
  GenerateCareerSiteDraftInput,
} from "./types";

function compact(value: string | undefined, fallback: string, max = 180): string {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim() || fallback;
  return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized;
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.map((item) => item?.trim()).filter(Boolean) as string[]));
}

function periodFor(node: TimelineNode): string {
  return unique([node.startDate, node.endDate]).join(" - ") || "Career experience";
}

function textCorpus(data: ResumeData): string {
  return [
    data.profile.title,
    data.profile.summary,
    data.roleUnderstanding?.targetRoleTitle,
    ...data.timeline.flatMap((node) => [
      node.company,
      node.position,
      node.description,
      node.storyTitle,
      node.storyOutcome,
      ...node.highlights,
      ...node.skills,
    ]),
    ...data.skills.map((skill) => skill.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function detectStylePreset(data: ResumeData, instruction?: string): CareerSiteStylePreset {
  const corpus = `${textCorpus(data)} ${(instruction ?? "").toLowerCase()}`;
  if (/ai|agent|rag|llm|architecture|engineer|技术|架构|研发/.test(corpus)) return "technical-builder";
  if (/product|pm|saas|增长|产品|平台/.test(corpus)) return "product-led";
  if (/ceo|founder|director|vp|leader|负责人|总监|管理/.test(corpus)) return "executive";
  if (/creative|creator|design|brand|内容|创意|设计/.test(corpus)) return "creative";
  return "minimal";
}

function styleForPreset(preset: CareerSiteStylePreset): CareerSiteStyle {
  const styles: Record<CareerSiteStylePreset, CareerSiteStyle> = {
    executive: {
      preset,
      tone: "calm, credible, boardroom-ready",
      density: "balanced",
      colorTheme: "ink, warm white, muted teal",
      layoutStyle: "editorial dossier with strong proof blocks",
      typography: "serif-like display with compact sans body",
    },
    "product-led": {
      preset,
      tone: "structured, outcome-oriented, product-minded",
      density: "balanced",
      colorTheme: "graphite, white, signal blue",
      layoutStyle: "product case-study flow with clear decision points",
      typography: "clean sans with sharp section hierarchy",
    },
    "technical-builder": {
      preset,
      tone: "precise, systems-thinking, evidence-first",
      density: "detailed",
      colorTheme: "charcoal, white, electric cyan",
      layoutStyle: "technical narrative with architecture and proof lanes",
      typography: "compact sans with monospace accents",
    },
    minimal: {
      preset,
      tone: "plain, direct, highly readable",
      density: "focused",
      colorTheme: "black, white, zinc",
      layoutStyle: "single-column portfolio with generous whitespace",
      typography: "quiet sans",
    },
    creative: {
      preset,
      tone: "distinctive, human, story-forward",
      density: "balanced",
      colorTheme: "ink, white, coral",
      layoutStyle: "magazine-like story sections with vivid moments",
      typography: "expressive display with readable body",
    },
  };
  return styles[preset];
}

function targetRoleFor(data: ResumeData): string {
  return compact(
    data.roleUnderstanding?.targetRoleTitle || data.profile.title || data.timeline[0]?.position,
    "Target role to be confirmed",
    72,
  );
}

function strengthNames(data: ResumeData, limit = 6): string[] {
  const fromProfile = data.skillProfile?.detectedSkillNames ?? [];
  const fromSkillNodes = data.skills
    .filter((skill) => skill.status !== "missing")
    .sort((a, b) => scoreSkill(b) - scoreSkill(a))
    .map((skill) => skill.name);
  const fromTimeline = data.timeline.flatMap((node) => node.skills);
  return unique([...fromProfile, ...fromSkillNodes, ...fromTimeline]).slice(0, limit);
}

function scoreSkill(skill: SkillNode): number {
  const importance = skill.importance === "core" ? 4 : skill.importance === "important" ? 2 : 0;
  const status = skill.status === "owned" ? 2 : skill.status === "inferred" ? 1 : 0;
  return skill.level + importance + status;
}

function proofPointsFor(data: ResumeData, orderedTimeline: TimelineNode[]): string[] {
  const roleMappings = data.roleUnderstanding?.experienceMappings.map((item) => item.outcomeEvidence) ?? [];
  return unique([
    data.roleUnderstanding?.oneLineInterpretation,
    ...roleMappings,
    ...orderedTimeline.flatMap((node) => [
      node.evidenceResult,
      node.storyOutcome,
      ...node.highlights.filter((item) => /\d|%|提升|增长|上线|覆盖|完成|负责|主导/i.test(item)),
    ]),
  ]).slice(0, 5);
}

function experienceBlocksFor(orderedTimeline: TimelineNode[]): CareerSiteExperienceBlock[] {
  return orderedTimeline.slice(0, 4).map((node) => ({
    id: `experience-${node.id}`,
    title: compact(node.storyTitle || node.position, node.position || "Key experience", 80),
    organization: node.company || "Organization",
    period: periodFor(node),
    summary: compact(
      node.storyScene || node.description,
      `${node.company || "This role"} shows the candidate's most relevant experience.`,
      220,
    ),
    bullets: unique([
      node.storyChallenge ? `Challenge: ${node.storyChallenge}` : undefined,
      node.storyAction ? `Action: ${node.storyAction}` : undefined,
      node.storyOutcome ? `Outcome: ${node.storyOutcome}` : undefined,
      ...node.highlights,
    ]).slice(0, 4),
    sourceTimelineId: node.id,
  }));
}

function sectionsFor(data: ResumeData, orderedTimeline: TimelineNode[], strengths: string[], proofPoints: string[]): CareerSiteSection[] {
  const first = orderedTimeline[0];
  const sections: CareerSiteSection[] = [
    {
      id: "positioning",
      kind: "positioning",
      eyebrow: "Positioning",
      title: "What this site should make obvious",
      body: compact(
        data.roleUnderstanding?.oneLineInterpretation || data.profile.summary,
        "The candidate's positioning still needs one concise sentence.",
        240,
      ),
      bullets: strengths.slice(0, 4),
      sourceTimelineIds: [],
      confidence: strengths.length >= 3 ? 0.82 : 0.64,
    },
    {
      id: "proof",
      kind: "proof",
      eyebrow: "Proof",
      title: "Evidence that supports the positioning",
      body: proofPoints.length > 0
        ? "The page should lead with evidence already present in the resume, not invented claims."
        : "The page needs stronger measurable evidence before publishing.",
      bullets: proofPoints.length > 0 ? proofPoints : ["Add one concrete result, metric, or shipped outcome."],
      sourceTimelineIds: orderedTimeline.slice(0, 3).map((node) => node.id),
      confidence: proofPoints.length >= 2 ? 0.86 : 0.55,
    },
  ];

  if (first) {
    sections.push({
      id: "story",
      kind: "story",
      eyebrow: "Narrative",
      title: "The story arc",
      body: compact(
        first.storyReflection || first.description,
        "Start from the most recent and most relevant role, then connect it to the target role.",
        260,
      ),
      bullets: unique([first.storyChallenge, first.storyAction, first.storyOutcome, ...first.highlights]).slice(0, 4),
      sourceTimelineIds: [first.id],
      confidence: first.storyOutcome || first.evidenceResult ? 0.8 : 0.62,
    });
  }

  sections.push({
    id: "experience",
    kind: "experience",
    eyebrow: "Experience",
    title: "Selected career moments",
    body: "Each block is shaped as a story that a visitor can scan before opening the full details.",
    bullets: orderedTimeline.slice(0, 4).map((node) => compact(`${node.company} / ${node.position}`, "Experience", 80)),
    sourceTimelineIds: orderedTimeline.slice(0, 4).map((node) => node.id),
    confidence: orderedTimeline.length > 0 ? 0.84 : 0.4,
  });

  if (strengths.length > 0) {
    sections.push({
      id: "skills",
      kind: "skills",
      eyebrow: "Capability",
      title: "Capability map",
      body: "The skill section should explain what the candidate can repeatedly do, not just list keywords.",
      bullets: strengths,
      sourceTimelineIds: [],
      confidence: strengths.length >= 4 ? 0.82 : 0.65,
    });
  }

  if (data.education.length > 0) {
    sections.push({
      id: "education",
      kind: "education",
      eyebrow: "Background",
      title: "Education background",
      body: data.education
        .map((item) => unique([item.school, item.degree, item.major]).join(" / "))
        .join("; "),
      bullets: data.education.map((item) => unique([item.startDate, item.endDate]).join(" - ")),
      sourceTimelineIds: [],
      confidence: 0.75,
    });
  }

  sections.push({
    id: "contact",
    kind: "contact",
    eyebrow: "Next step",
    title: "Make the next conversation easy",
    body: data.profile.email
      ? `Use ${data.profile.email} as the primary contact path.`
      : "Add an email or preferred contact path before publishing.",
    bullets: unique([data.profile.email, data.profile.phone, data.profile.website, data.profile.linkedin]),
    sourceTimelineIds: [],
    confidence: data.profile.email ? 0.9 : 0.45,
  });

  return sections;
}

function reviewFor(data: ResumeData, sections: CareerSiteSection[]) {
  const checks = getPublishChecks(data);
  const publishBlockers = checks.filter((check) => check.severity === "blocker").map((check) => check.label);
  const missingFacts = checks
    .filter((check) => check.severity === "warning")
    .map((check) => check.label);
  const riskyClaims = sections
    .flatMap((section) => section.bullets)
    .filter((item) => /第一|唯一|顶级|最佳|千万|亿|100%/i.test(item))
    .slice(0, 5);
  const confidenceBase = sections.reduce((sum, section) => sum + section.confidence, 0) / Math.max(1, sections.length);
  const confidence = Math.max(0.35, Math.min(0.95, confidenceBase - publishBlockers.length * 0.12 - missingFacts.length * 0.04));
  return { confidence, missingFacts, riskyClaims, publishBlockers };
}

export function generateCareerSiteDraft(data: ResumeData, input: GenerateCareerSiteDraftInput = {}): CareerSiteDraft {
  const now = input.now ?? new Date();
  const orderedTimeline = getOrderedTimeline(data.timeline);
  const targetRole = targetRoleFor(data);
  const strengths = strengthNames(data);
  const proofPoints = proofPointsFor(data, orderedTimeline);
  const sections = sectionsFor(data, orderedTimeline, strengths, proofPoints);
  const style = styleForPreset(detectStylePreset(data, input.instruction));
  const review = reviewFor(data, sections);
  const name = compact(data.profile.name, "Candidate", 40);
  const firstExperience = orderedTimeline[0];
  const storyTheme = compact(
    firstExperience?.storyTitle || data.roleUnderstanding?.oneLineInterpretation || data.profile.summary,
    `${targetRole} career story`,
    100,
  );

  return {
    id: `draft-${data.profile.id || name.replace(/\s+/g, "-").toLowerCase()}`,
    sourceResumeId: data.profile.id || "local-resume",
    provider: input.provider ?? "rules",
    status: review.publishBlockers.length > 0 ? "needs_review" : "ready",
    positioning: {
      targetRole,
      headline: `${name} - ${targetRole}`,
      oneLinePitch: compact(
        data.roleUnderstanding?.oneLineInterpretation || data.profile.summary,
        `${name} is building a career story around ${targetRole}.`,
        180,
      ),
      audience: "Hiring managers, interviewers, and collaborators who need a fast read on career fit.",
      coreStrengths: strengths,
    },
    narrative: {
      theme: storyTheme,
      storyArc: firstExperience
        ? compact(
            firstExperience.storyReflection || firstExperience.description,
            "The story should connect recent work, proof, and target-role fit.",
            260,
          )
        : "The story needs at least one work, project, or internship experience.",
      featuredExperienceIds: orderedTimeline.slice(0, 3).map((node) => node.id),
      proofPoints,
    },
    hero: {
      eyebrow: "Agent-generated career site",
      title: `${name} for ${targetRole}`,
      subtitle: compact(
        data.profile.summary || data.roleUnderstanding?.oneLineInterpretation,
        "A generated personal site draft based on the uploaded resume.",
        220,
      ),
      primaryCta: "Publish site",
      secondaryCta: "Refine with agent",
    },
    sections,
    experienceBlocks: experienceBlocksFor(orderedTimeline),
    style,
    review,
    versionHistory: [
      {
        id: "v1",
        summary: "Initial site draft generated from resume facts.",
        createdAt: now.toISOString(),
      },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
