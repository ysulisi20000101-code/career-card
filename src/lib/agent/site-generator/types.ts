import type { AgentProviderId } from "@/lib/agent/types";

export type CareerSiteDraftStatus = "generating" | "ready" | "needs_review" | "published";

export type CareerSiteStylePreset =
  | "executive"
  | "product-led"
  | "technical-builder"
  | "minimal"
  | "creative";

export type CareerSiteSectionKind =
  | "positioning"
  | "story"
  | "proof"
  | "experience"
  | "skills"
  | "education"
  | "contact";

export interface CareerSitePositioning {
  targetRole: string;
  headline: string;
  oneLinePitch: string;
  audience: string;
  coreStrengths: string[];
}

export interface CareerSiteNarrative {
  theme: string;
  storyArc: string;
  featuredExperienceIds: string[];
  proofPoints: string[];
}

export interface CareerSiteHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface CareerSiteExperienceBlock {
  id: string;
  title: string;
  organization: string;
  period: string;
  summary: string;
  bullets: string[];
  sourceTimelineId: string;
}

export interface CareerSiteSection {
  id: string;
  kind: CareerSiteSectionKind;
  title: string;
  eyebrow?: string;
  body: string;
  bullets: string[];
  sourceTimelineIds: string[];
  confidence: number;
}

export interface CareerSiteStyle {
  preset: CareerSiteStylePreset;
  tone: string;
  density: "focused" | "balanced" | "detailed";
  colorTheme: string;
  layoutStyle: string;
  typography: string;
}

export interface CareerSiteReview {
  confidence: number;
  missingFacts: string[];
  riskyClaims: string[];
  publishBlockers: string[];
}

export interface CareerSiteDraftVersion {
  id: string;
  summary: string;
  createdAt: string;
}

export interface CareerSiteDraft {
  id: string;
  sourceResumeId: string;
  provider: AgentProviderId;
  status: CareerSiteDraftStatus;
  positioning: CareerSitePositioning;
  narrative: CareerSiteNarrative;
  hero: CareerSiteHero;
  sections: CareerSiteSection[];
  experienceBlocks: CareerSiteExperienceBlock[];
  style: CareerSiteStyle;
  review: CareerSiteReview;
  versionHistory: CareerSiteDraftVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCareerSiteDraftInput {
  provider?: AgentProviderId;
  instruction?: string;
  targetRoleOverride?: string;
  now?: Date;
}

export interface CareerSiteChatResult {
  draft: CareerSiteDraft;
  summary: string;
  changes: string[];
  questions: string[];
}
