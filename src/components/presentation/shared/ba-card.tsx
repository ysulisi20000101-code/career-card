"use client";

import type React from "react";

interface BaCardProps {
  variant: "before" | "after";
  items: string[];
  className?: string;
}

function renderInlineEmphasis(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /<em>(.*?)<\/em>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(<em key={`${match.index}-${match[1]}`}>{match[1]}</em>);
    cursor = pattern.lastIndex;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export function BaCard({ variant, items, className }: BaCardProps) {
  return (
    <div className={`ba-card ${variant}${className ? ` ${className}` : ""}`}>
      <div className="ba-label">{variant === "before" ? "BEFORE" : "AFTER"}</div>
      <div className="ba-item">
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 && <br />}
            <span>{renderInlineEmphasis(item)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
