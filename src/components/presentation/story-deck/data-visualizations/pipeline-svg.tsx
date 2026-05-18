"use client";

import { useMemo } from "react";
import type { PresentationTheme } from "@/lib/presentation/types";

interface PipelineProps {
  theme: PresentationTheme;
  data?: Record<string, unknown>;
}

const DEFAULT_STAGES = [
  { label: "起点", name: "Groot-Arch", desc: "六大设计模块 · 统一数据模型", color: "gold", isCore: true },
  { label: "服务编排", name: "服务场景建模", desc: "SOA 服务编排 · AI 智能场景工程师", color: "rose" },
  { label: "仿真", name: "服务仿真平台", desc: "云原生引擎 · AUTOSAR AP / CyberRT", color: "cyan" },
  { label: "开发/交付", name: "自研 DevOps", desc: "CI/CD 与架构联动 · 多项目管理", color: "green" },
  { label: "运维", name: "观测运维平台", desc: "全链路追踪 · OTA · 具身智能延伸", color: "amber" },
];

const STAGE_WIDTH = 170;
const CORE_WIDTH = 200;
const ARROW_WIDTH = 36;

interface StageLayout {
  x: number;
  w: number;
  arrowX?: number;
}

export function PipelineSVG({ theme, data }: PipelineProps) {
  const colorMap: Record<string, string> = {
    gold: theme.colors.gold,
    teal: theme.colors.teal,
    violet: theme.colors.violet,
    blue: theme.colors.blue,
    amber: theme.colors.amber,
    rose: theme.colors.rose,
    green: theme.colors.green,
    cyan: theme.colors.cyan,
  };

  // Build stages from data if provided, otherwise use defaults
  const stageNames = (data?.stages as string[] | undefined) ?? [];
  const stages = stageNames.length > 0
    ? stageNames.map((name, i) => ({
        label: `阶段 ${i + 1}`,
        name,
        desc: "",
        color: ["gold", "rose", "cyan", "green", "amber"][i % 5]!,
        isCore: i === 0,
      }))
    : DEFAULT_STAGES;

  const layout = useMemo(() => {
    const positions: StageLayout[] = [];
    let x = 20;
    for (let i = 0; i < stages.length; i++) {
      const w = stages[i]!.isCore ? CORE_WIDTH : STAGE_WIDTH;
      const entry: StageLayout = { x, w };
      x += w;
      if (i < stages.length - 1) {
        entry.arrowX = x + ARROW_WIDTH / 2;
        x += ARROW_WIDTH;
      }
      positions.push(entry);
    }
    return positions;
  }, [stages]);

  const totalWidth = layout[layout.length - 1]!.x + layout[layout.length - 1]!.w + 20;
  const height = 160;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${totalWidth} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ minWidth: 700, width: "100%", height: "auto" }}>
        {stages.map((stage, i) => {
          const { x, w, arrowX } = layout[i]!;
          const color = colorMap[stage.color] ?? theme.colors.gold;
          const fillColor = stage.isCore ? `${color}10` : `${color}08`;
          const strokeColor = stage.isCore ? `${color}70` : `${color}40`;

          return (
            <g key={`${stage.name}-${i}`}>
              <rect x={x} y="20" width={w} height="120" rx="12" fill={fillColor} stroke={strokeColor} />
              <text x={x + w / 2} y="46" fontSize="9.5" fill={color} fontWeight="700" textAnchor="middle" letterSpacing=".08em" fontFamily="PingFang SC, sans-serif">{stage.label}</text>
              <text x={x + w / 2} y="68" fontSize={stage.isCore ? 15 : 14} fill={theme.colors.text} fontWeight={stage.isCore ? 900 : 800} textAnchor="middle" fontFamily="PingFang SC, sans-serif">{stage.name}</text>
              {stage.desc.split(" · ").map((line, li) => (
                <text key={li} x={x + w / 2} y={90 + li * 14} fontSize="10" fill={theme.colors.text3} textAnchor="middle" fontFamily="PingFang SC, sans-serif">{line}</text>
              ))}
              {arrowX !== undefined && (
                <text x={arrowX} y="80" fontSize="16" fill={theme.colors.text3} fontWeight="200" textAnchor="middle" fontFamily="PingFang SC, sans-serif">→</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
