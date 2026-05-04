"use client";

interface HeroArchitectureProps {
  agents?: { name: string; subtitle: string; color: string }[];
  ragLabel?: string;
  ragSubtitle?: string;
  ragBlocks?: string[];
  toolchainLabel?: string;
  toolchainSubtitle?: string;
  toolchainBlocks?: { name: string; subtitle: string; color: string }[];
}

const DEFAULT_AGENTS = [
  { name: "文档生成", subtitle: "FDS/SSTS 初稿", color: "#6b5ea0" },
  { name: "模型生成", subtitle: "UML/SysML 草稿", color: "#3d7fb8" },
  { name: "一致性校验", subtitle: "7 类冲突检测", color: "#1a7d62" },
  { name: "方案推荐", subtitle: "历史案例匹配", color: "#a07018" },
  { name: "知识检索", subtitle: "RAG 跨项目搜索", color: "#b85d6a" },
];

const DEFAULT_RAG_BLOCKS = ["文档预处理", "向量嵌入", "语义检索", "知识复用"];

const DEFAULT_TOOLCHAIN = [
  { name: "Groot-Arch", subtitle: "架构设计", color: "#a07018" },
  { name: "服务编排", subtitle: "组合服务", color: "#b85d6a" },
  { name: "服务仿真", subtitle: "验证测试", color: "#318a94" },
  { name: "DevOps", subtitle: "持续交付", color: "#4a8a5a" },
  { name: "观测运维", subtitle: "监控诊断", color: "#a07018" },
];

function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex || !hex.startsWith("#")) return `rgba(107,94,160,${alpha})`; // default violet
  const r = parseInt(hex.slice(1, 3), 16) || 107;
  const g = parseInt(hex.slice(3, 5), 16) || 94;
  const b = parseInt(hex.slice(5, 7), 16) || 160;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function HeroArchitecture({
  agents = DEFAULT_AGENTS,
  ragLabel = "RAG 知识库 · 数据底座",
  ragSubtitle = "私有化部署（本地化部署的大模型）",
  ragBlocks = DEFAULT_RAG_BLOCKS,
  toolchainLabel = "一体化工具链 · 数据源头",
  toolchainSubtitle = "各阶段产出结构化数据 → 沉淀至知识库",
  toolchainBlocks = DEFAULT_TOOLCHAIN,
}: HeroArchitectureProps) {
  return (
    <div className="topo-wrap ov-trigger">
      <svg viewBox="0 0 480 430" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lUp" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(138,92,15,.2)" />
            <stop offset="100%" stopColor="rgba(107,94,160,.2)" />
          </linearGradient>
          <linearGradient id="lDown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(107,94,160,.12)" />
            <stop offset="100%" stopColor="rgba(138,92,15,.1)" />
          </linearGradient>
        </defs>

        {/* Layer 3: AI Agent */}
        <rect x="10" y="10" width="460" height="130" rx="10" fill="rgba(107,94,160,.04)" stroke="rgba(107,94,160,.12)" />
        <text x="240" y="34" textAnchor="middle" fontSize="12" fill="#6b5ea0" fontWeight="700">AI Agent 智能层</text>

        {/* Agent row 1 */}
        {agents.slice(0, 3).map((a, i) => (
          <g key={`row1-${i}`}>
            <rect x={20 + i * 145} y="46" width="130" height="38" rx="6" fill={hexToRgba(a.color, 0.1)} stroke={hexToRgba(a.color, 0.18)} />
            <text x={85 + i * 145} y="62" textAnchor="middle" fontSize="10" fill={a.color} fontWeight="700">{a.name}</text>
            <text x={85 + i * 145} y="76" textAnchor="middle" fontSize="9.5" fill={hexToRgba(a.color, 0.5)}>{a.subtitle}</text>
          </g>
        ))}

        {/* Agent row 2 */}
        {agents.slice(3, 5).map((a, i) => (
          <g key={`row2-${i}`}>
            <rect x={100 + i * 150} y="92" width="130" height="38" rx="6" fill={hexToRgba(a.color, 0.1)} stroke={hexToRgba(a.color, 0.2)} />
            <text x={165 + i * 150} y="108" textAnchor="middle" fontSize="10" fill={a.color} fontWeight="700">{a.name}</text>
            <text x={165 + i * 150} y="122" textAnchor="middle" fontSize="9.5" fill={hexToRgba(a.color, 0.35)}>{a.subtitle}</text>
          </g>
        ))}

        {/* Arrow Agent->RAG */}
        <line x1="240" y1="140" x2="240" y2="172" stroke="rgba(107,94,160,.18)" strokeWidth="1.5" strokeDasharray="5,4" />
        <polygon points="234,168 240,178 246,168" fill="rgba(107,94,160,.2)" />

        {/* Layer 2: RAG */}
        <rect x="10" y="178" width="460" height="88" rx="10" fill="rgba(107,94,160,.05)" stroke="rgba(107,94,160,.2)" />
        <text x="240" y="200" textAnchor="middle" fontSize="12" fill="#6b5ea0" fontWeight="700">{ragLabel}</text>
        <text x="240" y="216" textAnchor="middle" fontSize="9.5" fill="rgba(107,94,160,.5)">{ragSubtitle}</text>

        {ragBlocks.map((block, i) => {
          const isCenter = i === 2;
          return (
            <g key={`rag-${i}`}>
              <rect x={30 + i * 105} y="226" width={i === 3 ? 110 : 95} height="28" rx="5"
                fill={isCenter ? "rgba(107,94,160,.10)" : "rgba(107,94,160,.07)"}
                stroke={isCenter ? "rgba(107,94,160,.18)" : "rgba(107,94,160,.10)"} />
              <text x={isCenter ? 287 : 77 + i * 105} y="244" textAnchor="middle" fontSize={isCenter ? 10 : 9.5}
                fill={isCenter ? "#6b5ea0" : "rgba(107,94,160,.7)"}
                fontWeight={isCenter ? 600 : 400}>{block}</text>
            </g>
          );
        })}

        {/* Arrow RAG->Toolchain */}
        <line x1="240" y1="266" x2="240" y2="300" stroke="url(#lUp)" strokeWidth="2" />
        <polygon points="234,296 240,306 246,296" fill="rgba(138,92,15,.25)" />

        {/* Layer 1: Toolchain */}
        <rect x="10" y="312" width="460" height="108" rx="10" fill="rgba(138,92,15,.04)" stroke="rgba(138,92,15,.12)" />
        <text x="240" y="335" textAnchor="middle" fontSize="12" fill="#a07018" fontWeight="700">{toolchainLabel}</text>
        <text x="240" y="350" textAnchor="middle" fontSize="9.5" fill="rgba(138,92,15,.35)">{toolchainSubtitle}</text>

        {/* 5 toolchain blocks */}
        {toolchainBlocks.map((tc, i) => {
          const blockWidths = [78, 72, 72, 72, 72];
          const positions = [16, 114, 206, 298, 390];
          const arrowPositions = [103, 195, 287, 379];
          return (
            <g key={`tc-${i}`}>
              {i > 0 && (
                <text x={arrowPositions[i - 1]} y="388" textAnchor="middle" fontSize="10" fill="rgba(0,0,0,.08)">→</text>
              )}
              <rect x={positions[i]} y="362" width={blockWidths[i]} height="46" rx="6"
                fill={hexToRgba(tc.color, 0.07)} stroke={hexToRgba(tc.color, 0.12)} />
              <text x={positions[i] + blockWidths[i] / 2} y="382" textAnchor="middle" fontSize="9.5" fill={tc.color} fontWeight="700">{tc.name}</text>
              <text x={positions[i] + blockWidths[i] / 2} y="398" textAnchor="middle" fontSize="9.5" fill={hexToRgba(tc.color, 0.35)}>{tc.subtitle}</text>
            </g>
          );
        })}
      </svg>
      <span className="ov-badge">↗ 点击展开架构详情</span>
    </div>
  );
}
