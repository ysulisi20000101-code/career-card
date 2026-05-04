"use client";

interface PhaseBadgeProps {
  variant?: "pm" | "dir";
  children: string;
  className?: string;
}

export function PhaseBadge({ variant = "pm", children, className }: PhaseBadgeProps) {
  return (
    <span className={`phase ${variant}${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
