import type { ComponentType } from "react";
import type { ModuleSourceRef } from "@/lib/public-narrative/types";

export interface PresentationDraft {
  id: string;
  schemaVersion: 1;
  sourceResumeRevision: string;
  sourcePrepNarrativeId?: string;
  targetRole: string;
  template: "agent-product-arc" | "system-builder" | "growth-commercial" | "technical-project";
  slides: PresentationSlide[];
  overlays: PresentationOverlay[];
  themeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationSlide {
  id: string;
  kind: string;
  title: string;
  subtitle?: string;
  body: string;
  bullets: string[];
  visualizations?: VisualizationSpec[];
  overlayIds?: string[];
  speakerNotes?: string;
  hidden?: boolean;
  sourceRefs: ModuleSourceRef[];
  /** Pill badge next to summary line, e.g. "Phase 1 · 产品经理" */
  phaseTag?: string;
  /** Text after the phase tag pill */
  summaryLine?: string;
  /** Highlight callout boxes (gold/teal/violet themed) */
  highlightCallouts?: { title: string; body: string; variant?: "gold" | "teal" | "violet" | "blue" }[];
  /** Impact cards with colored top border */
  cards?: { title: string; body: string; variant?: "gold" | "teal" | "violet" | "blue" }[];
  /** Bold closing quote for resolution slide */
  closingQuote?: string;
  /** Narrative thread text for resolution slide */
  narrativeThread?: string;
  /** Feature highlight pills (for fullstack slide) */
  featurePills?: { label: string; variant?: "violet" | "blue" | "gold" }[];
  /** Domain tags (for fullstack slide) */
  domainTags?: string[];
}

export interface PresentationOverlay {
  id: string;
  title: string;
  body: string;
  kind: string;
  sourceRefs: ModuleSourceRef[];
}

export interface VisualizationSpec {
  type: "v-model" | "pipeline" | "orbit" | "custom";
  data: Record<string, unknown>;
}

export type SlideRenderer = ComponentType<{
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}>;

export interface PresentationTheme {
  id: string;
  name: string;
  colors: {
    bg: string;
    bg2: string;
    surface: string;
    text: string;
    text2: string;
    text3: string;
    gold: string;
    goldDim: string;
    teal: string;
    tealDim: string;
    violet: string;
    violetDim: string;
    blue: string;
    blueDim: string;
    amber: string;
    amberDim: string;
    rose: string;
    green: string;
    cyan: string;
    border: string;
    borderStrong: string;
  };
  radius: { sm: string; lg: string };
}
