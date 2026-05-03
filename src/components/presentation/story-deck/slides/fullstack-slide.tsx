"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { Eyebrow } from "../../shared/eyebrow";
import { PipelineSVG } from "../../diagrams/pipeline-svg";
import { DomainTag } from "../../shared/domain-tag";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

interface PipelineStage {
  name: string;
  subtitle: string;
  bullets: string[];
  agentNote: string;
  color: string;
}

function isValidStages(val: unknown): val is PipelineStage[] {
  return Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null && "color" in val[0];
}

export function FullstackSlide({ slide, theme }: Props) {
  const domainTags = slide.domainTags ?? [];
  const viz = slide.visualizations?.[0]?.data;
  const stages = isValidStages(viz?.stages) ? viz.stages : undefined;

  return (
    <div>
      <Eyebrow label={slide.subtitle ?? "Full Stack"} />
      <h2 className="h2">{slide.title}</h2>
      <p className="lead mt8">{slide.body}</p>

      <PipelineSVG
        stages={stages}
        agentLayerLabel={typeof viz?.agentLayerLabel === "string" ? viz.agentLayerLabel : undefined}
        ragLabel={typeof viz?.ragLabel === "string" ? viz.ragLabel : undefined}
        ragSubtitle={typeof viz?.ragSubtitle === "string" ? viz.ragSubtitle : undefined}
        embodiedLabel={typeof viz?.embodiedLabel === "string" ? viz.embodiedLabel : undefined}
        embodiedSubtitle={typeof viz?.embodiedSubtitle === "string" ? viz.embodiedSubtitle : undefined}
      />

      {domainTags.length > 0 && (
        <div className="domains mt10 fu">
          {domainTags.map((tag, i) => {
            const borderColors = ["rgba(138,92,15,.25)", "rgba(107,94,160,.25)", "rgba(184,93,106,.25)"];
            return (
              <DomainTag key={i} style={{ borderColor: borderColors[i % borderColors.length] }}>
                {tag}
              </DomainTag>
            );
          })}
        </div>
      )}
    </div>
  );
}
