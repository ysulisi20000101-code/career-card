import type { SlideRenderer } from "@/lib/presentation/types";
import { HeroSlide } from "./slides/hero-slide";
import { FoundationSlide } from "./slides/foundation-slide";
import { TensionSlide } from "./slides/tension-slide";
import { PlatformBuildSlide } from "./slides/platform-build-slide";
import { AgentLeapSlide } from "./slides/agent-leap-slide";
import { FullstackSlide } from "./slides/fullstack-slide";
import { ImpactSlide } from "./slides/impact-slide";
import { ResolutionSlide } from "./slides/resolution-slide";
import { StructuredInterviewSlide } from "./slides/structured-interview-slide";
import { FallbackSlide } from "./fallback-slide";

export const slideRenderers: Record<string, SlideRenderer> = {
  hero: HeroSlide,
  foundation: FoundationSlide,
  tension: TensionSlide,
  platform_build: PlatformBuildSlide,
  agent_leap: AgentLeapSlide,
  lifecycle: FullstackSlide,
  impact: ImpactSlide,
  resolution: ResolutionSlide,
  job_positioning: StructuredInterviewSlide,
  job_business_context: StructuredInterviewSlide,
  job_customer_segments: StructuredInterviewSlide,
  job_agent_boundary: StructuredInterviewSlide,
  job_solution_path: StructuredInterviewSlide,
  material_index: StructuredInterviewSlide,
  material_framework: StructuredInterviewSlide,
  starter_outline: StructuredInterviewSlide,
};

export function getSlideRenderer(kind: string): SlideRenderer {
  return slideRenderers[kind] ?? FallbackSlide;
}
