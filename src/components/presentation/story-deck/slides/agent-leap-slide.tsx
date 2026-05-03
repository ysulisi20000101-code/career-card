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

const AGENT_CONFIGS = [
  { color: "#6b5ea0", nameColor: "var(--violet)", icon: "doc", name: "文档生成 Agent", scene: "FDS/SSTS 初稿自动生成", metric: "效率提升 50%+" },
  { color: "#3d7fb8", nameColor: "var(--blue)", icon: "model", name: "模型生成 Agent", scene: "UML/SysML 草稿生成", metric: "建模从天级到小时级" },
  { color: "#1a7d62", nameColor: "var(--teal)", icon: "check", name: "一致性校验 Agent", scene: "跨文档/模型自动校验", metric: "覆盖 50+ 子场景" },
  { color: "#a07018", nameColor: "var(--gold-bright)", icon: "search", name: "方案推荐 Agent", scene: "历史项目方案匹配", metric: "经验可检索可复用" },
  { color: "#b85d6a", nameColor: "var(--rose)", icon: "settings", name: "知识检索 Agent", scene: "跨项目知识统一检索", metric: "私有化部署·军工合规" },
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
  const hasOverlay = slide.overlayIds && slide.overlayIds.length > 0;
  const bullets = slide.bullets ?? [];
  const highlightCallouts = slide.highlightCallouts ?? [];

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
        <span style={{ fontWeight: 700, fontSize: 11, color: "var(--violet)" }}>受控式 Agent 工作流</span>
        <span style={{ fontSize: "9.5px", color: "var(--t3)", marginLeft: 6 }}>任务规划 → 工具调用 → 多步执行 → 状态管理 → 人工确认 → 结果归档</span>
        <span style={{ fontSize: 8, color: "var(--violet)", marginLeft: 6, opacity: .5 }}>[展开详情]</span>
      </div>

      {/* Agent cards */}
      <div className="agent-cards mt10">
        {AGENT_CONFIGS.map((config, i) => (
          <AgentCard
            key={i}
            icon={AGENT_ICONS[config.icon]}
            name={agentItems[i]?.label ?? config.name}
            scene={agentItems[i]?.desc ?? config.scene}
            metric={config.metric}
            color={config.color}
            nameColor={config.nameColor}
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
        <span style={{ color: "var(--teal)", fontWeight: 600 }}>7 类冲突场景：</span>
        功能触发 · 执行时序 · 网络通信 · 供电功耗 · 功能安全 · 多域协同 · 定义完整性 <span style={{ fontSize: 8, opacity: .5 }}>[详情]</span>
      </div>

      {/* RAG Flow */}
      <div
        className="ov-trigger fu"
        onClick={() => onOpenOverlay("ov-rag-detail")}
        style={{ marginTop: 16, padding: 16, border: "1px dashed rgba(107,94,160,.18)", borderRadius: "var(--r)", background: "rgba(107,94,160,.03)" }}
      >
        <div style={{ fontWeight: 700, color: "var(--violet)", fontSize: 11, marginBottom: 4 }}>
          RAG 知识库 · 数据底座 <span style={{ fontWeight: 400, fontSize: 9, color: "var(--t3)", marginLeft: 4 }}>[展开架构]</span>
        </div>
        <RagFlow
          blocks={[
            { title: "数据层", items: "项目文档 · 架构模型\n设计规范 · 历史方案" },
            { title: "处理层", items: "文档解析 · 语义切分\n向量嵌入 · 增量更新" },
            { title: "检索层", items: "向量语义检索\n召回率 >85%\n2000+ 工程文档评测", highlighted: true },
            { title: "应用层", items: "5 个 Agent 调用\n合规校验 · 知识问答" },
          ]}
          footer="全部私有化部署（本地化部署的大模型）· 军工/航天合规 · 跨项目知识复用"
        />
      </div>

      <AccentCard className="mt10 fu">
        <strong>产品战略：</strong>不做 ChatGPT 套壳。Agent 有效性取决于知识库质量，知识库质量取决于平台数据结构化程度。<strong>没有统一平台数据模型 → 没有高质量知识库 → Agent 只是 LLM 搜索框。</strong>
      </AccentCard>

      {hasOverlay && (
        <div className="fu" style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {slide.overlayIds!.map((oid) => {
            return (
              <button
                key={oid}
                onClick={() => onOpenOverlay(oid)}
                style={{ padding: "8px 14px", border: "1px dashed rgba(107,94,160,.25)", borderRadius: "var(--r)", background: "var(--violet-dim)", fontSize: 11, color: "var(--violet)", fontWeight: 700, cursor: "pointer" }}
              >
                查看详情 ↗
              </button>
            );
          })}
        </div>
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
