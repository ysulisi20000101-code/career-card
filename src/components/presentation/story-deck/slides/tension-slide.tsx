"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { Eyebrow } from "../../shared/eyebrow";
import { Card } from "../../shared/card";
import { AccentCard } from "../../shared/accent-card";
import { Timeline } from "../../shared/timeline";
import type { TimelineItem } from "../../shared/timeline";
import { VModelSVG } from "../../diagrams/v-model-svg";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

interface VModelNode { name: string; tool: string; domestic?: boolean; color?: string }

function isValidVModelNodes(val: unknown): val is VModelNode[] {
  return Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "name" in val[0] && "tool" in val[0];
}

function isValidVModelVariant(val: unknown): val is "monopoly" | "complete" {
  return val === "monopoly" || val === "complete";
}

export function TensionSlide({ slide, onOpenOverlay }: Props) {
  // Parse bullets into timeline items: format "Time：text" or use as-is
  const timelineItems: TimelineItem[] = (slide.bullets ?? []).map((b) => {
    const colonIdx = b.indexOf("：");
    if (colonIdx > 0) {
      return { time: b.slice(0, colonIdx), text: b.slice(colonIdx + 1) };
    }
    return { time: "", text: b };
  });

  // Check for overlays
  const firstOverlayId = slide.overlayIds?.[0];
  const viz = slide.visualizations?.[0]?.data;
  const vModel = (
    <VModelSVG
      variant={isValidVModelVariant(viz?.variant) ? viz.variant : "monopoly"}
      designNodes={isValidVModelNodes(viz?.designNodes) ? viz.designNodes : undefined}
      testNodes={isValidVModelNodes(viz?.testNodes) ? viz.testNodes : undefined}
      platformName={typeof viz?.platformName === "string" ? viz.platformName : undefined}
      platformSubtitle={typeof viz?.platformSubtitle === "string" ? viz.platformSubtitle : undefined}
      designLabel={typeof viz?.designLabel === "string" ? viz.designLabel : undefined}
      testLabel={typeof viz?.testLabel === "string" ? viz.testLabel : undefined}
      caption={typeof viz?.caption === "string" ? viz.caption : undefined}
    />
  );

  return (
    <div>
      <Eyebrow label={slide.subtitle ?? "The Gap"} />
      <h2 className="h2">{slide.title}</h2>

      {firstOverlayId ? (
        <button
          type="button"
          className="ov-trigger"
          aria-label="展开行业断点详情"
          onClick={() => onOpenOverlay(firstOverlayId)}
          style={{ appearance: "none", display: "block", width: "100%", border: 0, padding: 0, background: "transparent", color: "inherit", cursor: "pointer", font: "inherit", textAlign: "inherit" }}
        >
          {vModel}
        </button>
      ) : vModel}

      <div className="g2 mt10" style={{ gap: 14 }}>
        <div>
          <Card style={{ borderLeft: "4px solid var(--gold-bright)" }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--t)", marginBottom: 6 }}>
              {slide.body?.slice(0, 40) ?? "核心经历"}
            </div>
            <Timeline items={timelineItems} />
          </Card>
        </div>
        <div>
          {slide.highlightCallouts && slide.highlightCallouts.length > 0 && (
            <AccentCard variant="gold" className="fu">
              <strong>{slide.highlightCallouts[0]?.title ?? "关键发现"}：</strong>
              <br />
              {slide.highlightCallouts.map((c, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {c.body}
                </span>
              ))}
            </AccentCard>
          )}
        </div>
      </div>

      {slide.highlightCallouts && slide.highlightCallouts.length > 1 && (
        <AccentCard variant="violet" className="mt12 fu">
          <strong>{slide.highlightCallouts[1]?.title ?? ""}</strong>
          {slide.highlightCallouts[1]?.body ?? ""}
        </AccentCard>
      )}

    </div>
  );
}
