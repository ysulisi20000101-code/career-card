"use client";

import { useCallback, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Pencil, X } from "lucide-react";
import type { PresentationDraft, PresentationSlide } from "@/lib/presentation/types";
import { getPresentationTheme } from "@/lib/presentation/themes";

interface DeckEditorProps {
  draft: PresentationDraft;
  onUpdate: (draft: PresentationDraft) => void;
  onClose: () => void;
}

export function DeckEditor({ draft, onUpdate, onClose }: DeckEditorProps) {
  const theme = getPresentationTheme(draft.themeId);
  const [editingSlide, setEditingSlide] = useState<PresentationSlide | null>(null);

  const updateSlide = useCallback(
    (slideId: string, patch: Partial<PresentationSlide>) => {
      const updated: PresentationDraft = {
        ...draft,
        slides: draft.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
        updatedAt: new Date().toISOString(),
      };
      onUpdate(updated);
      if (editingSlide?.id === slideId) {
        setEditingSlide({ ...editingSlide, ...patch });
      }
    },
    [draft, onUpdate, editingSlide],
  );

  const moveSlide = useCallback(
    (slideId: string, direction: -1 | 1) => {
      const idx = draft.slides.findIndex((s) => s.id === slideId);
      if (idx < 0) return;
      const target = idx + direction;
      if (target < 0 || target >= draft.slides.length) return;
      const newSlides = [...draft.slides];
      [newSlides[idx], newSlides[target]] = [newSlides[target]!, newSlides[idx]!];
      const updated: PresentationDraft = { ...draft, slides: newSlides, updatedAt: new Date().toISOString() };
      onUpdate(updated);
    },
    [draft, onUpdate],
  );

  const toggleHidden = useCallback(
    (slideId: string) => {
      updateSlide(slideId, { hidden: !draft.slides.find((s) => s.id === slideId)?.hidden });
    },
    [draft, updateSlide],
  );

  const visibleSlides = draft.slides.filter((s) => !s.hidden);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(92vw, 520px)",
          height: "100%",
          background: theme.colors.surface,
          borderLeft: `1px solid ${theme.colors.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${theme.colors.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.colors.text }}>编辑演示稿</div>
            <div style={{ fontSize: 11, color: theme.colors.text3, marginTop: 2 }}>{visibleSlides.length} / {draft.slides.length} 页可见</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", background: "transparent", color: theme.colors.text3, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Slide list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {draft.slides.map((slide, i) => {
            const isEditing = editingSlide?.id === slide.id;
            return (
              <div key={slide.id} style={{ marginBottom: 8, borderRadius: theme.radius.sm, border: `1px solid ${isEditing ? theme.colors.gold : theme.colors.border}`, background: slide.hidden ? `${theme.colors.text3}08` : theme.colors.bg, opacity: slide.hidden ? 0.5 : 1, transition: "all .2s" }}>
                {/* Slide row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: theme.colors.text3, minWidth: 20, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slide.title}</div>
                    <div style={{ fontSize: 10, color: theme.colors.text3, marginTop: 1 }}>{slide.kind}{slide.speakerNotes ? " · 有备注" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => setEditingSlide(isEditing ? null : slide)} title="编辑" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: isEditing ? theme.colors.goldDim : "transparent", color: isEditing ? theme.colors.gold : theme.colors.text3, cursor: "pointer" }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => toggleHidden(slide.id)} title={slide.hidden ? "显示" : "隐藏"} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: slide.hidden ? theme.colors.rose : theme.colors.text3, cursor: "pointer" }}>
                      {slide.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={() => moveSlide(slide.id, -1)} disabled={i === 0} title="上移" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: theme.colors.text3, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.3 : 1 }}>
                      <ChevronUp size={13} />
                    </button>
                    <button onClick={() => moveSlide(slide.id, 1)} disabled={i === draft.slides.length - 1} title="下移" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: theme.colors.text3, cursor: i === draft.slides.length - 1 ? "default" : "pointer", opacity: i === draft.slides.length - 1 ? 0.3 : 1 }}>
                      <ChevronDown size={13} />
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && editingSlide && (
                  <div style={{ padding: "0 12px 12px", borderTop: `1px solid ${theme.colors.border}`, marginTop: 0 }}>
                    <EditSlideForm slide={editingSlide} theme={theme} onChange={(patch) => updateSlide(slide.id, patch)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EditSlideForm({
  slide,
  theme,
  onChange,
}: {
  slide: PresentationSlide;
  theme: ReturnType<typeof getPresentationTheme>;
  onChange: (patch: Partial<PresentationSlide>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.colors.text3, textTransform: "uppercase", letterSpacing: ".08em" }}>标题</span>
        <input
          value={slide.title}
          onChange={(e) => onChange({ title: e.target.value })}
          style={{ padding: "6px 10px", border: `1px solid ${theme.colors.border}`, borderRadius: 6, background: theme.colors.bg, color: theme.colors.text, fontSize: 12, outline: "none" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.colors.text3, textTransform: "uppercase", letterSpacing: ".08em" }}>副标题</span>
        <input
          value={slide.subtitle ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value || undefined })}
          style={{ padding: "6px 10px", border: `1px solid ${theme.colors.border}`, borderRadius: 6, background: theme.colors.bg, color: theme.colors.text, fontSize: 12, outline: "none" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.colors.text3, textTransform: "uppercase", letterSpacing: ".08em" }}>正文</span>
        <textarea
          value={slide.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={3}
          style={{ padding: "6px 10px", border: `1px solid ${theme.colors.border}`, borderRadius: 6, background: theme.colors.bg, color: theme.colors.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.colors.text3, textTransform: "uppercase", letterSpacing: ".08em" }}>演讲备注</span>
        <textarea
          value={slide.speakerNotes ?? ""}
          onChange={(e) => onChange({ speakerNotes: e.target.value || undefined })}
          rows={2}
          placeholder="演讲时显示的私密备注..."
          style={{ padding: "6px 10px", border: `1px solid ${theme.colors.border}`, borderRadius: 6, background: theme.colors.bg, color: theme.colors.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.colors.text3, textTransform: "uppercase", letterSpacing: ".08em" }}>要点（每行一条）</span>
        <textarea
          value={slide.bullets.join("\n")}
          onChange={(e) => onChange({ bullets: e.target.value.split("\n").filter(Boolean) })}
          rows={Math.max(3, slide.bullets.length)}
          style={{ padding: "6px 10px", border: `1px solid ${theme.colors.border}`, borderRadius: 6, background: theme.colors.bg, color: theme.colors.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit" }}
        />
      </label>
    </div>
  );
}
