"use client";

import type { PresentationSlide, PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";
import { Eyebrow } from "../../shared/eyebrow";
import { AccentCard } from "../../shared/accent-card";
import { AgentCard } from "../../shared/agent-card";
import { RagFlow } from "../../shared/rag-flow";
import { PhaseBadge } from "../../shared/phase-badge";

interface Props {
  slide: PresentationSlide;
  overlays: PresentationOverlay[];
  onOpenOverlay: (id: string) => void;
  theme: PresentationTheme;
}

interface AgentWorkflowItem {
  color: string;
  nameColor?: string;
  icon?: string;
  name: string;
  scene: string;
  metric: string;
}

interface RagBlockSpec {
  title: string;
  items: string;
  highlighted?: boolean;
}

const GENERIC_AGENT_CONFIGS: AgentWorkflowItem[] = [
  { color: "#6b5ea0", nameColor: "var(--violet)", icon: "doc", name: "问题定义 Agent", scene: "把目标岗位拆成表达任务", metric: "结构化输入" },
  { color: "#3d7fb8", nameColor: "var(--blue)", icon: "model", name: "证据整理 Agent", scene: "从简历抽取项目事实", metric: "事实可追溯" },
  { color: "#1a7d62", nameColor: "var(--teal)", icon: "check", name: "一致性校验 Agent", scene: "校验公司、指标、项目名", metric: "避免编造" },
  { color: "#a07018", nameColor: "var(--gold-bright)", icon: "search", name: "叙事编排 Agent", scene: "组织八页叙事节奏", metric: "表达可复用" },
  { color: "#b85d6a", nameColor: "var(--rose)", icon: "settings", name: "复盘优化 Agent", scene: "根据目标岗位调整表达", metric: "岗位导向" },
];

const AGENT_ICONS: Record<string, React.ReactNode> = {
  doc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="12" y2="14" />
    </svg>
  ),
  model: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12,2 22,8 12,14 2,8" />
      <polyline points="2,8 12,14 22,8" />
      <polyline points="2,8 2,16 12,22 22,16 22,8" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

export function AgentLeapSlide({ slide, onOpenOverlay }: Props) {
  const bullets = slide.bullets ?? [];
  const highlightCallouts = slide.highlightCallouts ?? [];
  const viz = slide.visualizations?.find((item) => item.type === "agent-workflow")?.data ?? slide.visualizations?.[0]?.data;
  const configItems = Array.isArray(viz?.agents) && viz.agents.length > 0
    ? (viz.agents as AgentWorkflowItem[])
    : GENERIC_AGENT_CONFIGS;
  const workflowLabel = typeof viz?.workflowLabel === "string" ? viz.workflowLabel : "受控 Agent 工作流";
  const workflowSteps = Array.isArray(viz?.workflowSteps) && viz.workflowSteps.length > 0
    ? (viz.workflowSteps as string[])
    : ["任务规划", "工具调用", "多步执行", "状态管理", "人工确认", "结果归档"];
  const ragBlocks = Array.isArray(viz?.ragBlocks) && viz.ragBlocks.length > 0
    ? (viz.ragBlocks as RagBlockSpec[])
    : [
        { title: "数据层", items: "简历事实 / 项目证据\n表达目标 / 确认事实" },
        { title: "处理层", items: "证据抽取 / 语义归类\n结构化蓝图生成" },
        { title: "校验层", items: "指标 / 公司 / 项目名校验", highlighted: true },
        { title: "表达层", items: "八页叙事 / 图形数据\n投屏表达" },
      ];
  const ragFooter = typeof viz?.ragFooter === "string" ? viz.ragFooter : "只使用简历和用户确认事实，避免生成不可追溯内容";
  const strategyInsight = typeof viz?.strategyInsight === "string"
    ? viz.strategyInsight
    : "Agent 的价值不在自由发挥，而在把目标、证据、结构和校验放进同一个受控流程。";
  const conflictLabel = typeof viz?.conflictLabel === "string" ? viz.conflictLabel : "校验场景";
  const conflictTypes = Array.isArray(viz?.conflictTypes) && viz.conflictTypes.length > 0
    ? (viz.conflictTypes as string[])
    : ["事实一致性", "指标可追溯", "项目名校验", "职业定位", "表达完整性"];

  // Parse agent bullets: "Label：Desc"
  const agentItems = bullets.map((b) => {
    const colonIdx = b.indexOf("：");
    return {
      label: colonIdx > 0 ? b.slice(0, colonIdx) : b,
      desc: colonIdx > 0 ? b.slice(colonIdx + 1) : "",
    };
  });

  return (
    <div>
      <Eyebrow label={slide.subtitle ?? "Phase 2 · 产品总监"} />
      <h2 className="h2">{slide.title}</h2>
      <p className="lead mt8">{slide.body}</p>

      {highlightCallouts.length > 0 && (
        <AccentCard variant="violet" className="mt10 fu">
          <strong>{highlightCallouts[0]?.title ?? "关键决策"}</strong>
          {highlightCallouts[0]?.body ? `：${highlightCallouts[0].body}` : ""}
        </AccentCard>
      )}

      {/* Agent workflow trigger */}
      <div
        className="ov-trigger fu"
        onClick={() => onOpenOverlay("ov-agent-workflow")}
        style={{ marginTop: 8, padding: "8px 14px", border: "1px dashed var(--border-s)", borderRadius: "var(--r)", background: "rgba(107,94,160,.03)", textAlign: "center" as const }}
      >
        <span style={{ fontWeight: 700, fontSize: 11, color: "var(--violet)" }}>{workflowLabel}</span>
        <span style={{ fontSize: "9.5px", color: "var(--t3)", marginLeft: 6 }}>{workflowSteps.join(" → ")}</span>
        <span style={{ fontSize: 8, color: "var(--violet)", marginLeft: 6, opacity: .5 }}>[展开详情]</span>
      </div>

      {/* Agent cards */}
      <div className="agent-cards mt10">
        {configItems.map((config, i) => (
          <AgentCard
            key={i}
            icon={AGENT_ICONS[config.icon ?? "doc"]}
            name={agentItems[i]?.label ?? config.name}
            scene={agentItems[i]?.desc ?? config.scene}
            metric={config.metric}
            color={config.color}
            nameColor={config.nameColor ?? config.color}
            className="fu"
          />
        ))}
      </div>

      {/* Conflict types trigger */}
      <div
        className="ov-trigger fu"
        onClick={() => onOpenOverlay("ov-conflict-types")}
        style={{ textAlign: "center" as const, marginTop: 5, fontSize: "9.5px", color: "var(--t3)" }}
      >
        <span style={{ color: "var(--teal)", fontWeight: 600 }}>{conflictLabel}：</span>
        {conflictTypes.join(" · ")} <span style={{ fontSize: 8, opacity: .5 }}>[详情]</span>
      </div>

      {/* RAG Flow */}
      <div
        className="ov-trigger fu"
        onClick={() => onOpenOverlay("ov-rag-detail")}
        style={{ marginTop: 16, padding: 16, border: "1px dashed rgba(107,94,160,.18)", borderRadius: "var(--r)", background: "rgba(107,94,160,.03)" }}
      >
        <div style={{ fontWeight: 700, color: "var(--violet)", fontSize: 11, marginBottom: 4 }}>
          {typeof viz?.ragLabel === "string" ? viz.ragLabel : "知识库 / 数据底座"} <span style={{ fontWeight: 400, fontSize: 9, color: "var(--t3)", marginLeft: 4 }}>[展开架构]</span>
        </div>
        <RagFlow
          blocks={ragBlocks}
          footer={ragFooter}
        />
      </div>

      {highlightCallouts.length === 0 && (
        <AccentCard className="mt10 fu">
          <strong>产品战略：</strong>{strategyInsight}
        </AccentCard>
      )}

      {(slide.phaseTag || slide.summaryLine) && (
        <div className="fu" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {slide.phaseTag && (
            <PhaseBadge variant="pm">{slide.phaseTag}</PhaseBadge>
          )}
          {slide.summaryLine && (
            <span style={{ fontSize: "10.5px", color: "var(--t3)" }}>{slide.summaryLine}</span>
          )}
        </div>
      )}
    </div>
  );
}
