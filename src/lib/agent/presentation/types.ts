import type { PresentationDraft, PresentationSlide, PresentationOverlay } from "@/lib/presentation/types";
import type { ResumeData } from "@/types";

/** Input to the LLM presentation enhancement API. */
export interface PresentationEnhancementRequest {
  resumeData: ResumeData;
  baseline: PresentationDraft;
  mode: "enhance";
}

/** Sparse update for a single slide — only fields the LLM is allowed to modify. */
export interface SlideEnhancementUpdate {
  id: string;
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  visualizations?: PresentationSlide["visualizations"];
  phaseTag?: string;
  summaryLine?: string;
  highlightCallouts?: PresentationSlide["highlightCallouts"];
  cards?: PresentationSlide["cards"];
  closingQuote?: string;
  narrativeThread?: string;
  featurePills?: PresentationSlide["featurePills"];
  domainTags?: string[];
  speakerNotes?: string;
}

/** Sparse update for a single overlay. */
export interface OverlayEnhancementUpdate {
  id: string;
  title?: string;
  body?: string;
}

/** LLM response envelope — the JSON we ask the LLM to return. */
export interface LLMEnhancementOutput {
  slides?: SlideEnhancementUpdate[];
  overlays?: OverlayEnhancementUpdate[];
}

/** Issue found during validation or Rule-0 scan. */
export interface ValidationIssue {
  id: string;
  slideId?: string;
  field?: string;
  severity: "warning" | "error";
  message: string;
}

/** Provider trace for transparency in the API response. */
export interface EnhancementTrace {
  provider: string;
  status: "used" | "fallback" | "exhausted";
  note?: string;
}

/** Final API response. */
export interface PresentationEnhancementResult {
  draft: PresentationDraft;
  issues: ValidationIssue[];
  trace: EnhancementTrace;
}
