"use client";

import type { PresentationTheme } from "@/lib/presentation/types";

interface VModelProps {
  data: Record<string, unknown>;
  theme: PresentationTheme;
}

export function VModelSVG({ data, theme }: VModelProps) {
  const allCovered = data.allCovered === true;
  const showGaps = data.showGaps === true;

  const designNodes = [
    { label: "需求管理", old: "IBM DOORS / Siemens Polarion", y: 40 },
    { label: "功能设计", old: "Sparx EA / PREEvision", y: 100 },
    { label: "系统设计", old: "PREEvision / SystemWeaver", y: 160 },
    { label: "软件设计", old: "EA / PREEvision", y: 220 },
    { label: "通信设计", old: "CANdb++（桌面单机）", y: 280 },
    { label: "诊断设计", old: "CANdelaStudio（桌面单机）", y: 340 },
  ];

  const testNodes = [
    { label: "验收测试", old: "CANoe / Indigo", y: 40 },
    { label: "系统测试", old: "CANoe / dSPACE", y: 100 },
    { label: "集成测试", old: "CANoe / TSMaster*", y: 160 },
    { label: "部件测试", old: "CANoe.DiVa", y: 220 },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox="0 0 1060 580" xmlns="http://www.w3.org/2000/svg" style={{ minWidth: 800, width: "100%", height: "auto", maxHeight: "60vh" }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* V-model lines */}
        <line x1="180" y1="28" x2="530" y2="468" stroke={`${theme.colors.text2}66`} strokeWidth="2.5" strokeDasharray="12,6" />
        <line x1="530" y1="468" x2="880" y2="28" stroke={`${theme.colors.text3}40`} strokeWidth="2" strokeDasharray="10,5" />
        <line x1="530" y1="468" x2="530" y2="548" stroke={`${theme.colors.amber}55`} strokeWidth="2" />

        {/* Design nodes (left) */}
        {designNodes.map((node) => {
          const isCovered = allCovered || (!showGaps && (node.label === "通信设计" || node.label === "诊断设计"));
          const hasGap = showGaps && node.label !== "通信设计" && node.label !== "诊断设计";
          const fillColor = isCovered ? `${theme.colors.teal}14` : `${theme.colors.text}08`;
          const strokeColor = isCovered ? `${theme.colors.teal}50` : `${theme.colors.text}14`;
          const labelColor = isCovered ? theme.colors.teal : theme.colors.text2;
          const subColor = isCovered ? `${theme.colors.teal}cc` : theme.colors.text3;

          return (
            <g key={node.label}>
              <rect x="30" y={node.y - 12} width="310" height="42" rx="8" fill={fillColor} stroke={strokeColor} />
              <text x="46" y={node.y + 6} fontSize="12" fill={labelColor} fontWeight="700" fontFamily="PingFang SC, sans-serif">{node.label}</text>
              <text x="46" y={node.y + 21} fontSize="10" fill={subColor} fontFamily="PingFang SC, sans-serif">{isCovered ? `Groot-Arch · ${node.old.split("/")[0]?.trim()}` : node.old}</text>
              {isCovered && (
                <>
                  <rect x="262" y={node.y - 2} width="72" height="22" rx="5" fill={`${theme.colors.teal}25`} />
                  <text x="298" y={node.y + 13} fontSize="9" fill={theme.colors.teal} textAnchor="middle" fontWeight="700" fontFamily="PingFang SC, sans-serif">国产 ✓</text>
                </>
              )}
              {hasGap && (
                <text x="265" y={node.y + 14} fontSize="10" fill={theme.colors.amber} fontFamily="PingFang SC, sans-serif">— 无国产替代</text>
              )}
            </g>
          );
        })}

        {/* Test nodes (right) */}
        {testNodes.map((node) => (
          <g key={node.label}>
            <rect x="740" y={node.y - 12} width="280" height="42" rx="8" fill={`${theme.colors.text}05`} stroke={`${theme.colors.text}0c`} />
            <text x="756" y={node.y + 6} fontSize="12" fill={theme.colors.text3} fontWeight="700" fontFamily="PingFang SC, sans-serif">{node.label}</text>
            <text x="756" y={node.y + 21} fontSize="10" fill={`${theme.colors.text3}90`} fontFamily="PingFang SC, sans-serif">{node.old}</text>
          </g>
        ))}

        {/* Platform box */}
        <rect x={allCovered ? "340" : "380"} y="505" width={allCovered ? "380" : "300"} height="45" rx="10" fill={`${theme.colors.amber}14`} stroke={`${theme.colors.amber}50`} />
        <text x="530" y="525" fontSize={allCovered ? 14 : 13} fill={theme.colors.amber} fontWeight="800" textAnchor="middle" fontFamily="PingFang SC, sans-serif" filter={allCovered ? "url(#glow)" : undefined}>
          {allCovered ? "Groot-Arch 架构协同平台 ✓" : "架构协同平台"}
        </text>
        <text x="530" y="541" fontSize="10" fill={allCovered ? `${theme.colors.teal}cc` : theme.colors.text3} textAnchor="middle" fontFamily="PingFang SC, sans-serif">
          {allCovered ? "Web 多人协同 · 云端 SaaS · 5 Agent + RAG 知识库" : "PREEvision / SystemWeaver 主导"}
        </text>

        {/* Labels */}
        <text x="185" y="12" fontSize={allCovered ? 14 : 13} fill={allCovered ? theme.colors.teal : theme.colors.text2} fontWeight="700" textAnchor="middle" fontFamily="PingFang SC, sans-serif">
          {allCovered ? "设计域 — 6/6 环节国产覆盖 + AI Agent 增强" : "设计域（左臂）"}
        </text>
        <text x="880" y="12" fontSize="13" fill={theme.colors.text3} fontWeight="700" textAnchor="middle" fontFamily="PingFang SC, sans-serif">测试域（右臂）</text>
        <text x="530" y="575" fontSize="11" fill={theme.colors.text3} textAnchor="middle" fontFamily="PingFang SC, sans-serif">V-Model of Automotive E/E Development</text>
      </svg>
    </div>
  );
}
