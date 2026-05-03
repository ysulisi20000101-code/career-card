"use client";

import { useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/resume-store";
import { cn } from "@/lib/utils";
import { improveArchitectureLayout } from "@/lib/architecture/layout";
import type { ArchitectureModule, ResumeData } from "@/types";

const INDUSTRY_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  internet: { bg: "#eff6ff", border: "#3b82f6", glow: "0 0 12px rgba(59,130,246,0.5)" },
  automotive: { bg: "#f0fdf4", border: "#22c55e", glow: "0 0 12px rgba(34,197,94,0.5)" },
  finance: { bg: "#fefce8", border: "#eab308", glow: "0 0 12px rgba(234,179,8,0.5)" },
};

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  business: { label: "业务", color: "#6366f1" },
  technical: { label: "技术", color: "#06b6d4" },
};

function ArchModuleNode({ data }: { data: { module: ArchitectureModule; highlighted: boolean; isRoot: boolean } }) {
  const { module, highlighted, isRoot } = data;
  const colors = INDUSTRY_COLORS[module.industry] ?? INDUSTRY_COLORS.internet;
  const badge = TYPE_BADGE[module.type] ?? TYPE_BADGE.business;

  return (
    <motion.div
      initial={false}
      animate={{
        scale: highlighted ? 1.05 : 1,
        boxShadow: highlighted ? colors.glow : "0 1px 3px rgba(0,0,0,0.1)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "rounded-xl border-2 px-4 py-3 min-w-[160px] max-w-[220px] transition-colors duration-300",
        highlighted ? "bg-white" : "",
      )}
      style={{
        backgroundColor: highlighted ? "#fff" : colors.bg,
        borderColor: highlighted ? colors.border : `${colors.border}60`,
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className={cn("font-semibold text-sm leading-tight", isRoot && "text-base")}
          style={{ color: highlighted ? colors.border : "#374151" }}
        >
          {module.title}
        </span>
        {!isRoot && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0"
            style={{ backgroundColor: badge.color }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{module.description}</p>
    </motion.div>
  );
}

const nodeTypes = { archModule: ArchModuleNode };

function buildFlowElements(
  modules: ArchitectureModule[],
  highlightedIds: Set<string>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = modules.map((m) => ({
    id: m.id,
    type: "archModule",
    position: m.position,
    data: {
      module: m,
      highlighted: highlightedIds.has(m.id),
      isRoot: m.parentId === null,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  }));

  const edges: Edge[] = modules
    .filter((m) => m.parentId)
    .map((m) => ({
      id: `e-${m.parentId}-${m.id}`,
      source: m.parentId!,
      target: m.id,
      type: "smoothstep",
      animated: highlightedIds.has(m.id),
      style: {
        stroke: highlightedIds.has(m.id)
          ? (INDUSTRY_COLORS[m.industry]?.border ?? "#3b82f6")
          : "#d1d5db",
        strokeWidth: highlightedIds.has(m.id) ? 2.5 : 1.5,
        transition: "stroke 300ms ease-out, stroke-width 300ms ease-out",
      },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    }));

  const siblingGroups = new Map<string, ArchitectureModule[]>();
  modules.forEach((m) => {
    if (m.parentId) {
      const arr = siblingGroups.get(m.parentId) ?? [];
      arr.push(m);
      siblingGroups.set(m.parentId, arr);
    }
  });

  siblingGroups.forEach((siblings) => {
    const sorted = [...siblings].sort((a, b) => a.position.x - b.position.x);
    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push({
        id: `e-flow-${sorted[i].id}-${sorted[i + 1].id}`,
        source: sorted[i].id,
        target: sorted[i + 1].id,
        sourceHandle: "right",
        targetHandle: "left",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#c7d2fe", strokeWidth: 1, strokeDasharray: "6 3" },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "#c7d2fe" },
      });
    }
  });

  return { nodes, edges };
}

interface ArchitectureViewProps {
  className?: string;
  data?: ResumeData | null;
  activeTimelineId?: string | null;
}

function ArchitectureFlowInner({
  className,
  data,
  activeTimelineId: activeTimelineIdProp,
}: ArchitectureViewProps) {
  const storeResumeData = useResumeStore((s) => s.resumeData);
  const storeActiveTimelineId = useResumeStore((s) => s.activeTimelineId);

  const modules: ArchitectureModule[] = useMemo(
    () => {
      const rawModules = data?.architecture ?? storeResumeData?.architecture ?? [];
      const timeline = data?.timeline ?? storeResumeData?.timeline ?? [];
      return improveArchitectureLayout(rawModules, timeline);
    },
    [data?.architecture, data?.timeline, storeResumeData?.architecture, storeResumeData?.timeline],
  );
  const activeTimelineId =
    activeTimelineIdProp !== undefined ? activeTimelineIdProp : storeActiveTimelineId;

  const highlightedIds = useMemo<Set<string>>(() => {
    if (!activeTimelineId) return new Set();
    return new Set(
      modules.filter((m) => m.relatedTimelineIds.includes(activeTimelineId)).map((m) => m.id),
    );
  }, [activeTimelineId, modules]);

  const { nodes, edges } = useMemo(
    () => buildFlowElements(modules, highlightedIds),
    [modules, highlightedIds],
  );

  if (modules.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground text-sm", className)}>
        暂无架构数据
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full min-h-[500px]", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function ArchitectureView({
  className,
  data,
  activeTimelineId,
}: ArchitectureViewProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureFlowInner
        className={className}
        data={data}
        activeTimelineId={activeTimelineId}
      />
    </ReactFlowProvider>
  );
}
