"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { Eyebrow } from "../../shared/eyebrow";
import { BaCard } from "../../shared/ba-card";
import { Quote } from "../../shared/quote";
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

export function ResolutionSlide({ slide, theme }: Props) {
  const bullets = slide.bullets ?? [];
  const closingQuote = slide.closingQuote ?? "";

  // Split bullets into before/after using first Half
  const half = Math.ceil(bullets.length / 2);
  const beforeItems = bullets.slice(0, half).map((b) => {
    // Add <em> highlighting
    return b.replace(/(\d+\s*[个位项条次]\s*)/g, "<em>$1</em>")
      .replace(/(\d+%\+)/g, "<em>$1</em>")
      .replace(/(\|)/g, "<em>|</em>");
  });
  const afterItems = bullets.slice(half).map((b) => {
    return b.replace(/(\d+\s*[个位项条次]\s*)/g, "<em>$1</em>")
      .replace(/(\d+%\+)/g, "<em>$1</em>")
      .replace(/(\|)/g, "<em>|</em>");
  });

  const viz = slide.visualizations?.[0]?.data;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Eyebrow label={slide.subtitle ?? "The Arc"} />
      <h2 className="h2">{slide.title}</h2>

      <VModelSVG
        variant={isValidVModelVariant(viz?.variant) ? viz.variant : "complete"}
        designNodes={isValidVModelNodes(viz?.designNodes) ? viz.designNodes : undefined}
        testNodes={isValidVModelNodes(viz?.testNodes) ? viz.testNodes : undefined}
        platformName={typeof viz?.platformName === "string" ? viz.platformName : undefined}
        platformSubtitle={typeof viz?.platformSubtitle === "string" ? viz.platformSubtitle : undefined}
        designLabel={typeof viz?.designLabel === "string" ? viz.designLabel : undefined}
        testLabel={typeof viz?.testLabel === "string" ? viz.testLabel : undefined}
        caption={typeof viz?.caption === "string" ? viz.caption : undefined}
      />

      <div className="ba-grid mt10">
        <BaCard variant="before" items={beforeItems.length > 0 ? beforeItems : ["6 个<em>国外桌面工具</em>", "<em>0</em> AI 能力", "<em>0</em> 多人协同", "<em>0</em> 数据积累"]} className="fu" />
        <div className="ba-arrow fu">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="14,7 19,12 14,17" />
          </svg>
        </div>
        <BaCard variant="after" items={afterItems.length > 0 ? afterItems : ["1 个<em>国产云平台</em>", "<em>5</em> 个 AI Agent", "<em>100%</em> Web 协同", "<em>结构化</em>知识库"]} className="fu" />
      </div>

      {closingQuote && (
        <Quote className="mt12 fu" style={{ textAlign: "center" as const }}>
          {closingQuote}
        </Quote>
      )}

      {slide.narrativeThread && (
        <div className="fu" style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "var(--t3)" }}>
          {slide.narrativeThread}
        </div>
      )}
    </div>
  );
}
