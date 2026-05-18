"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { Eyebrow } from "../../shared/eyebrow";
import { Card } from "../../shared/card";
import { AccentCard } from "../../shared/accent-card";
import { Quote } from "../../shared/quote";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

const CARD_TOPS = ["var(--gold-bright)", "var(--violet)", "var(--teal)"] as const;
const CARD_METRIC_STYLES = [
  { color: "var(--gold-bright)" },
  { color: "var(--violet)" },
  { color: "var(--teal)" },
];

export function ImpactSlide({ slide }: Props) {
  const cards = slide.cards ?? [];
  const bullets = slide.bullets ?? [];
  const highlightCallouts = slide.highlightCallouts ?? [];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <Eyebrow label={slide.subtitle ?? "Impact"} />
      <h2 className="h2">{slide.title}</h2>

      <div className="g3 mt10">
        {cards.slice(0, 3).map((card, i) => {
          const metrics = card.body.split("\n").filter(Boolean);
          return (
            <Card
              key={i}
              className="fu"
              style={{ borderTop: `4px solid ${CARD_TOPS[i % CARD_TOPS.length]}`, textAlign: "center" as const }}
            >
              <div style={{ fontSize: 32, fontWeight: 900, color: CARD_METRIC_STYLES[i % 3]!.color, fontFeatureSettings: "'tnum'", marginBottom: 4 }}>
                {metrics[0] ?? card.title}
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--t)", marginBottom: 6 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--t3)", lineHeight: 1.6 }}>
                {metrics.slice(1).map((m, j) => (
                  <span key={j}>{m}<br /></span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {highlightCallouts.length > 0 && (
        <AccentCard variant="violet" className="mt10 fu">
          <strong>{highlightCallouts[0]?.title}</strong>
          <span style={{ fontSize: 12, color: "var(--t2)" }}>
            <br />
            {highlightCallouts.map((c) => c.body).join("。")}
          </span>
        </AccentCard>
      )}

      {bullets.length > 0 && (
        <Quote className="mt10 fu">
          {bullets[bullets.length - 1]}
        </Quote>
      )}
    </div>
  );
}
