"use client";

interface DomainTagProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DomainTag({ children, className, style }: DomainTagProps) {
  return (
    <div className={`dt${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}
