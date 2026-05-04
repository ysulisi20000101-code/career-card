"use client";

interface FdCardProps {
  company: string;
  role: string;
  period?: string;
  items: string[];
  footer?: string;
  className?: string;
}

export function FdCard({ company, role, period, items, footer, className }: FdCardProps) {
  return (
    <div className={`fd-card${className ? ` ${className}` : ""}`}>
      <div className="fd-company">{company}</div>
      <div className="fd-role">
        {role}
        {period && <span> · {period}</span>}
      </div>
      {items.map((item, i) => (
        <div key={i} className="fd-item">
          {item}
        </div>
      ))}
      {footer && (
        <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 8, textAlign: "left" as const }}>
          ▶ {footer}
        </div>
      )}
    </div>
  );
}
