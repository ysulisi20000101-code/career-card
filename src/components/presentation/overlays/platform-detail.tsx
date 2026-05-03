"use client";

import { PlatformLayers } from "../diagrams/platform-layers";

export function PlatformDetailOverlay() {
  return (
    <>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--t)", marginBottom: 6 }}>平台基础设施 · 分层架构</h3>
      <p style={{ color: "var(--t2)", fontSize: "12.5px", marginBottom: 16 }}>
        平台层优先的核心决策：用户体系、权限模型、项目空间、消息通知、操作审计作为独立基础设施层。
      </p>
      <PlatformLayers />
    </>
  );
}
