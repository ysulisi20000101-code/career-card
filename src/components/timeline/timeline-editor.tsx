"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  Plus,
  Trash2,
  GripVertical,
  Briefcase,
  X,
} from "lucide-react";
import type { TimelineNode } from "@/types";
import { generateId, formatDate } from "@/lib/utils";
import { getOrderedTimeline } from "@/lib/timeline/order";
import { useResumeStore } from "@/store/resume-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function TimelineNodeCard({
  node,
  onUpdate,
  onRemove,
}: {
  node: TimelineNode;
  onUpdate: (id: string, data: Partial<TimelineNode>) => void;
  onRemove: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const addHighlight = () => {
    const value = newHighlight.trim();
    if (!value) return;
    onUpdate(node.id, { highlights: [...node.highlights, value] });
    setNewHighlight("");
  };

  const removeHighlight = (index: number) => {
    onUpdate(node.id, {
      highlights: node.highlights.filter((_, i) => i !== index),
    });
  };

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value || node.skills.includes(value)) return;
    onUpdate(node.id, { skills: [...node.skills, value] });
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    onUpdate(node.id, {
      skills: node.skills.filter((s) => s !== skill),
    });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleHighlightKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHighlight();
    }
  };

  return (
    <Card className="relative group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDate(node.startDate)} — {formatDate(node.endDate)}
              </span>
            </div>
          </div>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive">确认删除？</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onRemove(node.id)}
              >
                删除
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                取消
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          {node.company || "未命名公司"}
        </CardTitle>
        {node.position && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Briefcase className="w-3.5 h-3.5" />
            {node.position}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Company & Position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              公司名称
            </label>
            <Input
              value={node.company}
              onChange={(e) => onUpdate(node.id, { company: e.target.value })}
              placeholder="请输入公司名称"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              职位
            </label>
            <Input
              value={node.position}
              onChange={(e) => onUpdate(node.id, { position: e.target.value })}
              placeholder="请输入职位名称"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              开始时间
            </label>
            <Input
              value={node.startDate}
              onChange={(e) =>
                onUpdate(node.id, { startDate: e.target.value })
              }
              placeholder="YYYY-MM 或 2020-06"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              结束时间
            </label>
            <Input
              value={node.endDate}
              onChange={(e) => onUpdate(node.id, { endDate: e.target.value })}
              placeholder="YYYY-MM 或 至今"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            工作描述
          </label>
          <Textarea
            value={node.description}
            onChange={(e) =>
              onUpdate(node.id, { description: e.target.value })
            }
            placeholder="请输入工作描述"
            rows={3}
          />
        </div>

        {/* Highlights */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            工作亮点
          </label>
          <div className="space-y-2">
            {node.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <Input
                  value={h}
                  onChange={(e) => {
                    const updated = [...node.highlights];
                    updated[i] = e.target.value;
                    onUpdate(node.id, { highlights: updated });
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeHighlight(i)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={handleHighlightKeyDown}
                placeholder="添加工作亮点，按 Enter 确认"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addHighlight}
                disabled={!newHighlight.trim()}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            相关技能
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {node.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                onClick={() => removeSkill(skill)}
              >
                {skill}
                <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="添加技能标签，按 Enter 确认"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addSkill}
              disabled={!newSkill.trim()}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TimelineEditor() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const updateTimelineNode = useResumeStore((s) => s.updateTimelineNode);
  const addTimelineNode = useResumeStore((s) => s.addTimelineNode);
  const removeTimelineNode = useResumeStore((s) => s.removeTimelineNode);

  const nodes = resumeData?.timeline ?? [];
  const sortedNodes = getOrderedTimeline(nodes);

  const handleAdd = () => {
    addTimelineNode({
      id: generateId(),
      company: "",
      position: "",
      startDate: "",
      endDate: "至今",
      description: "",
      highlights: [],
      projects: [],
      skills: [],
      order: nodes.length,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">工作经历</h2>
          <p className="text-sm text-muted-foreground">
            编辑你的职业时间线
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          添加经历
        </Button>
      </div>

      {sortedNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            暂无工作经历，点击添加第一段经历
          </p>
          <Button onClick={handleAdd} variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            添加经历
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNodes.map((node) => (
            <TimelineNodeCard
              key={node.id}
              node={node}
              onUpdate={updateTimelineNode}
              onRemove={removeTimelineNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
