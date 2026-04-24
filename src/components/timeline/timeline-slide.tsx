"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Calendar,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { cn, formatDate } from "@/lib/utils";
import { getOrderedTimeline, getSafeTimelineIndex } from "@/lib/timeline/order";
import { Badge } from "@/components/ui/badge";

const NODE_GRADIENTS = [
  "from-primary/5 via-background to-background",
  "from-blue-500/5 via-background to-background",
  "from-violet-500/5 via-background to-background",
  "from-emerald-500/5 via-background to-background",
  "from-amber-500/5 via-background to-background",
  "from-rose-500/5 via-background to-background",
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export function TimelineSlide() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const activeTimelineId = useResumeStore((s) => s.activeTimelineId);
  const setActiveTimelineId = useResumeStore((s) => s.setActiveTimelineId);
  const setIsPresenting = useResumeStore((s) => s.setIsPresenting);

  // Track the previous active id so we can derive slide direction during
  // render instead of syncing state inside an effect (cascading renders).
  const prevActiveIdRef = useRef<string | null>(null);
  const [direction, setDirection] = useState(0);

  const timeline = useMemo(() => {
    if (!resumeData) return [];
    return getOrderedTimeline(resumeData.timeline);
  }, [resumeData]);

  const activeIndex = useMemo(() => {
    return getSafeTimelineIndex(timeline, activeTimelineId);
  }, [activeTimelineId, timeline]);

  useEffect(() => {
    if (!activeTimelineId) return;
    const prev = prevActiveIdRef.current;
    if (prev && prev !== activeTimelineId) {
      const prevIdx = timeline.findIndex((n) => n.id === prev);
      const nextIdx = timeline.findIndex((n) => n.id === activeTimelineId);
      if (prevIdx !== -1 && nextIdx !== -1) {
        // Derive animation direction from an external id change. This is
        // purely presentational and debounced by equality check above.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDirection(nextIdx > prevIdx ? 1 : -1);
      }
    }
    prevActiveIdRef.current = activeTimelineId;
  }, [activeTimelineId, timeline]);

  const navigate = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= timeline.length) return;
      setActiveTimelineId(timeline[newIndex].id);
    },
    [timeline, setActiveTimelineId]
  );

  // Keyboard navigation is owned exclusively by the presentation container to avoid
  // duplicate handlers firing arrow-key navigation twice.

  useEffect(() => {
    if (timeline.length > 0 && !activeTimelineId) {
      setActiveTimelineId(timeline[0].id);
    }
  }, [timeline, activeTimelineId, setActiveTimelineId]);

  if (!resumeData || timeline.length === 0) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground">
        暂无经历数据
      </div>
    );
  }

  const activeNode = timeline[activeIndex] ?? timeline[0];
  const gradientClass = NODE_GRADIENTS[activeIndex % NODE_GRADIENTS.length];

  return (
    <div className={cn("relative h-dvh w-full overflow-hidden bg-gradient-to-br", gradientClass)}>
      {/* ESC hint — top left */}
      <button
        onClick={() => setIsPresenting(false)}
        className="absolute top-6 left-6 z-20 rounded-md border border-border bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ESC 退出
      </button>

      {/* Navigation arrows */}
      {activeIndex > 0 && (
        <button
          onClick={() => navigate(activeIndex - 1)}
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card/80 backdrop-blur-sm p-3 text-muted-foreground hover:text-foreground hover:bg-card transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {activeIndex < timeline.length - 1 && (
        <button
          onClick={() => navigate(activeIndex + 1)}
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card/80 backdrop-blur-sm p-3 text-muted-foreground hover:text-foreground hover:bg-card transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Slide content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeNode.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex h-full flex-col justify-center px-16 py-12 max-w-4xl mx-auto"
        >
          {/* Hero: date + company + position */}
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(activeNode.startDate)} — {formatDate(activeNode.endDate)}
            </span>
          </div>

          <h2 className="mb-1 flex items-center gap-3 text-4xl font-bold tracking-tight">
            <Building2 className="h-8 w-8 text-primary shrink-0" />
            {activeNode.company}
          </h2>

          <p className="mb-8 flex items-center gap-2 text-xl text-muted-foreground">
            <Briefcase className="h-5 w-5 shrink-0" />
            {activeNode.position}
          </p>

          {/* Description */}
          <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {activeNode.description}
          </p>

          {/* Highlights */}
          {activeNode.highlights.length > 0 && (
            <ul className="mb-8 space-y-2.5 max-w-2xl">
              {activeNode.highlights.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-start gap-2.5 text-sm text-foreground/80"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {h}
                </motion.li>
              ))}
            </ul>
          )}

          {/* Projects */}
          {activeNode.projects.length > 0 && (
            <div className="mb-8 max-w-2xl">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">项目经历</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {activeNode.projects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="rounded-lg border border-border bg-card/60 p-3"
                  >
                    <h4 className="text-sm font-medium">{project.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {project.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Skills badges */}
          {activeNode.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeNode.skills.map((skill, i) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                >
                  <Badge variant="secondary">{skill}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots — bottom center */}
      <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2">
        {timeline.map((node, i) => (
          <button
            key={node.id}
            onClick={() => navigate(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === activeIndex
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
