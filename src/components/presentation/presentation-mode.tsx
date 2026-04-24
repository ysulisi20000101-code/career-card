"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { TimelineSlide } from "@/components/timeline/timeline-slide";
import SkillMapView from "@/components/skillmap/skill-map-view";
import ArchitectureView from "@/components/architecture/architecture-view";
import { RoleUnderstandingView } from "@/components/role-understanding/role-understanding-view";
import { Button } from "@/components/ui/button";
import { getOrderedTimeline, getSafeTimelineIndex } from "@/lib/timeline/order";

interface PresentationModeProps {
  includeRoleSections?: boolean;
}

export function PresentationMode({ includeRoleSections = false }: PresentationModeProps) {
  const isPresenting = useResumeStore((s) => s.isPresenting);
  const setIsPresenting = useResumeStore((s) => s.setIsPresenting);
  const resumeData = useResumeStore((s) => s.resumeData);
  const activeTimelineId = useResumeStore((s) => s.activeTimelineId);
  const setActiveTimelineId = useResumeStore((s) => s.setActiveTimelineId);

  const timeline = getOrderedTimeline(resumeData?.timeline ?? []);
  const safeTimelineIndex = getSafeTimelineIndex(timeline, activeTimelineId);
  const roleSectionCount = includeRoleSections ? 4 : 0;
  const totalSlides = timeline.length + roleSectionCount;
  const [rolePresentationSection, setRolePresentationSection] = useState<0 | 1 | 2 | 3 | null>(null);
  const presentationIndex =
    rolePresentationSection === null
      ? Math.max(0, safeTimelineIndex)
      : timeline.length + rolePresentationSection;
  const isRoleSection = includeRoleSections && presentationIndex >= timeline.length;
  const roleSectionIndex =
    rolePresentationSection === null ? (0 as 0 | 1 | 2 | 3) : rolePresentationSection;

  const syncTimelineByIndex = useCallback(
    (index: number) => {
      if (index < timeline.length) {
        const expectedId = timeline[index]?.id;
        if (expectedId && expectedId !== activeTimelineId) {
          setActiveTimelineId(expectedId);
        }
      }
    },
    [timeline, activeTimelineId, setActiveTimelineId],
  );

  const goNext = useCallback(() => {
    if (rolePresentationSection === null) {
      if (safeTimelineIndex < timeline.length - 1) {
        syncTimelineByIndex(safeTimelineIndex + 1);
      } else if (includeRoleSections) {
        setRolePresentationSection(0);
      }
      return;
    }
    if (rolePresentationSection < roleSectionCount - 1) {
      setRolePresentationSection((rolePresentationSection + 1) as 0 | 1 | 2 | 3);
    }
  }, [
    rolePresentationSection,
    safeTimelineIndex,
    timeline.length,
    syncTimelineByIndex,
    includeRoleSections,
    roleSectionCount,
  ]);

  const goPrev = useCallback(() => {
    if (rolePresentationSection !== null) {
      if (rolePresentationSection > 0) {
        setRolePresentationSection((rolePresentationSection - 1) as 0 | 1 | 2 | 3);
      } else {
        setRolePresentationSection(null);
        if (timeline.length > 0) {
          syncTimelineByIndex(timeline.length - 1);
        }
      }
      return;
    }
    if (safeTimelineIndex > 0) {
      syncTimelineByIndex(safeTimelineIndex - 1);
    }
  }, [rolePresentationSection, timeline.length, safeTimelineIndex, syncTimelineByIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPresenting(false);
      } else if (e.key === "ArrowRight" || e.key === " ") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    },
    [setIsPresenting, goNext, goPrev]
  );

  useEffect(() => {
    if (isPresenting) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      syncTimelineByIndex(presentationIndex);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [
    isPresenting,
    handleKeyDown,
    activeTimelineId,
    safeTimelineIndex,
    timeline,
    setActiveTimelineId,
    syncTimelineByIndex,
    presentationIndex,
  ]);

  if (!isPresenting) {
    return null;
  }

  if (timeline.length === 0 || !resumeData) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        >
          <div className="text-sm text-muted-foreground">暂无经历数据</div>
          <div className="absolute right-4 top-4 z-10">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full border border-white/60 bg-white/70 shadow-sm backdrop-blur hover:bg-white"
              onClick={() => setIsPresenting(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-zinc-50 via-white to-white"
      >
        {/* Close button */}
        <div className="absolute right-4 top-4 z-20">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full border border-white/60 bg-white/70 shadow-sm backdrop-blur hover:bg-white"
            onClick={() => {
              setRolePresentationSection(null);
              setIsPresenting(false);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main slide */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {isRoleSection ? (
              <motion.div
                key={`role-${roleSectionIndex}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="h-full overflow-auto bg-zinc-50"
              >
                <RoleUnderstandingView
                  roleUnderstanding={resumeData.roleUnderstanding}
                  presentationSection={roleSectionIndex}
                />
              </motion.div>
            ) : (
              <TimelineSlide key={timeline[presentationIndex].id} />
            )}
          </AnimatePresence>

          {/* Skill map overlay (top-right) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute right-4 top-4 h-48 w-64 overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-lg shadow-zinc-300/30 backdrop-blur-md"
          >
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-500">
              技能图谱
            </div>
            <div className="h-[calc(100%-28px)]">
              <SkillMapView />
            </div>
          </motion.div>

          {/* Architecture overlay (bottom-right) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-4 right-4 h-44 w-72 overflow-hidden rounded-2xl border border-white/60 bg-white/75 shadow-lg shadow-zinc-300/30 backdrop-blur-md"
          >
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-500">
              架构图
            </div>
            <div className="h-[calc(100%-28px)]">
              <ArchitectureView />
            </div>
          </motion.div>
        </div>

        {/* Navigation bar */}
        <div className="flex items-center justify-center gap-4 border-t border-white/60 bg-white/60 px-6 py-3 backdrop-blur-md">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            disabled={presentationIndex <= 0}
            onClick={goPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === presentationIndex
                    ? "w-6 bg-gradient-to-r from-indigo-500 to-violet-500"
                    : "w-1.5 bg-zinc-200 hover:bg-zinc-300"
                }`}
                onClick={() => {
                  if (i < timeline.length) {
                    setRolePresentationSection(null);
                    syncTimelineByIndex(i);
                  } else if (includeRoleSections) {
                    setRolePresentationSection((i - timeline.length) as 0 | 1 | 2 | 3);
                  }
                }}
              />
            ))}
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="rounded-full"
            disabled={presentationIndex >= totalSlides - 1}
            onClick={goNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <span className="ml-2 text-xs text-muted-foreground">
            {presentationIndex + 1} / {totalSlides}
          </span>
        </div>

        {/* ESC hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pointer-events-none absolute bottom-16 left-4 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-[11px] text-zinc-500 backdrop-blur"
        >
          按 ESC 退出 · 方向键翻页
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
