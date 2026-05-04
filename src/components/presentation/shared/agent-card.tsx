"use client";

import type { ReactNode } from "react";

interface AgentCardProps {
  icon: ReactNode;
  name: string;
  scene: string;
  metric: string;
  color: string;
  nameColor: string;
  className?: string;
}

export function AgentCard({ icon, name, scene, metric, color, nameColor, className }: AgentCardProps) {
  return (
    <div
      className={`a-card${className ? ` ${className}` : ""}`}
      style={{ "--agent-color": color } as React.CSSProperties}
    >
      <div className="a-icon" style={{ background: `${color}1a` }}>
        {icon}
      </div>
      <div className="a-name" style={{ color: nameColor }}>
        {name}
      </div>
      <div className="a-scene">{scene}</div>
      <div className="a-metric">{metric}</div>
    </div>
  );
}
