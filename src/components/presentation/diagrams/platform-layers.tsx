"use client";

interface PlatformLayer {
  name: string;
  description: string;
  color: string;
}

interface PlatformLayersProps {
  layers?: PlatformLayer[];
  footer?: string;
}

const DEFAULT_LAYERS: PlatformLayer[] = [
  { name: "应用模块层", description: "需求管理 · 功能设计 · 系统设计 · 软件设计 · 通信设计 · 诊断设计（6 个模块共享平台底座）", color: "#8a5c0f" },
  { name: "平台服务层", description: "协同编辑 · 变更审批 · 版本管理 · 消息通知 · 操作审计 · 数据导入导出", color: "#6b5ea0" },
  { name: "认证与项目管理层", description: "用户认证 · 角色权限 · 部门组织 · 项目空间 · 多租户隔离", color: "#3d7fb8" },
  { name: "统一数据模型层", description: "跨模块数据关联 · 平台→车型→网段三级模型 · 结构化 Schema · API 标准化", color: "#1a7d62" },
  { name: "存储与基础设施层", description: "PostgreSQL · 对象存储 · Redis 缓存 · 向量数据库 · K8s 编排", color: "#1a1d27" },
];

export function PlatformLayers({ layers = DEFAULT_LAYERS, footer }: PlatformLayersProps) {
  return (
    <svg viewBox="0 0 800 340" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxHeight: 330 }}>
      {layers.map((layer, i) => {
        const y = 10 + i * 65;
        return (
          <g key={i}>
            <rect x="10" y={y} width="780" height="55" rx="10"
              fill={`${layer.color}0f`}
              stroke={`${layer.color}26`} />
            <text x="400" y={y + 22} textAnchor="middle" fontSize="12" fill={layer.color} fontWeight="700">{layer.name}</text>
            <text x="400" y={y + 40} textAnchor="middle" fontSize="10" fill="#5e6b7a">{layer.description}</text>
          </g>
        );
      })}
      <text x="400" y="332" textAnchor="middle" fontSize="9.5" fill="rgba(26,125,98,.45)">
        {footer ?? "平台层优先 → 6 模块上线快 2× → 结构化数据沉淀 → AI Agent 数据基础"}
      </text>
    </svg>
  );
}
