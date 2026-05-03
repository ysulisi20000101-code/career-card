"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";

interface FallbackSlideProps {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

export function FallbackSlide({ slide, theme }: FallbackSlideProps) {
  return (
    <div style={{ padding: "0 20px" }}>
      {slide.subtitle && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: theme.colors.gold,
          marginBottom: 14,
        }}>
          <span style={{ width: 16, height: 1, background: theme.colors.gold, opacity: 0.45 }} />
          {slide.subtitle}
        </div>
      )}
      <h2 style={{
        fontSize: "clamp(23px, 3vw, 42px)",
        lineHeight: 1.1,
        fontWeight: 800,
        letterSpacing: "-.015em",
        color: theme.colors.text,
        marginBottom: 16,
      }}>
        {slide.title}
      </h2>
      <p style={{
        color: theme.colors.text2,
        fontSize: "clamp(14px, 1.3vw, 17px)",
        lineHeight: 1.7,
        maxWidth: 720,
        marginBottom: 20,
      }}>
        {slide.body}
      </p>
      {slide.bullets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 640 }}>
          {slide.bullets.map((bullet, i) => (
            <div key={i} style={{
              padding: "12px 16px",
              borderLeft: `3px solid ${theme.colors.gold}`,
              background: theme.colors.goldDim,
              borderRadius: `0 ${theme.radius.sm} ${theme.radius.sm} 0`,
              fontSize: 12.5,
              color: theme.colors.text2,
              lineHeight: 1.55,
            }}>
              {bullet}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
