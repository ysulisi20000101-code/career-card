"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";

interface SlideContainerProps {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
  position: "left" | "active" | "right";
  children: React.ReactNode;
}

export function SlideContainer({ slide, position, children }: SlideContainerProps) {
  return (
    <div
      className={`slide${position === "active" ? " active" : ""}${position === "left" ? " left" : ""}${position === "right" ? " right" : ""}`}
      data-slide={slide.id}
      data-module={slide.moduleId ?? "self"}
    >
      <div className="slide-inner">
        {children}
      </div>
    </div>
  );
}
