"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { Eyebrow } from "../../shared/eyebrow";
import { AccentCard } from "../../shared/accent-card";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

export function FoundationSlide({ slide, theme }: Props) {
  const bulletItems = slide.bullets ?? [];
  // Parse bullets into fd-card data: format is "Company · Role：detail"
  const fdCards = bulletItems.map((b) => {
    const colonIdx = b.indexOf("：");
    const beforeColon = colonIdx > 0 ? b.slice(0, colonIdx) : b;
    const detail = colonIdx > 0 ? b.slice(colonIdx + 1) : "";
    const parts = beforeColon.split("·").map((s) => s.trim());
    const company = parts[0] ?? "";
    const role = parts[1] ?? "";
    return { company, role, detail };
  });

  return (
    <div>
      <Eyebrow label={slide.subtitle ?? "Foundation"} />
      <h2 className="h2">{slide.title}</h2>
      <p className="lead mt10">{slide.body}</p>

      <div className="g3 mt10">
        {fdCards.slice(0, 3).map((card, i) => (
          <div key={i} className="fd-card fu">
            <div className="fd-company">{card.company}</div>
            <div className="fd-role">{card.role}</div>
            <div className="fd-item">{card.detail}</div>
          </div>
        ))}
      </div>

      {slide.highlightCallouts && slide.highlightCallouts.length > 0 && (
        <AccentCard variant="violet" className="mt12 fu">
          <strong>{slide.highlightCallouts[0]?.title}</strong>
          {slide.highlightCallouts[0]?.body ? `——${slide.highlightCallouts[0].body}` : ""}
        </AccentCard>
      )}
    </div>
  );
}
