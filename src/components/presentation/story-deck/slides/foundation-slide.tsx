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

export function FoundationSlide({ slide }: Props) {
  const bulletItems = slide.bullets ?? [];
  // Parse bullets into fd-card data: "Company · Role · Period：item｜item｜▶ 学会：..."
  const fdCards = bulletItems.map((b) => {
    const colonIdx = b.indexOf("：");
    const beforeColon = colonIdx > 0 ? b.slice(0, colonIdx) : b;
    const detail = colonIdx > 0 ? b.slice(colonIdx + 1) : "";
    const parts = beforeColon.split("·").map((s) => s.trim());
    const company = parts[0] ?? "";
    const role = parts.slice(1).join(" · ");
    const items = detail
      .split(/[｜|；;]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return { company, role, items };
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
            {card.items.map((item, itemIndex) => {
              const isTakeaway = /^▶|^学会/.test(item);
              return (
                <div
                  key={itemIndex}
                  className={isTakeaway ? undefined : "fd-item"}
                  style={isTakeaway ? { fontSize: 10, color: "var(--t3)", marginTop: 8, textAlign: "left" as const } : undefined}
                >
                  {item}
                </div>
              );
            })}
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
