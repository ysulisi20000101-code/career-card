"use client";

interface PipelineStage {
  name: string;
  subtitle: string;
  bullets: string[];
  agentNote: string;
  color: string;
}

interface PipelineProps {
  stages?: PipelineStage[];
  agentLayerLabel?: string;
  ragLabel?: string;
  ragSubtitle?: string;
  embodiedLabel?: string;
  embodiedSubtitle?: string;
}

const DEFAULT_STAGES: PipelineStage[] = [
  {
    name: "Groot-Arch",
    subtitle: "架构设计 · 起点",
    bullets: ["需求 · 功能 · 系统", "软件 · 通信 · 诊断", "文档生成 · 模型生成"],
    agentNote: "文档生成 · 模型生成",
    color: "#a07018",
  },
  {
    name: "服务编排",
    subtitle: "服务场景建模",
    bullets: ["SOA · 原子服务重组", "方案推荐 Agent"],
    agentNote: "方案推荐 Agent",
    color: "#b85d6a",
  },
  {
    name: "服务仿真",
    subtitle: "云原生仿真引擎",
    bullets: ["AUTOSAR AP · DDS", "一致性校验 Agent"],
    agentNote: "一致性校验 Agent",
    color: "#318a94",
  },
  {
    name: "DevOps",
    subtitle: "自研 CI/CD 平台",
    bullets: ["需求/缺陷/代码一体化", "文档生成 · 知识检索"],
    agentNote: "文档生成 · 知识检索",
    color: "#4a8a5a",
  },
  {
    name: "观测运维",
    subtitle: "运行监控 · 全链路追踪",
    bullets: ["智能诊断 · OTA", "知识检索 Agent"],
    agentNote: "知识检索 Agent",
    color: "#a07018",
  },
];

export function PipelineSVG({
  stages = DEFAULT_STAGES,
  agentLayerLabel = "AI Agent + RAG 智能层 — 贯穿研发全生命周期",
  ragLabel = "RAG 知识库底座：各阶段数据沉淀 → 向量嵌入 → 语义检索 → 反哺 Agent",
  ragSubtitle = "私有化部署 · 跨项目复用 · 领域知识图谱",
  embodiedLabel = "具身智能延伸：观测运维平台 → 智能设备监控平台",
  embodiedSubtitle = "协作机器人 · 配送机器人 · 智能设备 — 同一套 Agent + RAG 基础架构跨行业落地",
}: PipelineProps) {
  return (
    <div className="pl-wrap mt12">
      <svg viewBox="0 0 1000 370" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="agentBar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(107,94,160,.5)" />
            <stop offset="100%" stopColor="rgba(107,94,160,.18)" />
          </linearGradient>
        </defs>

        {/* Lifecycle phase labels */}
        <rect x="40" y="8" width="920" height="22" rx="11" fill="rgba(107,94,160,.04)" />
        {stages.map((s, i) => {
          const x = 125 + i * 190;
          return (
            <text key={`label-${i}`} x={x} y="23" textAnchor="middle" fontSize="9.5" fill="#6b5ea0" fontWeight="700">{s.name}</text>
          );
        })}

        {/* Agent layer bar */}
        <rect x="40" y="38" width="920" height="24" rx="12" fill="url(#agentBar)" opacity=".6" />
        <text x="500" y="55" textAnchor="middle" fontSize="10.5" fill="#6b5ea0" fontWeight="700">{agentLayerLabel}</text>

        {/* Pipeline stages */}
        {stages.map((stage, i) => {
          const isFirst = i === 0;
          const widths = [170, 150, 150, 150, 150];
          const xPositions = [40, 250, 440, 630, 820];
          const arrowXPositions = [225, 415, 605, 795];
          const w = widths[i] ?? 150;
          const x = xPositions[i] ?? 40;
          const centerX = x + w / 2;

          return (
            <g key={`stage-${i}`}>
              {i > 0 && (
                <text x={arrowXPositions[i - 1]} y="133" textAnchor="middle" fontSize="18" fill="#5e6b7a">→</text>
              )}
              <rect x={x} y="83" width={w} height={isFirst ? 110 : 92} rx={isFirst ? 14 : 12}
                fill={`rgba(${hexToRgb(stage.color)},${isFirst ? 0.05 : 0.04})`}
                stroke={`rgba(${hexToRgb(stage.color)},${isFirst ? 0.4 : 0.25})`}
                strokeWidth={isFirst ? 1.5 : 1} />
              <text x={centerX} y={isFirst ? 103 : 113} textAnchor="middle" fontSize={isFirst ? 14 : 13}
                fill={stage.color} fontWeight={isFirst ? 900 : 700}>{stage.name}</text>
              <text x={centerX} y={isFirst ? 123 : 131} textAnchor="middle" fontSize="10" fill="#5e6b7a">{stage.subtitle}</text>
              {stage.bullets.map((b, bi) => (
                <text key={bi} x={centerX} y={(isFirst ? 141 : 148) + bi * 15} textAnchor="middle" fontSize="9.5"
                  fill={bi === stage.bullets.length - 1 ? "#6b5ea0" : "#495468"}>{b}</text>
              ))}
            </g>
          );
        })}

        {/* RAG base */}
        <rect x="40" y="203" width="920" height="50" rx="12" fill="rgba(107,94,160,.04)" stroke="rgba(107,94,160,.12)" strokeDasharray="4,4" />
        <text x="500" y="226" textAnchor="middle" fontSize="10" fill="rgba(107,94,160,.6)">{ragLabel}</text>
        <text x="500" y="242" textAnchor="middle" fontSize="9.5" fill="rgba(107,94,160,.30)">{ragSubtitle}</text>

        {/* Data flow arrows */}
        {[125, 325, 515, 705, 895].map((cx, i) => (
          <line key={`flow-${i}`} x1={cx} y1={i === 0 ? 184 : 175} x2={cx} y2="203" stroke="rgba(107,94,160,.18)" strokeWidth="1" />
        ))}

        {/* Embodied AI */}
        <rect x="40" y="278" width="920" height="50" rx="12" fill="rgba(184,93,106,.03)" stroke="rgba(184,93,106,.12)" />
        <text x="500" y="301" textAnchor="middle" fontSize="10" fill="#b85d6a" fontWeight="700">{embodiedLabel}</text>
        <text x="500" y="317" textAnchor="middle" fontSize="9.5" fill="rgba(184,93,106,.45)">{embodiedSubtitle}</text>
      </svg>
    </div>
  );
}

function hexToRgb(hex: string | undefined): string {
  if (!hex || !hex.startsWith("#")) return "107,94,160"; // default violet
  const r = parseInt(hex.slice(1, 3), 16) || 107;
  const g = parseInt(hex.slice(3, 5), 16) || 94;
  const b = parseInt(hex.slice(5, 7), 16) || 160;
  return `${r},${g},${b}`;
}
