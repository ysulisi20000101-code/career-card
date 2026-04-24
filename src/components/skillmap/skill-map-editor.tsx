"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Plus, Trash2, X } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { cn, generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { skillTemplates } from "@/lib/templates";
import type { SkillNode } from "@/types";

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

interface ContextMenu {
  x: number;
  y: number;
  nodeId: string;
  parentId: string | null;
  category: string;
}

interface EditingNode {
  id: string;
  name: string;
  category: string;
  level: number;
}

export default function SkillMapEditor({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resumeData = useResumeStore((s) => s.resumeData);
  const updateSkills = useResumeStore((s) => s.updateSkills);
  const updateSkillNode = useResumeStore((s) => s.updateSkillNode);
  const addSkillNode = useResumeStore((s) => s.addSkillNode);
  const removeSkillNode = useResumeStore((s) => s.removeSkillNode);

  const skills = useMemo(
    () => resumeData?.skills ?? [],
    [resumeData?.skills],
  );

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
  const [dirty, setDirty] = useState(false);

  const treeRoot = useMemo(() => buildTree(skills), [skills]);

  const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());

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

    nodePositions.current.clear();
    root.descendants().forEach((d) => {
      const angle = (d.x ?? 0) - Math.PI / 2;
      const r = d.y ?? 0;
      nodePositions.current.set(d.data.id, {
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
      });
    });

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
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7);

    const nodeG = g
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeDatum>>(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `rotate(${((d.x ?? 0) * 180) / Math.PI - 90}) translate(${d.y ?? 0},0)`)
      .style("cursor", "pointer");

    nodeG
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 24 : d.depth === 1 ? 14 : 8))
      .attr("fill", (d) => getColor(d.data.category))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    nodeG
      .append("text")
      .attr("dy", (d) => (d.depth === 0 ? "0.35em" : d.depth === 1 ? -20 : -14))
      .attr("text-anchor", "middle")
      .attr("transform", (d) => `rotate(${-((((d.x ?? 0) * 180) / Math.PI) - 90)})`)
      .attr("font-size", (d) => (d.depth === 0 ? 13 : d.depth === 1 ? 12 : 10))
      .attr("font-weight", (d) => (d.depth <= 1 ? 600 : 400))
      .attr("fill", "#374151")
      .text((d) => d.data.name);

    nodeG.on("dblclick", (_event, d) => {
      const node = skills.find((n) => n.id === d.data.id);
      if (node) {
        setEditingNode({
          id: node.id,
          name: node.name,
          category: node.category,
          level: node.level,
        });
      }
    });

    nodeG.on("contextmenu", (event, d) => {
      event.preventDefault();
      const svgRect = svgRef.current!.getBoundingClientRect();
      setContextMenu({
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top,
        nodeId: d.data.id,
        parentId: d.parent?.data.id ?? null,
        category: d.data.category,
      });
    });

    const drag = d3
      .drag<SVGGElement, d3.HierarchyNode<TreeDatum>>()
      .on("drag", function (event, d) {
        const dx = event.x;
        const dy = event.y;
        d3.select(this).attr(
          "transform",
          `rotate(${((d.x ?? 0) * 180) / Math.PI - 90}) translate(${(d.y ?? 0) + dx},${dy})`,
        );
      })
      .on("end", () => {
        setDirty(true);
        render();
      });

    nodeG.call(drag as never);

    const svgEl = svg.node();
    if (svgEl) {
      const typedSvg = d3.select(svgEl);
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform.translate(cx, cy));
        });

      typedSvg
        .call(zoom)
        .call(zoom.transform, d3.zoomIdentity)
        .on("click", () => setContextMenu(null));
    }
  }, [treeRoot, skills]);

  useEffect(() => {
    render();
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [render]);

  const handleAddChild = () => {
    if (!contextMenu) return;
    const newNode: SkillNode = {
      id: generateId(),
      name: "新技能",
      category: contextMenu.category,
      level: 3,
      parentId: contextMenu.nodeId,
    };
    addSkillNode(newNode);
    setContextMenu(null);
    setDirty(true);
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    removeSkillNode(contextMenu.nodeId);
    setContextMenu(null);
    setDirty(true);
  };

  const handleEditSave = () => {
    if (!editingNode) return;
    updateSkillNode(editingNode.id, {
      name: editingNode.name,
      category: editingNode.category,
      level: editingNode.level,
    });
    setEditingNode(null);
    setDirty(true);
  };

  const handleLoadTemplate = (key: keyof typeof skillTemplates) => {
    const template = skillTemplates[key]();
    updateSkills(template);
    setDirty(false);
  };

  if (skills.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 h-64", className)}>
        <p className="text-sm text-muted-foreground">暂无技能数据，请选择模板开始</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {(Object.keys(skillTemplates) as (keyof typeof skillTemplates)[]).map((key) => (
            <Button key={key} variant="outline" size="sm" onClick={() => handleLoadTemplate(key)}>
              {key}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full h-full min-h-[500px]", className)}>
      <svg ref={svgRef} className="w-full h-full" />

      {/* Toolbar */}
      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
        {(Object.keys(skillTemplates) as (keyof typeof skillTemplates)[]).map((key) => (
          <Button key={key} variant="outline" size="sm" onClick={() => handleLoadTemplate(key)}>
            {key}模板
          </Button>
        ))}
      </div>

      <div className="absolute top-3 right-3">
        <Button size="sm" disabled={!dirty} onClick={() => setDirty(false)}>
          <Save className="h-4 w-4 mr-1" />
          保存
        </Button>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              onClick={handleAddChild}
            >
              <Plus className="h-3.5 w-3.5" />
              添加子节点
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除节点
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editingNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/20"
            onClick={() => setEditingNode(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl p-5 w-80 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">编辑技能节点</h3>
                <button onClick={() => setEditingNode(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">名称</label>
                  <input
                    className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={editingNode.name}
                    onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">分类</label>
                  <input
                    className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={editingNode.category}
                    onChange={(e) => setEditingNode({ ...editingNode, category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    等级: {editingNode.level}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={editingNode.level}
                    onChange={(e) =>
                      setEditingNode({ ...editingNode, level: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditingNode(null)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleEditSave}>
                  确定
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
