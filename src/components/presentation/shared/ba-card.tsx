"use client";

interface BaCardProps {
  variant: "before" | "after";
  items: string[];
  className?: string;
}

export function BaCard({ variant, items, className }: BaCardProps) {
  return (
    <div className={`ba-card ${variant}${className ? ` ${className}` : ""}`}>
      <div className="ba-label">{variant === "before" ? "BEFORE" : "AFTER"}</div>
      <div className="ba-item">
        {items.map((item, i) => (
          <span key={i}>
            {i > 0 && <br />}
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </span>
        ))}
      </div>
    </div>
  );
}
