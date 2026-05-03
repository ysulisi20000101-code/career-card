"use client";

interface EyebrowProps {
  label: string;
}

export function Eyebrow({ label }: EyebrowProps) {
  return <div className="eb">{label}</div>;
}
