import type { SlideRenderer } from "@/lib/presentation/types";
import { HeroSlide } from "./slides/hero-slide";
import { FoundationSlide } from "./slides/foundation-slide";
import { TensionSlide } from "./slides/tension-slide";
import { PlatformBuildSlide } from "./slides/platform-build-slide";
import { AgentLeapSlide } from "./slides/agent-leap-slide";
import { FullstackSlide } from "./slides/fullstack-slide";
import { ImpactSlide } from "./slides/impact-slide";
import { ResolutionSlide } from "./slides/resolution-slide";
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
};

export function getSlideRenderer(kind: string): SlideRenderer {
  return slideRenderers[kind] ?? FallbackSlide;
}
