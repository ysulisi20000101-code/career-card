import type { ResumeData } from "@/types";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import type {
  CareerSiteChatResult,
  CareerSiteDraft,
  CareerSiteStylePreset,
} from "@/lib/agent/site-generator/types";

function compact(value: string, max = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized;
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function stylePatch(preset: CareerSiteStylePreset) {
  const styles: Record<CareerSiteStylePreset, CareerSiteDraft["style"]> = {
    executive: {
      preset,
      tone: "calm, senior, credible, evidence-led",
      density: "balanced",
      colorTheme: "ink, warm white, muted teal",
      layoutStyle: "executive dossier with proof-first sections",
      typography: "serif-like display with compact sans body",
    },
    "product-led": {
      preset,
      tone: "structured, product-minded, outcome-oriented",
      density: "balanced",
      colorTheme: "graphite, white, signal blue",
      layoutStyle: "product case-study flow",
      typography: "clean sans with crisp hierarchy",
    },
    "technical-builder": {
      preset,
      tone: "precise, systems-thinking, builder-oriented",
      density: "detailed",
      colorTheme: "charcoal, white, electric cyan",
      layoutStyle: "technical narrative with proof and architecture lanes",
      typography: "compact sans with monospace accents",
    },
    minimal: {
      preset,
      tone: "restrained, direct, highly readable",
      density: "focused",
      colorTheme: "black, white, zinc",
      layoutStyle: "single-column portfolio",
      typography: "quiet sans",
    },
    creative: {
      preset,
      tone: "human, vivid, story-forward",
      density: "balanced",
      colorTheme: "ink, white, coral",
      layoutStyle: "editorial story flow",
      typography: "expressive display with readable body",
    },
  };
  return styles[preset];
}

function inferStyle(text: string): CareerSiteStylePreset | null {
  if (includesAny(text, ["极简", "简洁", "克制", "minimal", "clean"])) return "minimal";
  if (includesAny(text, ["科技", "技术", "架构", "ai", "agent", "rag", "llm", "technical"])) return "technical-builder";
  if (includesAny(text, ["产品", "增长", "saas", "平台", "product"])) return "product-led";
  if (includesAny(text, ["高级", "高管", "管理", "负责人", "executive", "senior"])) return "executive";
  if (includesAny(text, ["创意", "设计", "品牌", "creative"])) return "creative";
  return null;
}

function findFocusExperience(draft: CareerSiteDraft, text: string): string | null {
  const normalized = text.toLowerCase();
  return (
    draft.experienceBlocks.find((block) =>
      [block.title, block.organization, block.summary, ...block.bullets]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )?.sourceTimelineId ?? null
  );
}

export function applyDraftChat(input: {
  draft?: CareerSiteDraft | null;
  resumeData: ResumeData;
  message: string;
  now?: Date;
}): CareerSiteChatResult {
  const now = input.now ?? new Date();
  const message = input.message.trim();
  const text = message.toLowerCase();
  const base = input.draft ?? generateCareerSiteDraft(input.resumeData, { now });
  const changes: string[] = [];
  const questions: string[] = [];
  let draft: CareerSiteDraft = {
    ...base,
    sections: base.sections.map((section) => ({ ...section, bullets: [...section.bullets] })),
    experienceBlocks: base.experienceBlocks.map((block) => ({ ...block, bullets: [...block.bullets] })),
    positioning: { ...base.positioning, coreStrengths: [...base.positioning.coreStrengths] },
    narrative: {
      ...base.narrative,
      featuredExperienceIds: [...base.narrative.featuredExperienceIds],
      proofPoints: [...base.narrative.proofPoints],
    },
    review: {
      ...base.review,
      missingFacts: [...base.review.missingFacts],
      riskyClaims: [...base.review.riskyClaims],
      publishBlockers: [...base.review.publishBlockers],
    },
    versionHistory: [...base.versionHistory],
  };

  const style = inferStyle(text);
  if (style) {
    draft = { ...draft, style: stylePatch(style) };
    changes.push(`Style preset changed to ${style}.`);
  }

  if (includesAny(text, ["ai agent", "agent", "智能体", "deepseek", "mimo"])) {
    draft = {
      ...draft,
      positioning: {
        ...draft.positioning,
        targetRole: "AI Agent Product / Platform Candidate",
        headline: `${input.resumeData.profile.name || "Candidate"} - AI Agent Product / Platform Candidate`,
        oneLinePitch: compact(
          "Position the site around AI Agent product judgment, workflow automation, and the ability to turn ambiguous user problems into shipped systems.",
        ),
        coreStrengths: Array.from(new Set(["AI Agent", "workflow design", "platform product", ...draft.positioning.coreStrengths])).slice(0, 8),
      },
      narrative: {
        ...draft.narrative,
        theme: "From product judgment to agentic systems",
        storyArc: compact(
          "Lead with the moments where the candidate turned workflow complexity into reusable product systems, then connect that evidence to AI Agent product work.",
        ),
      },
    };
    changes.push("Positioning shifted toward AI Agent product/platform work.");
  }

  if (includesAny(text, ["太虚", "更实在", "真实", "别夸张", "降低", "克制"])) {
    draft = {
      ...draft,
      style: { ...draft.style, tone: "restrained, evidence-first, concrete" },
      sections: draft.sections.map((section) =>
        section.id === "proof"
          ? {
              ...section,
              body: "This section now prioritizes verifiable facts and avoids claims that are not already supported by the resume.",
              bullets: section.bullets.map((bullet) => compact(bullet, 140)),
            }
          : section,
      ),
      review: {
        ...draft.review,
        riskyClaims: Array.from(new Set([...draft.review.riskyClaims, "Review any claim that lacks a source in the resume."])),
      },
    };
    changes.push("Tone tightened to a more concrete, evidence-first version.");
  }

  if (includesAny(text, ["重点", "突出", "放在", "强调", "focus"])) {
    const focusExperienceId = findFocusExperience(draft, text);
    if (focusExperienceId) {
      draft = {
        ...draft,
        narrative: {
          ...draft.narrative,
          featuredExperienceIds: [focusExperienceId, ...draft.narrative.featuredExperienceIds.filter((id) => id !== focusExperienceId)],
        },
      };
      changes.push("Featured experience order updated based on the requested focus.");
    } else {
      draft = {
        ...draft,
        narrative: {
          ...draft.narrative,
          theme: compact(`${draft.narrative.theme}; focus request: ${message}`, 140),
        },
      };
      changes.push("Narrative focus updated from your instruction.");
    }
  }

  if (changes.length === 0) {
    questions.push("你想优先改定位、叙事重点、视觉风格，还是某一段经历的表达？");
    changes.push("No direct patch was applied; the agent needs a more specific direction.");
  }

  draft = {
    ...draft,
    updatedAt: now.toISOString(),
    versionHistory: [
      ...draft.versionHistory,
      {
        id: `v${draft.versionHistory.length + 1}`,
        summary: compact(changes.join(" ")),
        createdAt: now.toISOString(),
      },
    ],
  };

  return {
    draft,
    summary: changes.join(" "),
    changes,
    questions,
  };
}
