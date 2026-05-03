"use client";

export function ArchDetailOverlay() {
  return (
    <>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--t)", marginBottom: 6 }}>Groot-Arch 一体化架构 · 三层体系</h3>
      <p style={{ color: "var(--t2)", fontSize: "12.5px", marginBottom: 16 }}>
        工具链作为数据源头 → RAG 知识库作为数据底座 → AI Agent 作为智能层。数据单向沉淀，智能双向调用。
      </p>
      <svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxHeight: 440 }}>
        {/* Agent Layer */}
        <rect x="10" y="10" width="880" height="130" rx="12" fill="rgba(107,94,160,.04)" stroke="rgba(107,94,160,.12)" />
        <text x="450" y="34" textAnchor="middle" fontSize="14" fill="#6b5ea0" fontWeight="800">AI Agent 智能层</text>
        {[
          { x: 20, color: "#6b5ea0", name: "文档生成 Agent", sub: "FDS/SSTS 初稿" },
          { x: 195, color: "#3d7fb8", name: "模型生成 Agent", sub: "UML/SysML 草稿" },
          { x: 370, color: "#1a7d62", name: "一致性校验 Agent", sub: "7 类冲突检测" },
          { x: 545, color: "#8a5c0f", name: "方案推荐 Agent", sub: "历史案例匹配" },
          { x: 720, color: "#b85d6a", name: "知识检索 Agent", sub: "RAG 跨项目搜索" },
        ].map((a) => (
          <g key={a.name}>
            <rect x={a.x} y="50" width="160" height="38" rx="8" fill={`${a.color}1a`} stroke={`${a.color}33`} />
            <text x={a.x + 80} y="66" textAnchor="middle" fontSize="10.5" fill={a.color} fontWeight="700">{a.name}</text>
            <text x={a.x + 80} y="80" textAnchor="middle" fontSize="9.5" fill={`${a.color}80`}>{a.sub}</text>
          </g>
        ))}
        <text x="450" y="112" textAnchor="middle" fontSize="9.5" fill="#5e6b7a">任务规划 → 工具调用 → 多步执行 → 状态管理 → 人工确认 → 结果归档</text>
        <text x="450" y="128" textAnchor="middle" fontSize="9.5" fill="rgba(107,94,160,.4)">私有化部署 · 本地化部署的大模型 · 审计可追溯 · 人工最终确认</text>

        {/* Arrow */}
        <line x1="450" y1="140" x2="450" y2="170" stroke="rgba(107,94,160,.25)" strokeWidth="2" />
        <polygon points="442,165 450,180 458,165" fill="rgba(107,94,160,.25)" />

        {/* RAG Layer */}
        <rect x="10" y="180" width="880" height="100" rx="12" fill="rgba(107,94,160,.05)" stroke="rgba(107,94,160,.18)" />
        <text x="450" y="204" textAnchor="middle" fontSize="14" fill="#6b5ea0" fontWeight="800">RAG 知识库 · 数据底座</text>
        {[
          { x: 30, label: "文档预处理 & 语义切分", hl: false },
          { x: 240, label: "向量嵌入 & 增量更新", hl: false },
          { x: 450, label: "向量语义检索 · 召回&gt;85%", hl: true },
          { x: 660, label: "重排序 & 上下文组装", hl: false },
        ].map((b) => (
          <g key={b.label}>
            <rect x={b.x} y="220" width="195" height="30" rx="6"
              fill={b.hl ? "rgba(107,94,160,.10)" : "rgba(107,94,160,.06)"}
              stroke={b.hl ? "rgba(107,94,160,.18)" : "rgba(107,94,160,.12)"} />
            <text x={b.x + 97} y="239" textAnchor="middle" fontSize="9.5" fill="#6b5ea0" fontWeight={b.hl ? 700 : 400}>{b.label}</text>
          </g>
        ))}
        <text x="450" y="272" textAnchor="middle" fontSize="9.5" fill="rgba(26,125,98,.45)">全部私有化部署 · 本地化部署的大模型 · 军工/航天合规</text>

        {/* Arrow */}
        <line x1="450" y1="280" x2="450" y2="310" stroke="rgba(138,92,15,.25)" strokeWidth="2" />
        <polygon points="442,305 450,320 458,305" fill="rgba(138,92,15,.25)" />

        {/* Toolchain Layer */}
        <rect x="10" y="320" width="880" height="110" rx="12" fill="rgba(138,92,15,.04)" stroke="rgba(138,92,15,.12)" />
        <text x="450" y="344" textAnchor="middle" fontSize="14" fill="#8a5c0f" fontWeight="800">一体化工具链 · 结构化数据源头</text>
        {[
          { x: 20, w: 150, color: "#8a5c0f", name: "Groot-Arch", sub: "6 模块架构设计" },
          { label: "→" },
          { x: 192, w: 150, color: "#b85d6a", name: "服务编排", sub: "原子→组合服务" },
          { label: "→" },
          { x: 364, w: 150, color: "#318a94", name: "服务仿真", sub: "低代码验证" },
          { label: "→" },
          { x: 536, w: 150, color: "#4a8a5a", name: "DevOps", sub: "持续交付" },
          { label: "→" },
          { x: 708, w: 150, color: "#8a5c0f", name: "观测运维", sub: "监控 & 诊断" },
        ].map((item, i) => {
          if ("label" in item) {
            return <text key={i} x={177 + i * 172 - 172} y="384" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,.1)">→</text>;
          }
          return (
            <g key={i}>
              <rect x={item.x} y="362" width={item.w} height="38" rx="8"
                fill={`${item.color}0f`} stroke={`${item.color}26`} />
              <text x={item.x + item.w / 2} y="379" textAnchor="middle" fontSize="10.5" fill={item.color} fontWeight="700">{item.name}</text>
              <text x={item.x + item.w / 2} y="393" textAnchor="middle" fontSize="10" fill={`${item.color}73`}>{item.sub}</text>
            </g>
          );
        })}
        <text x="450" y="424" textAnchor="middle" fontSize="9.5" fill="#5e6b7a">各阶段产出 → 沉淀至知识库 → Agent 检索调用 → 反哺设计决策</text>
      </svg>
    </>
  );
}
