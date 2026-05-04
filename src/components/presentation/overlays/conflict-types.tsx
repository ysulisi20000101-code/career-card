"use client";

const CONFLICTS = [
  { title: "1. 功能触发条件冲突", desc: "同一信号触发互斥功能 · 触发逻辑互斥 · 优先级冲突 · 场景边界模糊 · 状态迁移冲突" },
  { title: "2. 功能执行时序冲突", desc: "启停时序颠倒 · 并行执行死锁 · 周期任务调度冲突 · 抢占超时 · 状态机死循环" },
  { title: "3. 网络通信资源冲突", desc: "CAN/LIN/Ethernet 信号 ID/周期/帧长度冲突 · 总线负载超限 · 仲裁冲突 · 路由不一致" },
  { title: "4. 供电与功耗冲突", desc: "电源模式冲突 · 多负载瞬时过流 · 功耗预算超限 · 热管理&用电策略冲突 · 高低压域逻辑冲突" },
  { title: "5. 功能安全与诊断冲突", desc: "ASIL/QM 资源抢占 · 故障诊断逻辑冲突 · 同一故障多个 DTC 重复判定 · 安全机制矛盾" },
  { title: "6. 多域/多控制器协同冲突", desc: "域控间功能定义不一致 · 接口不匹配 · 跨域信号同步/时钟不同步 · 数据一致性问题" },
  { title: "7. 定义完整性校验", desc: "文档重复定义（智驾/座舱等不同文档对同一功能定义不一致） · 功能定义缺失 · 性能指标未明确 · 接口定义缺失", fullWidth: true },
];

export function ConflictTypesOverlay() {
  return (
    <>
      <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--t)", marginBottom: 6 }}>一致性校验 Agent · 7 大类冲突场景</h3>
      <p style={{ color: "var(--t2)", fontSize: "12.5px", marginBottom: 16 }}>
        覆盖 50+ 子场景。人工比对上百页规范——不是效率问题，是可行性问题。
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CONFLICTS.map((c, i) => (
          <div
            key={i}
            style={{
              padding: 12,
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              background: "var(--surface)",
              gridColumn: c.fullWidth ? "1 / -1" : undefined,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 12, color: "var(--t)", marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: 10, color: "var(--t3)", lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}
