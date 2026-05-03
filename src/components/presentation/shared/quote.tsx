"use client";

import type { ReactNode } from "react";

interface QuoteProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Quote({ children, className, style }: QuoteProps) {
  return (
    <div className={`quote${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}
