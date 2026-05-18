"use client";

import { Bot, MessageSquareText, Target, TimerReset, X } from "lucide-react";
import type { SlideCoachBrief } from "@/lib/presentation/slide-coach";

interface AgentCoachPanelProps {
  brief: SlideCoachBrief;
  onClose: () => void;
}

export function AgentCoachPanel({ brief, onClose }: AgentCoachPanelProps) {
  return (
    <aside
      className="agent-coach-panel"
      style={{
        position: "fixed",
        right: 16,
        top: 68,
        bottom: 78,
        zIndex: 95,
        width: "min(340px, calc(100vw - 32px))",
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "rgba(255,255,255,.88)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 8px 32px rgba(0,0,0,.08)",
        padding: 14,
        color: "var(--t)",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 850 }}>
          <Bot size={16} color="var(--violet)" />
          本页 Agent 教练
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭 Agent 教练"
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,.04)",
            color: "var(--t3)",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      </div>

      <section style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "var(--violet-dim)", border: "1px solid rgba(107,94,160,.14)" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--violet)", letterSpacing: ".08em", textTransform: "uppercase" }}>
          Purpose
        </div>
        <p style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.65, color: "var(--t2)" }}>{brief.purpose}</p>
      </section>

      <section style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(184,93,106,.07)", border: "1px solid rgba(184,93,106,.14)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 850, color: "var(--rose)" }}>
          <Target size={13} />
          100 分动作
        </div>
        <p style={{ marginTop: 7, fontSize: 12, lineHeight: 1.6, color: "var(--t2)" }}>{brief.fullScoreMove}</p>
      </section>

      <section style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 850, color: "var(--t)" }}>
          <MessageSquareText size={13} color="var(--gold-bright)" />
          推荐讲法
        </div>
        <div style={{ marginTop: 8, display: "grid", gap: 7 }}>
          {brief.talkTrack.map((item, index) => (
            <div
              key={`${item}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "18px 1fr",
                gap: 8,
                alignItems: "start",
                padding: "8px 9px",
                borderRadius: 9,
                background: "rgba(255,255,255,.72)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 900, color: "var(--gold-bright)" }}>{index + 1}</span>
              <span style={{ fontSize: 12, lineHeight: 1.55, color: "var(--t2)" }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "var(--gold-dim)", border: "1px solid rgba(160,112,24,.14)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 850, color: "var(--gold-bright)" }}>
          <TimerReset size={13} />
          60 秒压缩版
        </div>
        <p style={{ marginTop: 7, fontSize: 12, lineHeight: 1.6, color: "var(--t2)" }}>{brief.compressedVersion}</p>
      </section>

      <section style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 850, color: "var(--t)" }}>可能追问</div>
        <div style={{ marginTop: 8, display: "grid", gap: 7 }}>
          {brief.likelyQuestions.map((question, index) => (
            <div
              key={`${question}-${index}`}
              style={{
                padding: "8px 10px",
                borderRadius: 9,
                background: "rgba(250,250,250,.82)",
                border: "1px solid var(--border)",
                fontSize: 12,
                lineHeight: 1.55,
                color: "var(--t2)",
              }}
            >
              {question}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 12, padding: "9px 10px", borderRadius: 9, background: "rgba(184,93,106,.07)", border: "1px solid rgba(184,93,106,.14)" }}>
        <div style={{ fontSize: 10, fontWeight: 850, color: "var(--rose)", letterSpacing: ".08em", textTransform: "uppercase" }}>
          Watch out
        </div>
        <p style={{ marginTop: 5, fontSize: 12, lineHeight: 1.55, color: "var(--t2)" }}>{brief.caution}</p>
      </section>
    </aside>
  );
}
