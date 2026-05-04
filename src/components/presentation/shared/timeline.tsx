"use client";

export interface TimelineItem {
  time: string;
  text: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={`tl${className ? ` ${className}` : ""}`}>
      {items.map((item, i) => (
        <div key={i} className="tl-item">
          <div className="tl-time">{item.time}</div>
          <div className="tl-text">{item.text}</div>
        </div>
      ))}
    </div>
  );
}
