"use client";

import type { ReactNode } from "react";

interface AccentCardProps {
  variant?: "gold" | "teal" | "violet" | "blue";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function AccentCard({ variant, children, className, style }: AccentCardProps) {
  return (
    <div
      className={`card-accent${variant === "violet" ? " v" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
