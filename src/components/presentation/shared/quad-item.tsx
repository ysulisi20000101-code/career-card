"use client";

interface QuadItemProps {
  number: string;
  color: string;
  title: string;
  desc: string;
  className?: string;
}

export function QuadItem({ number, color, title, desc, className }: QuadItemProps) {
  return (
    <div
      className={`quad-item${className ? ` ${className}` : ""}`}
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="q-icon" style={{ color }}>
        {number}
      </div>
      <div className="q-title">{title}</div>
      <div className="q-desc">{desc}</div>
    </div>
  );
}
