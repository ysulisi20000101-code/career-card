import type { PublicSiteTemplate } from "@/types";

export type LayoutVariant = "expressive" | "balanced" | "dense" | "minimal";

export type PublicPageNarrativeStatus = "draft" | "needs_review" | "ready";

export type PublicPageModuleKind =
  | "hero"
  | "proof"
  | "story"
  | "experience"
  | "skills"
  | "education"
  | "contact";

export interface ModuleSourceRef {
  type: "profile" | "timeline" | "project" | "skill" | "education" | "roleUnderstanding";
  id?: string;
  path?: string;
  fingerprint?: string;
}

export interface PublicPageModuleItem {
  id: string;
  title: string;
  eyebrow?: string;
  body: string;
  bullets: string[];
  sourceRefs: ModuleSourceRef[];
}

export interface PublicPageModule {
  id: string;
  kind: PublicPageModuleKind;
  title: string;
  eyebrow?: string;
  body: string;
  bullets: string[];
  sourceRefs: ModuleSourceRef[];
  items?: PublicPageModuleItem[];
  stale?: {
    reason: "source_changed" | "source_deleted" | "target_role_changed";
    changedSourceRefs: ModuleSourceRef[];
  };
}

export interface PublicPageNarrative {
  id: string;
  sourceResumeId: string;
  resumeRevision: string;
  status: PublicPageNarrativeStatus;
  positioning: {
    targetRole: string;
    headline: string;
    oneLinePitch: string;
    memorableSignal: string;
    audience: string;
    coreStrengths: string[];
  };
  readingLayers: {
    tenSecondModuleId: string;
    sixtySecondModuleIds: string[];
    threeMinuteModuleIds: string[];
  };
  modules: PublicPageModule[];
  review: {
    confidence: number;
    missingFacts: string[];
    riskyClaims: string[];
    publishBlockers: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicNarrativeRenderOptions {
  themeId: string;
  contentPreset: PublicSiteTemplate;
  layoutVariant: LayoutVariant;
}
