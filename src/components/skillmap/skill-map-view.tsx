"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { useResumeStore } from "@/store/resume-store";
import { cn } from "@/lib/utils";
import type { ResumeData, SkillNode, TimelineNode } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  root: "#6366f1",
  "B端产品": "#3b82f6",
  "C端产品": "#10b981",
  "AI产品": "#f59e0b",
  "数据产品": "#ef4444",
  "工具技能": "#8b5cf6",
  "前端开发": "#3b82f6",
  "后端开发": "#10b981",
  DevOps: "#f59e0b",
  "架构设计": "#ef4444",
  "UI设计": "#3b82f6",
  "UX设计": "#10b981",
  "视觉设计": "#f59e0b",
};

function getColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#6b7280";
}

interface TreeDatum {
  id: string;
  name: string;
  category: string;
  level: number;
  children?: TreeDatum[];
}

function buildTree(nodes: SkillNode[]): TreeDatum | null {
  const map = new Map<string, TreeDatum>();
  const roots: TreeDatum[] = [];

  nodes.forEach((n) => {
    map.set(n.id, { id: n.id, name: n.name, category: n.category, level: n.level, children: [] });
  });

  nodes.forEach((n) => {
    const datum = map.get(n.id)!;
    if (n.parentId && map.has(n.parentId)) {
      map.get(n.parentId)!.children!.push(datum);
    } else if (!n.parentId) {
      roots.push(datum);
    }
  });

  return roots[0] ?? null;
}

interface SkillMapViewProps {
  className?: string;
  data?: ResumeData | null;
  activeTimelineId?: string | null;
}

export default function SkillMapView({
  className,
  data,
  activeTimelineId: activeTimelineIdProp,
}: SkillMapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const storeResumeData = useResumeStore((s) => s.resumeData);
  const storeActiveTimelineId = useResumeStore((s) => s.activeTimelineId);

  const skills: SkillNode[] = useMemo(
    () => data?.skills ?? storeResumeData?.skills ?? [],
    [data?.skills, storeResumeData?.skills],
  );
  const timeline: TimelineNode[] = useMemo(
    () => data?.timeline ?? storeResumeData?.timeline ?? [],
    [data?.timeline, storeResumeData?.timeline],
  );
  const activeTimelineId =
    activeTimelineIdProp !== undefined ? activeTimelineIdProp : storeActiveTimelineId;

  const highlightedSkillNames = useMemo<Set<string>>(() => {
    if (!activeTimelineId) return new Set();
    const active: TimelineNode | undefined = timeline.find((t) => t.id === activeTimelineId);
    return new Set((active?.skills ?? []).map((skill) => skill.trim()).filter(Boolean));
  }, [activeTimelineId, timeline]);

  const treeRoot = useMemo(() => buildTree(skills), [skills]);

  const render = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!svg.node() || !container || !treeRoot) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 80;

    svg.attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

    const root = d3.hierarchy(treeRoot);
    const treeLayout = d3
      .tree<TreeDatum>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    treeLayout(root);

    const linkGen = d3
      .linkRadial<d3.HierarchyPointLink<TreeDatum>, d3.HierarchyPointNode<TreeDatum>>()
      .angle((d) => d.x)
      .radius((d) => d.y);

    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("d", (d) => linkGen(d as never))
      .attr("fill", "none")
      .attr("stroke", (d) => {
        const name = d.target.data.name;
        return highlightedSkillNames.size > 0 && highlightedSkillNames.has(name)
          ? getColor(d.target.data.category)
          : "#d1d5db";
      })
      .attr("stroke-width", (d) => {
        const name = d.target.data.name;
        return highlightedSkillNames.size > 0 && highlightedSkillNames.has(name) ? 2.5 : 1.5;
      })
      .attr("opacity", (d) => {
        if (highlightedSkillNames.size === 0) return 0.7;
        return highlightedSkillNames.has(d.target.data.name) ? 1 : 0.3;
      })
      .transition()
      .duration(300)
      .ease(d3.easeCubicOut);

    const nodeG = g
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeDatum>>(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `rotate(${((d.x ?? 0) * 180) / Math.PI - 90}) translate(${d.y ?? 0},0)`);

    nodeG
      .append("circle")
      .attr("r", (d) => {
        if (d.depth === 0) return 24;
        if (d.depth === 1) return 14;
        return 8;
      })
      .attr("fill", (d) => getColor(d.data.category))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", (d) => {
        if (highlightedSkillNames.size === 0) return 1;
        return highlightedSkillNames.has(d.data.name) || d.depth === 0 ? 1 : 0.35;
      })
      .style("transform", (d) => {
        if (highlightedSkillNames.size > 0 && highlightedSkillNames.has(d.data.name)) {
          return "scale(1.2)";
        }
        return "scale(1)";
      })
      .style("transition", "transform 300ms ease-out, opacity 300ms ease-out");

    nodeG
      .append("text")
      .attr("dy", (d) => (d.depth === 0 ? "0.35em" : d.depth === 1 ? -20 : -14))
      .attr("text-anchor", "middle")
      .attr("transform", (d) => `rotate(${-((((d.x ?? 0) * 180) / Math.PI) - 90)})`)
      .attr("font-size", (d) => (d.depth === 0 ? 13 : d.depth === 1 ? 12 : 10))
      .attr("font-weight", (d) => (d.depth <= 1 ? 600 : 400))
      .attr("fill", (d) => {
        if (highlightedSkillNames.size === 0) return "#374151";
        return highlightedSkillNames.has(d.data.name) || d.depth === 0 ? "#111827" : "#9ca3af";
      })
      .style("transition", "fill 300ms ease-out")
      .text((d) => d.data.name);

    nodeG
      .filter((d) => d.depth >= 2)
      .each(function (d) {
        const sel = d3.select(this);
        const angle = -((((d.x ?? 0) * 180) / Math.PI) - 90);

        const dotGroup = sel.append("g").attr("transform", `rotate(${angle})`);
        const dotRadius = 2;
        const gap = 6;
        const startX = -((5 - 1) * gap) / 2;
        const dotY = -26;

        for (let i = 0; i < 5; i++) {
          dotGroup
            .append("circle")
            .attr("cx", startX + i * gap)
            .attr("cy", dotY)
            .attr("r", dotRadius)
            .attr("fill", i < d.data.level ? getColor(d.data.category) : "#e5e7eb");
        }
      });

    const svgEl = svg.node();
    if (svgEl) {
      const typedSvg = d3.select(svgEl);
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform.translate(cx, cy));
        });

      typedSvg.call(zoom).call(zoom.transform, d3.zoomIdentity);
    }
  }, [treeRoot, highlightedSkillNames]);

  useEffect(() => {
    render();
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [render]);

  if (skills.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground text-sm", className)}>
        暂无技能数据
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full h-full min-h-[500px]", className)}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
