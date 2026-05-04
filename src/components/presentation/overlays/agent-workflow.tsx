"use client";

interface WorkflowStep {
  name: string;
  subtitle: string;
  detail: string;
  color: string;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  { name: "任务规划", subtitle: "用户意图理解+拆解", detail: "NL 理解→结构化任务列表", color: "#6b5ea0" },
  { name: "工具调用", subtitle: "Agent 调用平台原生 API", detail: "模型生成·文档读写·校验", color: "#3d7fb8" },
  { name: "多步执行", subtitle: "依序执行+中间校验", detail: "每步结果校验→失败回滚", color: "#1a7d62" },
  { name: "状态管理", subtitle: "上下文不中断", detail: "会话状态持久化", color: "#3d7fb8" },
  { name: "人工确认", subtitle: "产物预览·人做拍板", detail: "Diff 对比·逐项确认", color: "#8a5c0f" },
  { name: "结果归档", subtitle: "审计可追溯", detail: "知识库沉淀", color: "#6b5ea0" },
];

export function AgentWorkflowOverlay() {
  return (
    <>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--t)", marginBottom: 6 }}>受控式 Agent 工作流</h3>
      <p style={{ color: "var(--t2)", fontSize: "12.5px", marginBottom: 16 }}>
        工程产出必须可靠、可审计、可追溯——幻觉可能引发实车安全风险。Agent 不替代工程师决策权。
      </p>
      <svg viewBox="0 0 1020 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxHeight: 150 }}>
        <defs>
          <linearGradient id="owG" x1="0%" x2="100%">
            <stop offset="0%" stopColor="rgba(107,94,160,.4)" />
            <stop offset="100%" stopColor="rgba(107,94,160,.08)" />
          </linearGradient>
        </defs>
        <line x1="120" y1="44" x2="960" y2="44" stroke="url(#owG)" strokeWidth="2" />
        {DEFAULT_STEPS.map((step, i) => {
          const x = 10 + i * 180;
          const w = i === 5 ? 100 : 120;
          return (
            <g key={i}>
              <rect x={x} y="14" width={w} height="60" rx="10"
                fill={`${step.color}14`}
                stroke={`${step.color}33`} />
              <text x={x + w / 2} y="40" textAnchor="middle" fontSize="13" fill={step.color} fontWeight="700">{step.name}</text>
              <text x={x + w / 2} y="56" textAnchor="middle" fontSize="9.5" fill={`${step.color}80`}>{step.subtitle}</text>
              <text x={x + w / 2} y="88" textAnchor="middle" fontSize="9.5" fill="#5e6b7a">{step.detail}</text>
            </g>
          );
        })}
        <text x="510" y="130" textAnchor="middle" fontSize="10" fill="#b85d6a" fontWeight="600">
          每一步可审计、可中断、可回滚 · 设计灵感来自 AgentExecutor + Human-in-the-Loop，针对工程工具场景重构
        </text>
      </svg>
    </>
  );
}
