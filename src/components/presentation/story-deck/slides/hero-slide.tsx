"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { PhaseBadge } from "../../shared/phase-badge";
import { HeroArchitecture } from "../../diagrams/hero-architecture";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

interface HeroAgent { name: string; subtitle: string; color: string }
interface HeroToolchainBlock { name: string; subtitle: string; color: string }

function isValidAgentArray(val: unknown): val is HeroAgent[] {
  return Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "color" in val[0];
}
function isValidToolchainArray(val: unknown): val is HeroToolchainBlock[] {
  return Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "color" in val[0];
}

export function HeroSlide({ slide, onOpenOverlay }: Props) {
  const name = slide.title?.split("：")[0] ?? slide.title ?? "";
  const subtitle = slide.subtitle ?? "";
  const viz = slide.visualizations?.[0]?.data;

  return (
    <div className="hero-grid">
      <div>
        <h1 className="hero-name" style={{ fontSize: "clamp(28px,3.8vw,48px)" }}>{name}</h1>
        <p style={{ fontSize: "clamp(14px,1.3vw,18px)", color: "var(--gold-bright)", fontWeight: 700, marginTop: 4 }}>
          {subtitle}
        </p>
        <p className="hero-subtitle mt12" style={{ maxWidth: "100%" }}>
          {slide.body}
        </p>

        <div
          className="fu"
          style={{
            marginTop: 20,
            padding: 18,
            border: "1px solid var(--border)",
            borderRadius: "var(--rl)",
            background: "var(--surface)",
            fontSize: "var(--fs-base)",
            lineHeight: 1.7,
            color: "var(--t2)",
          }}
        >
          {slide.bullets.map((bullet, i) => (
            <div key={i}>{bullet}</div>
          ))}
        </div>

        <div className="fu" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--t3)" }}>
          <PhaseBadge variant="pm">工信部汽车工具链摸底调研</PhaseBadge>
        </div>
      </div>

      <div onClick={() => onOpenOverlay("ov-arch-detail")}>
        <HeroArchitecture
          agents={isValidAgentArray(viz?.agents) ? viz.agents : undefined}
          ragLabel={typeof viz?.ragLabel === "string" ? viz.ragLabel : undefined}
          ragSubtitle={typeof viz?.ragSubtitle === "string" ? viz.ragSubtitle : undefined}
          ragBlocks={Array.isArray(viz?.ragBlocks) && viz.ragBlocks.length > 0 ? viz.ragBlocks as string[] : undefined}
          toolchainLabel={typeof viz?.toolchainLabel === "string" ? viz.toolchainLabel : undefined}
          toolchainSubtitle={typeof viz?.toolchainSubtitle === "string" ? viz.toolchainSubtitle : undefined}
          toolchainBlocks={isValidToolchainArray(viz?.toolchainBlocks) ? viz.toolchainBlocks : undefined}
        />
      </div>
    </div>
  );
}
