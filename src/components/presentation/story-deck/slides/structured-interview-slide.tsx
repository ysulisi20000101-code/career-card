"use client";

import { ExternalLink } from "lucide-react";
import type { CSSProperties } from "react";
import type { PresentationOverlay, PresentationSlide, PresentationTheme } from "@/lib/presentation/types";
import { AccentCard } from "../../shared/accent-card";
import { Card } from "../../shared/card";
import { Eyebrow } from "../../shared/eyebrow";
import { Quote } from "../../shared/quote";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

const VARIANT_COLORS: Record<string, string> = {
  gold: "var(--gold-bright)",
  teal: "var(--teal)",
  violet: "var(--violet)",
  blue: "var(--blue)",
  rose: "var(--rose)",
  green: "var(--green)",
  cyan: "var(--cyan)",
};

function getVariantColor(variant: string | undefined, index: number) {
  if (variant && VARIANT_COLORS[variant]) return VARIANT_COLORS[variant];
  const fallback = ["gold", "teal", "violet", "blue", "rose", "green", "cyan"][index % 7]!;
  return VARIANT_COLORS[fallback]!;
}

export function StructuredInterviewSlide({ slide, overlays, onOpenOverlay }: Props) {
  const cards = slide.cards ?? [];
  const callouts = slide.highlightCallouts ?? [];
  const overlayItems = (slide.overlayIds ?? [])
    .map((id) => overlays.find((overlay) => overlay.id === id))
    .filter((overlay): overlay is PresentationOverlay => Boolean(overlay));
  const cardGridClass = cards.length >= 3 ? "g3" : "g2";

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 18px" }}>
      <Eyebrow label={slide.subtitle ?? slide.moduleTitle ?? "Interview Space"} />
      <h2 className="h2" style={{ maxWidth: 900 }}>{slide.title}</h2>
      {slide.body && <p className="lead mt8">{slide.body}</p>}

      {cards.length > 0 && (
        <div className={`${cardGridClass} mt12`} style={{ alignItems: "stretch" }}>
          {cards.map((card, index) => {
            const color = getVariantColor(card.variant, index);
            return (
              <Card
                key={`${card.title}-${index}`}
                className="fu"
                style={{ borderTop: `3px solid ${color}`, minHeight: 132 } as CSSProperties}
              >
                <div style={{ fontSize: 13, fontWeight: 850, color: "var(--t)", lineHeight: 1.35, marginBottom: 8 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {card.body}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {slide.bullets.length > 0 && (
        <div className="mt12" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {slide.bullets.slice(0, 6).map((bullet, index) => (
            <AccentCard
              key={`${bullet}-${index}`}
              variant={index % 2 === 0 ? "gold" : "violet"}
              className="fu"
              style={{ minHeight: 58 }}
            >
              {bullet}
            </AccentCard>
          ))}
        </div>
      )}

      {(callouts.length > 0 || overlayItems.length > 0) && (
        <div className="mt12" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {callouts.length > 0 && (
            <Quote className="fu" style={{ flex: "1 1 360px", margin: 0 }}>
              <strong>{callouts[0]!.title}</strong>
              <br />
              {callouts.map((callout) => callout.body).join(" / ")}
            </Quote>
          )}

          {overlayItems.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {overlayItems.map((overlay) => (
                <button
                  key={overlay.id}
                  type="button"
                  onClick={() => onOpenOverlay(overlay.id)}
                  className="ov-trigger"
                  style={{
                    height: 34,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border-s)",
                    background: "rgba(255,255,255,.78)",
                    color: "var(--t2)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 750,
                    font: "inherit",
                  }}
                >
                  <ExternalLink size={13} />
                  {overlay.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
