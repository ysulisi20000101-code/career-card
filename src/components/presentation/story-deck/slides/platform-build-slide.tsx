"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { Eyebrow } from "../../shared/eyebrow";
import { AccentCard } from "../../shared/accent-card";
import { QuadItem } from "../../shared/quad-item";
import { PhaseBadge } from "../../shared/phase-badge";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

const QUAD_COLORS = ["var(--blue)", "var(--teal)", "var(--rose)", "var(--gold-bright)"];

export function PlatformBuildSlide({ slide, onOpenOverlay }: Props) {
  const hasOverlay = slide.overlayIds && slide.overlayIds.length > 0;
  const bullets = slide.bullets ?? [];

  return (
    <div>
      <Eyebrow label={slide.subtitle ?? "Platform Build"} />
      <h2 className="h2">{slide.title}</h2>
      <p className="lead mt8">{slide.body}</p>

      <div
        className={`quad mt12${hasOverlay ? " ov-trigger" : ""}`}
        onClick={hasOverlay ? () => onOpenOverlay(slide.overlayIds![0]!) : undefined}
        style={{ maxWidth: 880, margin: "12px auto 0" }}
      >
        {bullets.slice(0, 4).map((bullet, i) => {
          const colonIdx = bullet.indexOf("：");
          const label = colonIdx > 0 ? bullet.slice(0, colonIdx) : bullet;
          const desc = colonIdx > 0 ? bullet.slice(colonIdx + 1) : "";
          return (
            <QuadItem
              key={i}
              number={String(i + 1).padStart(2, "0")}
              color={QUAD_COLORS[i] ?? QUAD_COLORS[0]!}
              title={label}
              desc={desc}
              className="fu"
            />
          );
        })}
      </div>

      {slide.highlightCallouts && slide.highlightCallouts.length > 0 && (
        <AccentCard className="mt10 fu">
          <strong>{slide.highlightCallouts[0]?.title ?? "关键决策"}：</strong>
          {slide.highlightCallouts[0]?.body ?? ""}
        </AccentCard>
      )}

      <div className="fu" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <PhaseBadge variant="pm">{slide.phaseTag ?? "Phase 1"}</PhaseBadge>
        {slide.summaryLine && (
          <span style={{ fontSize: "10.5px", color: "var(--t3)" }}>{slide.summaryLine}</span>
        )}
      </div>
    </div>
  );
}
