"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeChange,
  type NodeProps,
  Position,
  MarkerType,
  applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Plus, X, ChevronDown } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { cn, generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { architectureTemplates, type ArchTemplateKey } from "@/lib/templates";
import type { ArchitectureModule } from "@/types";

const INDUSTRY_COLORS: Record<string, { bg: string; border: string }> = {
  internet: { bg: "#eff6ff", border: "#3b82f6" },
  automotive: { bg: "#f0fdf4", border: "#22c55e" },
  finance: { bg: "#fefce8", border: "#eab308" },
};

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  business: { label: "业务", color: "#6366f1" },
  technical: { label: "技术", color: "#06b6d4" },
};

function EditableArchNode({ data, id }: NodeProps) {
  const { module, onEdit, onDelete } = data as {
    module: ArchitectureModule;
    isRoot: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  };
  const colors = INDUSTRY_COLORS[module.industry] ?? INDUSTRY_COLORS.internet;
  const badge = TYPE_BADGE[module.type] ?? TYPE_BADGE.business;

  return (
    <div
      className="group rounded-xl border-2 px-4 py-3 min-w-[160px] max-w-[220px] cursor-pointer relative"
      style={{ backgroundColor: colors.bg, borderColor: `${colors.border}80` }}
      onDoubleClick={() => onEdit(id)}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-sm leading-tight text-gray-800">{module.title}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full text-white shrink-0"
          style={{ backgroundColor: badge.color }}
        >
          {badge.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{module.description}</p>
      <button
        className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-white text-xs shadow"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

const nodeTypes = { editableArch: EditableArchNode };

interface EditForm {
  id: string;
  title: string;
  description: string;
  type: ArchitectureModule["type"];
  industry: ArchitectureModule["industry"];
  relatedTimelineIds: string;
}

function ArchitectureEditorInner({ className }: { className?: string }) {
  const resumeData = useResumeStore((s) => s.resumeData);
  const updateArchitecture = useResumeStore((s) => s.updateArchitecture);
  const updateArchitectureModule = useResumeStore((s) => s.updateArchitectureModule);
  const addArchitectureModule = useResumeStore((s) => s.addArchitectureModule);
  const removeArchitectureModule = useResumeStore((s) => s.removeArchitectureModule);

  const modules = useMemo(
    () => resumeData?.architecture ?? [],
    [resumeData?.architecture],
  );

  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [dirty, setDirty] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const handleEdit = useCallback(
    (id: string) => {
      const mod = modules.find((m) => m.id === id);
      if (!mod) return;
      setEditForm({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        type: mod.type,
        industry: mod.industry,
        relatedTimelineIds: mod.relatedTimelineIds.join(", "),
      });
    },
    [modules],
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeArchitectureModule(id);
      setDirty(true);
    },
    [removeArchitectureModule],
  );

  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = modules.map((m) => ({
      id: m.id,
      type: "editableArch",
      position: m.position,
      data: { module: m, isRoot: m.parentId === null, onEdit: handleEdit, onDelete: handleDelete },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: true,
    }));

    const es: Edge[] = modules
      .filter((m) => m.parentId)
      .map((m) => ({
        id: `e-${m.parentId}-${m.id}`,
        source: m.parentId!,
        target: m.id,
        type: "smoothstep",
        style: { stroke: "#d1d5db", strokeWidth: 1.5 },
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
        es.push({
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

    return { nodes: ns, edges: es };
  }, [modules, handleEdit, handleDelete]);

  const [flowNodes, setFlowNodes] = useState<Node[]>(nodes);

  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setFlowNodes((nds) => applyNodeChanges(changes, nds));

      const positionChanges = changes.filter(
        (c) => c.type === "position" && (c as { dragging?: boolean }).dragging === false,
      );
      positionChanges.forEach((c) => {
        if (c.type === "position" && c.position) {
          updateArchitectureModule(c.id, { position: { x: c.position.x, y: c.position.y } });
        }
      });

      if (positionChanges.length > 0) setDirty(true);
    },
    [updateArchitectureModule],
  );

  const handleAddModule = () => {
    const rootModule = modules.find((m) => m.parentId === null);
    const newMod: ArchitectureModule = {
      id: generateId(),
      title: "新模块",
      description: "描述信息",
      type: "business",
      industry: rootModule?.industry ?? "internet",
      position: { x: Math.random() * 400 + 100, y: 300 },
      parentId: rootModule?.id ?? null,
      relatedTimelineIds: [],
    };
    addArchitectureModule(newMod);
    setDirty(true);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    updateArchitectureModule(editForm.id, {
      title: editForm.title,
      description: editForm.description,
      type: editForm.type,
      industry: editForm.industry,
      relatedTimelineIds: editForm.relatedTimelineIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setEditForm(null);
    setDirty(true);
  };

  const handleLoadTemplate = (key: ArchTemplateKey) => {
    const template = architectureTemplates[key]();
    updateArchitecture(template);
    setDirty(false);
    setTemplateMenuOpen(false);
  };

  if (modules.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 h-64", className)}>
        <p className="text-sm text-muted-foreground">暂无架构数据，请选择模板开始</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {(Object.keys(architectureTemplates) as ArchTemplateKey[]).map((key) => (
            <Button key={key} variant="outline" size="sm" onClick={() => handleLoadTemplate(key)}>
              {key}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full min-h-[500px]", className)}>
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        aria-label="架构编辑器"
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Toolbar */}
      <div className="absolute top-3 left-3 flex gap-2 z-10">
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
          >
            选择模板
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
          <AnimatePresence>
            {templateMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[160px] z-50"
              >
                {(Object.keys(architectureTemplates) as ArchTemplateKey[]).map((key) => (
                  <button
                    key={key}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => handleLoadTemplate(key)}
                  >
                    {key}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button variant="outline" size="sm" onClick={handleAddModule}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          添加模块
        </Button>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <Button size="sm" disabled={!dirty} onClick={() => setDirty(false)}>
          <Save className="h-4 w-4 mr-1" />
          保存
        </Button>
      </div>

      {/* Edit Dialog */}
      <AnimatePresence>
        {editForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/20"
            onClick={() => setEditForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl p-5 w-96 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">编辑架构模块</h3>
                <button
                  onClick={() => setEditForm(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">标题</label>
                  <input
                    className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">描述</label>
                  <textarea
                    className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">类型</label>
                    <select
                      className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={editForm.type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          type: e.target.value as ArchitectureModule["type"],
                        })
                      }
                    >
                      <option value="business">业务架构</option>
                      <option value="technical">技术架构</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">行业</label>
                    <select
                      className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={editForm.industry}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          industry: e.target.value as ArchitectureModule["industry"],
                        })
                      }
                    >
                      <option value="internet">互联网</option>
                      <option value="automotive">汽车</option>
                      <option value="finance">金融</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    关联时间线ID（逗号分隔）
                  </label>
                  <input
                    className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={editForm.relatedTimelineIds}
                    onChange={(e) =>
                      setEditForm({ ...editForm, relatedTimelineIds: e.target.value })
                    }
                    placeholder="id1, id2, ..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditForm(null)}>
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

export default function ArchitectureEditor({ className }: { className?: string }) {
  return (
    <ReactFlowProvider>
      <ArchitectureEditorInner className={className} />
    </ReactFlowProvider>
  );
}
