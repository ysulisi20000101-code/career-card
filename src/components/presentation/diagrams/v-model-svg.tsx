"use client";

interface VModelNode {
  name: string;
  tool: string;
  domestic?: boolean;
  color?: string; // override color
}

interface VModelProps {
  variant?: "monopoly" | "complete";
  designNodes?: VModelNode[];
  testNodes?: VModelNode[];
  platformName?: string;
  platformSubtitle?: string;
  designLabel?: string;
  testLabel?: string;
  caption?: string;
}

const DEFAULT_DESIGN_NODES_MONOPOLY: VModelNode[] = [
  { name: "需求管理", tool: "IBM DOORS / Siemens Polarion" },
  { name: "功能设计", tool: "Sparx EA / PREEvision" },
  { name: "系统设计", tool: "PREEvision / SystemWeaver" },
  { name: "软件设计", tool: "EA / PREEvision" },
  { name: "通信设计", tool: "CANdb++（桌面单机）", domestic: true },
  { name: "诊断设计", tool: "CANdelaStudio（桌面单机）", domestic: true },
];

const DEFAULT_TEST_NODES_MONOPOLY: VModelNode[] = [
  { name: "仿真验证", tool: "HIL / SIL / 服务仿真", color: "#318a94" },
  { name: "验收测试", tool: "CANoe / Indigo" },
  { name: "系统测试", tool: "CANoe / dSPACE" },
  { name: "集成测试", tool: "CANoe / TSMaster*" },
  { name: "部件测试", tool: "CANoe.DiVa" },
];

const DEFAULT_DESIGN_NODES_COMPLETE: VModelNode[] = [
  { name: "需求管理", tool: "Groot-Arch · Web 协同 · AI 文档生成", domestic: true },
  { name: "功能设计", tool: "Groot-Arch · Web 协同 · AI 模型生成", domestic: true },
  { name: "系统设计", tool: "Groot-Arch · Web 协同 · AI 方案推荐", domestic: true },
  { name: "软件设计", tool: "Groot-Arch · Web 协同 · AI 一致性校验", domestic: true },
  { name: "通信设计", tool: "VDE Cloud · 一汽红旗 · AI 辅助配置", domestic: true },
  { name: "诊断设计", tool: "诊断参数系统 · 广汽集团 · AI 辅助配置", domestic: true },
];

const DEFAULT_TEST_NODES_COMPLETE: VModelNode[] = [
  { name: "仿真验证", tool: "Agent 赋能进行中 · 框架已就绪", color: "#318a94" },
  { name: "验收测试", tool: "Agent 赋能进行中 · 框架已就绪", color: "#6b5ea0" },
  { name: "系统测试", tool: "Agent 赋能进行中 · 框架已就绪", color: "#6b5ea0" },
  { name: "集成测试", tool: "Agent 赋能进行中 · 框架已就绪", color: "#6b5ea0" },
  { name: "部件测试", tool: "Agent 赋能进行中 · 框架已就绪", color: "#6b5ea0" },
];

export function VModelSVG({
  variant = "monopoly",
  designNodes,
  testNodes,
  platformName,
  platformSubtitle,
  designLabel,
  testLabel,
  caption,
}: VModelProps) {
  const isComplete = variant === "complete";
  const dNodes = designNodes ?? (isComplete ? DEFAULT_DESIGN_NODES_COMPLETE : DEFAULT_DESIGN_NODES_MONOPOLY);
  const tNodes = testNodes ?? (isComplete ? DEFAULT_TEST_NODES_COMPLETE : DEFAULT_TEST_NODES_MONOPOLY);

  const leftArmColor = isComplete ? "rgba(26,125,98,0.4)" : "rgba(138,153,170,0.35)";
  const rightArmColor = isComplete ? "rgba(107,94,160,0.2)" : "rgba(85,98,112,0.2)";
  const leftArmWidth = isComplete ? 3 : 2.5;
  const designColor = isComplete ? "#1a7d62" : "#495468";
  const testColorDefault = isComplete ? "#6b5ea0" : "#5e6b7a";

  return (
    <div className="v-wrap mt10">
      <svg viewBox="0 0 1060 580" xmlns="http://www.w3.org/2000/svg">
        {isComplete && (
          <defs>
            <filter id="g2">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}

        {/* V lines */}
        <line x1="180" y1="48" x2="530" y2="430" stroke={leftArmColor} strokeWidth={leftArmWidth} strokeDasharray="12,6" />
        <line x1="530" y1="430" x2="880" y2="48" stroke={rightArmColor} strokeWidth="2" strokeDasharray="10,5" />
        <line x1="530" y1="430" x2="530" y2="545" stroke="rgba(138,92,15,.4)" strokeWidth={isComplete ? 2.5 : 2} />

        {/* Design nodes (left arm) */}
        {dNodes.map((node, i) => {
          const y = 24 + i * 76;
          const isDomestic = node.domestic;
          const nodeColor = node.color ?? (isDomestic ? "#1a7d62" : designColor);

          const bgAlpha = isDomestic ? (isComplete ? 0.10 : 0.06) : 0.02;
          const strokeAlpha = isDomestic ? (isComplete ? 0.3 : 0.2) : 0.06;
          const blockWidth = isComplete ? 320 : 310;

          return (
            <g key={`design-${i}`}>
              <rect x="30" y={y} width={blockWidth} height="52" rx="8"
                fill={`rgba(${isDomestic ? "26,125,98" : "0,0,0"},${bgAlpha})`}
                stroke={`rgba(${isDomestic ? "26,125,98" : "0,0,0"},${strokeAlpha})`} />
              <text x="46" y={y + 20} fontSize="12" fill={nodeColor} fontWeight="700"
                filter={isDomestic && isComplete ? "url(#g2)" : undefined}>{node.name}</text>
              <text x="46" y={y + 36} fontSize="10.5" fill={isDomestic ? nodeColor : "#5e6b7a"}>{node.tool}</text>
              {isDomestic && (
                <>
                  <rect x={isComplete ? 270 : 300} y={y + 10} width={isComplete ? 72 : 32} height={isComplete ? 20 : 18} rx={isComplete ? 5 : 4}
                    fill={isComplete ? "rgba(26,125,98,.16)" : "rgba(26,125,98,.16)"} />
                  <text x={isComplete ? 306 : 316} y={y + (isComplete ? 24 : 23)} fontSize={isComplete ? 10 : 9.5} fill="#1a7d62"
                    textAnchor="middle" fontWeight="700">国产 ✓</text>
                </>
              )}
            </g>
          );
        })}

        {/* Test nodes (right arm) */}
        {tNodes.map((node, i) => {
          const yPositions = [24, 88, 164, 240, 316];
          const y = yPositions[i] ?? 24;
          const nodeColor = node.color ?? testColorDefault;
          const isColored = !!node.color;

          return (
            <g key={`test-${i}`}>
              <rect x="720" y={y} width="310" height="52" rx="8"
                fill={isColored ? `rgba(${nodeColor === "#318a94" ? "49,138,148" : "107,94,160"},${isComplete ? 0.1 : 0.06})` : "rgba(0,0,0,0.02)"}
                stroke={isColored ? `rgba(${nodeColor === "#318a94" ? "49,138,148" : "107,94,160"},${isComplete ? 0.25 : 0.2})` : "rgba(0,0,0,0.05)"} />
              <text x="736" y={y + 20} fontSize="12" fill={nodeColor} fontWeight="700">{node.name}</text>
              <text x="736" y={y + 36} fontSize="10.5" fill={isColored ? hexToRgba(nodeColor, isComplete ? 0.6 : 0.5) : "#5e6b7a"}>{node.tool}</text>
            </g>
          );
        })}

        {/* Bottom platform */}
        <rect x={isComplete ? 300 : 340} y="515" width={isComplete ? 460 : 380} height="42"
          rx={isComplete ? 10 : 8}
          fill={isComplete ? "rgba(138,92,15,0.12)" : "rgba(138,92,15,0.06)"}
          stroke={isComplete ? "rgba(138,92,15,0.45)" : "rgba(138,92,15,0.25)"} />
        <text x="530" y="536" fontSize={isComplete ? 14 : 12.5} fill="#a07018"
          fontWeight={isComplete ? 900 : 800} textAnchor="middle"
          filter={isComplete ? "url(#g2)" : undefined}>
          {platformName ?? (isComplete ? "Groot-Arch 架构协同平台 ✓" : "架构协同平台")}
        </text>
        <text x="530" y="550" fontSize="10" fill={isComplete ? "#1a7d62" : "#5e6b7a"} textAnchor="middle">
          {platformSubtitle ?? (isComplete ? "云原生 · 5 Agent · RAG 知识库 · 统一数据模型" : "PREEvision / SystemWeaver 主导 · 桌面单机 · 零 AI")}
        </text>
        {isComplete && (
          <text x="530" y="564" fontSize="9.5" fill="#5e6b7a" textAnchor="middle">测试域 Agent 已在 2 个节点完成 POC，4 个节点规划中</text>
        )}

        {/* Labels */}
        <text x={isComplete ? 190 : 185} y="10" fontSize={isComplete ? 13.5 : 12.5}
          fill={designColor} fontWeight={isComplete ? 800 : 700} textAnchor="middle">
          {designLabel ?? (isComplete ? "设计域 — 6/6 环节国产覆盖 + AI Agent 增强" : "设计域（左臂）")}
        </text>
        <text x="875" y="10" fontSize={isComplete ? 12.5 : 12.5}
          fill={testColorDefault} fontWeight="700" textAnchor="middle">
          {testLabel ?? (isComplete ? "测试域 — Agent 赋能进行中 · 框架已就绪" : "测试域（右臂）")}
        </text>
      </svg>
      {caption && (
        <div style={{ fontSize: "10.5px", color: "var(--t3)", textAlign: "center", marginTop: 4 }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex || !hex.startsWith("#")) return `rgba(107,94,160,${alpha})`; // default violet
  const r = parseInt(hex.slice(1, 3), 16) || 107;
  const g = parseInt(hex.slice(3, 5), 16) || 94;
  const b = parseInt(hex.slice(5, 7), 16) || 160;
  return `rgba(${r},${g},${b},${alpha})`;
}
