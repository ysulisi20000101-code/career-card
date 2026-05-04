"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Calendar, Briefcase } from "lucide-react";
import type { TimelineNode } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { getOrderedTimeline } from "@/lib/timeline/order";
import { useResumeStore } from "@/store/resume-store";
import { Badge } from "@/components/ui/badge";

interface TimelineViewProps {
  nodes: TimelineNode[];
  readOnly?: boolean;
}

export function TimelineView({ nodes, readOnly = false }: TimelineViewProps) {
  const activeTimelineId = useResumeStore((s) => s.activeTimelineId);
  const setActiveTimelineId = useResumeStore((s) => s.setActiveTimelineId);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedNodes = useMemo(() => getOrderedTimeline(nodes), [nodes]);

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-12 px-4">
      {/* Center connecting line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary via-primary/60 to-muted" />

      <div className="relative space-y-12">
        {sortedNodes.map((node, index) => {
          const isLeft = index % 2 === 0;
          const isActive = activeTimelineId === node.id;

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              className={cn(
                "relative flex items-center",
                isLeft ? "justify-start" : "justify-end"
              )}
            >
              {/* Center dot */}
              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 z-10 rounded-full border-2 transition-all duration-300",
                  isActive
                    ? "w-5 h-5 bg-primary border-primary shadow-lg shadow-primary/30"
                    : "w-3.5 h-3.5 bg-background border-primary/50"
                )}
              />

              {/* Connector arm */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-px bg-border",
                  isLeft
                    ? "left-[calc(50%+10px)] w-[calc(5%-10px)]"
                    : "right-[calc(50%+10px)] w-[calc(5%-10px)]"
                )}
              />

              {/* Card */}
              <motion.div
                onClick={() => {
                  if (!readOnly) setActiveTimelineId(isActive ? null : node.id);
                }}
                whileHover={readOnly ? {} : { scale: 1.02 }}
                animate={isActive ? { scale: 1.03 } : { scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "w-[44%] rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 cursor-pointer group",
                  isActive
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/30 hover:shadow-md",
                  readOnly && "cursor-default"
                )}
              >
                {/* Date badge */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {formatDate(node.startDate)} — {formatDate(node.endDate)}
                  </span>
                </div>

                {/* Company */}
                <div className="flex items-center gap-2 mb-1">
                  <Building2
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <h3
                    className={cn(
                      "text-lg font-bold tracking-tight transition-colors",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {node.company}
                  </h3>
                </div>

                {/* Position */}
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {node.position}
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-3">
                  {node.description}
                </p>

                {/* Skills preview */}
                {node.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {node.skills.slice(0, 4).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-[10px] px-2 py-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {node.skills.length > 4 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{node.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
