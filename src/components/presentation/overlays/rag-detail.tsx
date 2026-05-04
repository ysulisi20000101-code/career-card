"use client";

export function RagDetailOverlay() {
  return (
    <>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--t)", marginBottom: 6 }}>RAG 知识库 · 全链路数据流</h3>
      <p style={{ color: "var(--t2)", fontSize: "12.5px", marginBottom: 16 }}>
        全部私有化部署（本地化部署的大模型），满足军工、航天客户合规要求。知识库是所有 Agent 共享的唯一数据底座。
      </p>
      <svg viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxHeight: 290 }}>
        {/* Data Layer */}
        <rect x="20" y="16" width="200" height="268" rx="12" fill="rgba(0,0,0,.02)" stroke="rgba(0,0,0,.08)" />
        <text x="120" y="44" textAnchor="middle" fontSize="13" fill="#1a1d27" fontWeight="700">数据层</text>
        {[
          { y: 62, color: "#8a5c0f", text: "项目文档 (Word/PDF)" },
          { y: 102, color: "#6b5ea0", text: "架构模型 (UML/SysML)" },
          { y: 142, color: "#1a7d62", text: "设计规范 (SSTS/FDS)" },
          { y: 182, color: "#3d7fb8", text: "历史方案 & 变更记录" },
          { y: 222, color: "#5e6b7a", text: "工程元数据 & 日志", dim: true },
        ].map((item, i) => (
          <g key={`data-${i}`}>
            <rect x="40" y={item.y} width="160" height="30" rx="6"
              fill={`${item.color}12`}
              stroke={`${item.color}1f`} />
            <text x="120" y={item.y + 19} textAnchor="middle" fontSize="9.5" fill={item.color} fontWeight="600">{item.text}</text>
          </g>
        ))}
        <text x="120" y="272" textAnchor="middle" fontSize="9.5" fill="#5e6b7a">6 类工程数据源</text>

        {/* Arrow */}
        <polygon points="230,140 260,140 260,110 280,150 260,190 260,160 230,160" fill="rgba(107,94,160,.15)" stroke="rgba(107,94,160,.2)" />

        {/* Processing Layer */}
        <rect x="290" y="56" width="180" height="200" rx="12" fill="rgba(107,94,160,.04)" stroke="rgba(107,94,160,.15)" />
        <text x="380" y="84" textAnchor="middle" fontSize="13" fill="#6b5ea0" fontWeight="700">处理层</text>
        {["文档解析 & 语义切分", "向量嵌入", "增量更新管道", "质量校验 & 去重"].map((text, i) => (
          <g key={`proc-${i}`}>
            <rect x="310" y={102 + i * 36} width="140" height="28" rx="6" fill="rgba(107,94,160,.05)" stroke="rgba(107,94,160,.1)" />
            <text x="380" y={120 + i * 36} textAnchor="middle" fontSize="9.5" fill="#6b5ea0">{text}</text>
          </g>
        ))}

        {/* Arrow */}
        <polygon points="480,140 510,140 510,110 530,150 510,190 510,160 480,160" fill="rgba(107,94,160,.2)" stroke="rgba(107,94,160,.25)" />

        {/* Retrieval Layer */}
        <rect x="540" y="76" width="160" height="160" rx="12" fill="rgba(107,94,160,.08)" stroke="rgba(107,94,160,.2)" />
        <text x="620" y="104" textAnchor="middle" fontSize="13" fill="#6b5ea0" fontWeight="700">检索层</text>
        <rect x="560" y="122" width="120" height="32" rx="6" fill="rgba(107,94,160,.12)" stroke="rgba(107,94,160,.25)" />
        <text x="620" y="137" textAnchor="middle" fontSize="9.5" fill="#6b5ea0" fontWeight="700">向量语义检索</text>
        <text x="620" y="149" textAnchor="middle" fontSize="9.5" fill="#6b5ea0">召回率 &gt;85%（2000+ 文档评测）</text>
        {["关键词+语义混合", "重排序 (Rerank)"].map((text, i) => (
          <g key={`ret-${i}`}>
            <rect x="560" y={162 + i * 36} width="120" height="28" rx="6" fill="rgba(107,94,160,.05)" stroke="rgba(107,94,160,.1)" />
            <text x="620" y={180 + i * 36} textAnchor="middle" fontSize="9.5" fill="#6b5ea0">{text}</text>
          </g>
        ))}

        {/* Arrow */}
        <polygon points="710,140 740,140 740,110 760,150 740,190 740,160 710,160" fill="rgba(107,94,160,.22)" stroke="rgba(107,94,160,.28)" />

        {/* Application Layer */}
        <rect x="770" y="76" width="110" height="160" rx="12" fill="rgba(138,92,15,.05)" stroke="rgba(138,92,15,.12)" />
        <text x="825" y="104" textAnchor="middle" fontSize="13" fill="#8a5c0f" fontWeight="700">应用层</text>
        <text x="825" y="128" textAnchor="middle" fontSize="10" fill="#1a1d27" fontWeight="600">5 个 Agent</text>
        {["知识问答 / 方案推荐", "合规校验 / 智能诊断", "文档生成"].map((text, i) => (
          <text key={i} x="825" y={148 + i * 20} textAnchor="middle" fontSize="9.5" fill="#5e6b7a">{text}</text>
        ))}

        <text x="450" y="294" textAnchor="middle" fontSize="9.5" fill="#1a7d62" fontWeight="600">
          全部私有化部署 · 本地化部署的大模型 · 满足军工/航天客户合规红线
        </text>
      </svg>
    </>
  );
}
