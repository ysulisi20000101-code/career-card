"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ChevronLeft, ChevronRight, Edit3, StickyNote, X } from "lucide-react";
import type { PresentationDraft, PresentationModule, PresentationModuleId, PresentationOverlay, PresentationSlide } from "@/lib/presentation/types";
import { buildSlideCoachBrief } from "@/lib/presentation/slide-coach";
import { savePresentationDraft } from "@/lib/presentation/storage";
import { getPresentationTheme } from "@/lib/presentation/themes";
import { getSlideRenderer } from "./slide-registry";
import { SlideContainer } from "./slide";
import { DeckEditor } from "./deck-editor";
import { AgentCoachPanel } from "./agent-coach-panel";
import { ErrorBoundary } from "@/components/error-boundary";
import { OverlayShell, AgentWorkflowOverlay, RagDetailOverlay, ConflictTypesOverlay, ArchDetailOverlay, PlatformDetailOverlay } from "../overlays";
import "@/components/presentation/styles/reference.css";

const SLIDE_ANIMATION_DURATION_MS = 500;
const NAV_LOCK_TIMEOUT_MS = SLIDE_ANIMATION_DURATION_MS + 120;

const FALLBACK_MODULES: PresentationModule[] = [
  { id: "self", label: "自我介绍", description: "职业主线与关键项目", defaultSlideId: "hero", keyboardShortcut: "1" },
];

function getSlideModuleId(slide: PresentationSlide): PresentationModuleId {
  return slide.moduleId ?? "self";
}

interface PresentationShellProps {
  draft: PresentationDraft;
  onExit: () => void;
  onDraftChange?: (previous: PresentationDraft, updated: PresentationDraft) => void;
  onActiveSlideChange?: (slide: PresentationSlide, index: number, total: number) => void;
  embedded?: boolean;
  displayMode?: "prepare" | "interview";
}

export function resolveOpenOverlayId(id: string, overlays: PresentationOverlay[]): string | null {
  return overlays.some((overlay) => overlay.id === id) ? id : null;
}

function OverlayContent({ overlay }: { overlay: PresentationOverlay }) {
  switch (overlay.kind) {
    case "agent-workflow":
      return <AgentWorkflowOverlay />;
    case "rag-detail":
      return <RagDetailOverlay />;
    case "conflict-types":
      return <ConflictTypesOverlay />;
    case "arch-detail":
      return <ArchDetailOverlay />;
    case "platform":
      return <PlatformDetailOverlay />;
    default:
      return (
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--t)", marginBottom: 6 }}>{overlay.title}</h3>
          <p style={{ color: "var(--t2)", fontSize: "12.5px", marginBottom: 16, whiteSpace: "pre-wrap" }}>{overlay.body}</p>
        </div>
      );
  }
}

export function PresentationShell({
  draft: initialDraft,
  onExit,
  onDraftChange,
  onActiveSlideChange,
  embedded = false,
  displayMode = "prepare",
}: PresentationShellProps) {
  const isInterviewMode = displayMode === "interview";
  const [draft, setDraft] = useState(initialDraft);
  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);
  const theme = useMemo(() => getPresentationTheme(draft.themeId), [draft.themeId]);
  const slides = useMemo(
    () => draft.slides.filter((s) => !s.hidden && getSlideModuleId(s) === "self"),
    [draft.slides],
  );
  const overlays = draft.overlays;
  const moduleDefs = useMemo(() => {
    const configured = draft.modules?.length ? draft.modules : FALLBACK_MODULES;
    const visibleModuleIds = new Set(slides.map(getSlideModuleId));
    const modules: PresentationModule[] = [];

    for (const moduleDef of configured) {
      if (visibleModuleIds.has(moduleDef.id) && !modules.some((item) => item.id === moduleDef.id)) {
        modules.push(moduleDef);
      }
    }

    for (const moduleId of visibleModuleIds) {
      if (!modules.some((item) => item.id === moduleId)) {
        modules.push(FALLBACK_MODULES.find((item) => item.id === moduleId) ?? { id: moduleId, label: moduleId });
      }
    }

    return modules;
  }, [draft.modules, slides]);
  const [activeModuleId, setActiveModuleId] = useState<PresentationModuleId>("self");
  const [current, setCurrent] = useState(0);
  const [locked, setLocked] = useState(false);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const touchStartRef = useRef(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const activeModule = moduleDefs.find((moduleDef) => moduleDef.id === activeModuleId) ?? moduleDefs[0];
  const effectiveModuleId = activeModule?.id ?? "self";
  const slideOrderLookup = useMemo(() => new Map(slides.map((slide, index) => [slide.id, index])), [slides]);
  const moduleSlides = useMemo(
    () =>
      slides
        .filter((slide) => getSlideModuleId(slide) === effectiveModuleId)
        .sort((a, b) => {
          const orderA = a.moduleOrder ?? slideOrderLookup.get(a.id) ?? 0;
          const orderB = b.moduleOrder ?? slideOrderLookup.get(b.id) ?? 0;
          return orderA - orderB;
        }),
    [effectiveModuleId, slideOrderLookup, slides],
  );
  const moduleSlidePositions = useMemo(
    () => new Map(moduleSlides.map((slide, index) => [slide.id, index])),
    [moduleSlides],
  );
  const total = moduleSlides.length;
  const safeCurrent = total > 0 ? Math.min(current, total - 1) : 0;

  const activeOverlay = useMemo(
    () => (activeOverlayId ? overlays.find((o) => o.id === activeOverlayId) ?? null : null),
    [activeOverlayId, overlays],
  );

  const goTo = useCallback(
    (index: number) => {
      if (index === safeCurrent || index < 0 || index >= total || locked || activeOverlay) return;
      setLocked(true);
      setCurrent(index);
      setTimeout(() => setLocked(false), NAV_LOCK_TIMEOUT_MS);
    },
    [safeCurrent, total, locked, activeOverlay],
  );

  const goNext = useCallback(() => goTo(safeCurrent + 1), [safeCurrent, goTo]);
  const goPrev = useCallback(() => goTo(safeCurrent - 1), [safeCurrent, goTo]);
  const switchModule = useCallback(
    (moduleId: PresentationModuleId) => {
      if (moduleId === effectiveModuleId || locked || activeOverlay) return;
      if (!moduleDefs.some((moduleDef) => moduleDef.id === moduleId)) return;
      setLocked(true);
      setActiveModuleId(moduleId);
      setCurrent(0);
      setTimeout(() => setLocked(false), NAV_LOCK_TIMEOUT_MS);
    },
    [activeOverlay, effectiveModuleId, locked, moduleDefs],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target;
      const targetElement = target instanceof HTMLElement ? target : null;
      const isTextInput =
        targetElement?.tagName === "INPUT" ||
        targetElement?.tagName === "TEXTAREA" ||
        targetElement?.isContentEditable;
      if (isTextInput) {
        if (e.key === "Escape" && showEditor) setShowEditor(false);
        return;
      }
      if (showEditor) {
        if (e.key === "Escape") setShowEditor(false);
        return;
      }
      if (e.key === "Escape") {
        if (activeOverlay) {
          setActiveOverlayId(null);
        } else if (showNotes) {
          setShowNotes(false);
        } else {
          onExit();
        }
      } else if (moduleDefs.some((moduleDef) => moduleDef.keyboardShortcut === e.key)) {
        e.preventDefault();
        const nextModule = moduleDefs.find((moduleDef) => moduleDef.keyboardShortcut === e.key);
        if (nextModule) switchModule(nextModule.id);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes((v) => !v);
      } else if (e.key === "a" || e.key === "A") {
        setShowCoach((v) => !v);
      }
    },
    [activeOverlay, onExit, goNext, goPrev, showNotes, showEditor, moduleDefs, switchModule],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    if (!embedded || isInterviewMode) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [embedded, handleKeyDown, isInterviewMode]);

  const openOverlay = useCallback((id: string) => {
    const nextOverlayId = resolveOpenOverlayId(id, overlays);
    if (nextOverlayId) setActiveOverlayId(nextOverlayId);
  }, [overlays]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0]?.clientX ?? 0;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartRef.current;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      }
    },
    [goNext, goPrev],
  );

  const handleDraftUpdate = useCallback((updated: PresentationDraft) => {
    setDraft((previous) => {
      onDraftChange?.(previous, updated);
      return updated;
    });
  }, [onDraftChange]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!draft) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePresentationDraft(draft);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draft]);

  const currentSlide = moduleSlides[safeCurrent];
  useEffect(() => {
    if (currentSlide) {
      onActiveSlideChange?.(currentSlide, safeCurrent, total);
    }
  }, [currentSlide, onActiveSlideChange, safeCurrent, total]);
  const hasNotes = currentSlide?.speakerNotes && currentSlide.speakerNotes.trim().length > 0;
  const activeModuleLabel = activeModule?.label;
  const coachBrief = useMemo(
    () => (currentSlide ? buildSlideCoachBrief(currentSlide, overlays, activeModuleLabel) : null),
    [activeModuleLabel, currentSlide, overlays],
  );
  const coachOpen = !isInterviewMode && showCoach && Boolean(coachBrief) && !showEditor;
  const rootPosition = embedded ? "absolute" : "fixed";
  const floatingPosition = embedded ? "absolute" : "fixed";

  if (total === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--t3)", fontSize: 14, fontFamily: "inherit" }}>
        所有幻灯片均已隐藏
        <button onClick={onExit} style={{ marginLeft: 16, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--t)", cursor: "pointer", fontSize: 12 }}>退出</button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`ps-root${embedded ? " ps-embedded" : ""}${isInterviewMode ? " ps-interview-mode" : ""}${coachOpen ? " coach-open" : ""}`}
        style={{
          position: rootPosition,
          inset: 0,
          overflow: "hidden",
          background: `radial-gradient(ellipse 80% 50% at 20% 0%, ${theme.colors.teal}06, transparent), radial-gradient(ellipse 60% 40% at 80% 100%, ${theme.colors.gold}06, transparent), var(--bg)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Module switcher */}
        {!isInterviewMode && moduleDefs.length > 1 && (
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 9px",
              borderRadius: 99,
              border: "1px solid rgba(0,0,0,.08)",
              background: "rgba(255,255,255,.48)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 1px 4px rgba(0,0,0,.03)",
            }}
            aria-label="面试空间模块"
          >
            {moduleDefs.map((moduleDef) => {
              const selected = moduleDef.id === effectiveModuleId;
              return (
                <button
                  key={moduleDef.id}
                  type="button"
                  onClick={() => switchModule(moduleDef.id)}
                  aria-pressed={selected}
                  aria-label={`${moduleDef.label}${moduleDef.keyboardShortcut ? ` (${moduleDef.keyboardShortcut})` : ""}`}
                  title={moduleDef.description ?? moduleDef.label}
                  style={{
                    width: selected ? 18 : 7,
                    height: 7,
                    minWidth: selected ? 18 : 7,
                    borderRadius: 99,
                    border: "none",
                    padding: 0,
                    background: selected ? "var(--gold-bright)" : "rgba(0,0,0,.2)",
                    cursor: selected ? "default" : "pointer",
                    opacity: selected ? 0.9 : 0.48,
                    transition: "all .24s ease",
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Top-right buttons */}
        {!isInterviewMode && (
          <div style={{ position: "absolute", right: 16, top: 16, zIndex: 100, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowCoach((v) => !v)}
              aria-label="Agent 教练"
              title="Agent 教练 (A)"
              style={{
                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", border: "1px solid var(--border-s)",
                background: showCoach ? "var(--violet-dim)" : "rgba(255,255,255,.73)",
                backdropFilter: "blur(8px)",
                color: showCoach ? "var(--violet)" : "var(--t3)", cursor: "pointer",
              }}
            >
              <Bot size={16} />
            </button>
            <button
              onClick={() => setShowNotes((v) => !v)}
              aria-label="演讲备注"
              title="演讲备注 (N)"
              style={{
                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", border: "1px solid var(--border-s)",
                background: showNotes ? "var(--gold-dim)" : "rgba(255,255,255,.73)",
                backdropFilter: "blur(8px)",
                color: showNotes ? "var(--gold-bright)" : "var(--t3)", cursor: "pointer",
              }}
            >
              <StickyNote size={16} />
            </button>
            <button
              onClick={() => setShowEditor(true)}
              aria-label="编辑演示稿"
              title="编辑演示稿"
              style={{
                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", border: "1px solid var(--border-s)",
                background: "rgba(255,255,255,.73)", backdropFilter: "blur(8px)",
                color: "var(--t3)", cursor: "pointer",
              }}
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={onExit}
              aria-label="退出演示"
              title="退出演示"
              style={{
                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", border: "1px solid var(--border-s)",
                background: "rgba(255,255,255,.73)", backdropFilter: "blur(8px)",
                color: "var(--t3)", cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Progress bar */}
        <div
          style={{
            position: floatingPosition,
            top: 0,
            left: 0,
            height: 3,
            width: `${((safeCurrent + 1) / total) * 100}%`,
            zIndex: 100,
            background: "linear-gradient(90deg, var(--violet), var(--gold-bright))",
            transition: "width .42s ease",
            borderRadius: "0 2px 2px 0",
            boxShadow: "0 0 8px rgba(107,94,160,.15)",
          }}
        />

        {/* Stage */}
        <ErrorBoundary>
          <div className="presentation-stage" style={{ position: "absolute", inset: 0 }}>
            {slides.map((slide) => {
              const modulePosition = moduleSlidePositions.get(slide.id);
              const position =
                modulePosition === undefined
                  ? "right"
                  : modulePosition < safeCurrent
                    ? "left"
                    : modulePosition > safeCurrent
                      ? "right"
                      : "active";
              const Renderer = getSlideRenderer(slide.kind);
              return (
                <SlideContainer
                  key={slide.id}
                  slide={slide}
                  overlays={overlays}
                  onOpenOverlay={openOverlay}
                  theme={theme}
                  position={position}
                >
                  <Renderer
                    slide={slide}
                    overlays={overlays}
                    onOpenOverlay={openOverlay}
                    theme={theme}
                  />
                </SlideContainer>
              );
            })}
          </div>
        </ErrorBoundary>

        {/* Nav arrows */}
        <button
          onClick={goPrev}
          disabled={safeCurrent === 0}
          aria-label="上一页"
          style={{
            position: floatingPosition, top: "50%", left: 6, zIndex: 90, transform: "translateY(-50%)",
            width: 32, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: safeCurrent === 0 ? "default" : "pointer", border: "none",
            background: "rgba(255,255,255,.55)", backdropFilter: "blur(8px)",
            color: "var(--t3)", borderRadius: 8,
            opacity: safeCurrent === 0 ? 0.15 : 1, transition: "all .25s",
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={goNext}
          disabled={safeCurrent === total - 1}
          aria-label="下一页"
          style={{
            position: floatingPosition, top: "50%", right: 6, zIndex: 90, transform: "translateY(-50%)",
            width: 32, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: safeCurrent === total - 1 ? "default" : "pointer", border: "none",
            background: "rgba(255,255,255,.55)", backdropFilter: "blur(8px)",
            color: "var(--t3)", borderRadius: 8,
            opacity: safeCurrent === total - 1 ? 0.15 : 1, transition: "all .25s",
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
          }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Dots */}
        <div
          style={{
            position: floatingPosition, bottom: !isInterviewMode && showNotes && hasNotes ? 120 : 16, left: "50%", zIndex: 90,
            transform: "translateX(-50%)", display: "flex", gap: 5, alignItems: "center",
            padding: "6px 14px", borderRadius: 99,
            background: "rgba(255,255,255,.65)", backdropFilter: "blur(8px)",
            border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
            transition: "bottom .3s ease",
          }}
        >
          {moduleSlides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              aria-label={`${activeModule?.label ?? "面试空间"}第 ${i + 1} 页`}
              style={{
                width: i === safeCurrent ? 18 : 6, height: 6,
                borderRadius: i === safeCurrent ? 99 : "50%",
                background: i === safeCurrent ? "var(--gold-bright)" : "rgba(0,0,0,.15)",
                boxShadow: i === safeCurrent ? "0 0 6px rgba(160,112,24,.3)" : "none",
                border: "none", padding: 0, cursor: "pointer", transition: "all .3s",
              }}
            />
          ))}
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--t3)", marginLeft: 6, fontWeight: 500, letterSpacing: ".04em" }}>
            {activeModule?.label ?? "面试空间"} {safeCurrent + 1} / {total}
          </span>
        </div>

        {coachOpen && coachBrief && (
          <AgentCoachPanel brief={coachBrief} onClose={() => setShowCoach(false)} />
        )}

        {/* Speaker notes panel */}
        <AnimatePresence>
          {!isInterviewMode && showNotes && hasNotes && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 80,
                background: "rgba(255,255,255,.93)", backdropFilter: "blur(12px)",
                borderTop: "1px solid var(--border)", padding: "14px 24px", maxHeight: 100, overflowY: "auto",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold-bright)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
                演讲备注
              </div>
              <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {currentSlide.speakerNotes}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ESC hint */}
        {!isInterviewMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1 }}
            style={{
              position: floatingPosition, bottom: 64, left: 16, fontSize: 10,
              color: "var(--t3)", letterSpacing: ".06em", pointerEvents: "none",
            }}
          >
            ESC 退出 · 方向键翻页 · 1/2/3 切换模块 · A Agent · N 备注
          </motion.div>
        )}

        {/* Print style */}
        <style>{`
          @media print {
            .ps-root { position: static !important; overflow: visible !important; }
            .ps-root .agent-coach-panel { display: none !important; }
            .ps-root .slide { position: static !important; opacity: 1 !important; transform: none !important; pointer-events: auto !important; page-break-after: always; min-height: 100vh; display: flex !important; align-items: center !important; justify-content: center !important; overflow: visible !important; }
            .ps-root .slide.left, .ps-root .slide.right { transform: none !important; opacity: 1 !important; }
          }
          @media screen and (min-width: 1180px) {
            .ps-root.coach-open .presentation-stage {
              right: 372px !important;
              transition: right .24s ease;
            }
          }
          .ps-root.ps-embedded .slide {
            padding: 52px 36px 64px;
          }
          .ps-root.ps-interview-mode .slide {
            padding-top: 48px;
          }
        `}</style>
      </div>

      {/* Overlay */}
      <OverlayShell open={!!activeOverlay} onClose={() => setActiveOverlayId(null)}>
        {activeOverlay ? <OverlayContent overlay={activeOverlay} /> : null}
      </OverlayShell>

      {/* Deck Editor */}
      {!isInterviewMode && showEditor && (
        <DeckEditor draft={draft} onUpdate={handleDraftUpdate} onClose={() => setShowEditor(false)} />
      )}
    </>
  );
}
