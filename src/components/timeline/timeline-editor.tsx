"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Plus,
  Trash2,
  GripVertical,
  Briefcase,
  X,
  Sparkles,
  Loader2,
  WandSparkles,
  Check,
  RotateCcw,
  Users,
} from "lucide-react";
import type { PromotionStage, TimelineNode } from "@/types";
import type { AiPromotionResult, AiStoryResult } from "@/lib/narrative/ai-client";
import { generateId, formatDate } from "@/lib/utils";
import { getOrderedTimeline } from "@/lib/timeline/order";
import { useResumeStore } from "@/store/resume-store";
import {
  STORY_MOOD_LABELS,
  STORY_MOODS,
  buildTimelineStory,
} from "@/lib/narrative/story";
import { inferCareerKind } from "@/lib/narrative/sequence";
import {
  extractPromotionStagesWithAI,
  organizeTimelineStoryWithAI,
} from "@/lib/narrative/ai-client";
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

const leadershipLabels: Record<PromotionStage["leadershipType"], string> = {
  none: "独立负责",
  dotted: "虚线带队",
  solid: "实线管理",
};

function SuggestionPanel({
  suggestion,
  onApply,
  onRegenerate,
  onDiscard,
  isLoading,
}: {
  suggestion: AiStoryResult;
  onApply: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
  isLoading?: boolean;
}) {
  const rows = [
    ["标题", suggestion.storyTitle],
    ["背景", suggestion.storyScene],
    ["挑战", suggestion.storyChallenge],
    ["行动", suggestion.storyAction],
    ["产出", suggestion.storyOutcome],
    ["思考", suggestion.storyReflection],
    ["支撑挑战", suggestion.evidenceProblem],
    ["支撑行动", suggestion.evidenceAction],
    ["支撑产出", suggestion.evidenceResult],
    ["支撑细节", suggestion.evidenceProof],
  ];

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-950">
            <Sparkles className="h-4 w-4" />
            AI 故事建议，未采纳
          </div>
          <p className="mt-1 text-xs leading-5 text-violet-700">
            建议会先停留在这里，点击采纳后才会写入这段经历。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="h-8 gap-1.5" onClick={onApply}>
            <Check className="h-3.5 w-3.5" />
            采纳建议
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 bg-white"
            onClick={onRegenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            重新生成
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-violet-700 hover:text-destructive"
            onClick={onDiscard}
          >
            丢弃
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-violet-100 bg-white p-3">
            <p className="text-[11px] font-medium text-violet-500">{label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-800">{value}</p>
          </div>
        ))}
        <div className="rounded-md border border-violet-100 bg-white p-3">
          <p className="text-[11px] font-medium text-violet-500">情绪色板</p>
          <p className="mt-1 text-sm text-slate-800">
            {STORY_MOOD_LABELS[suggestion.storyMood]}
          </p>
        </div>
      </div>
    </div>
  );
}

function PromotionSuggestionPanel({
  suggestion,
  onApply,
  onRegenerate,
  onDiscard,
  isLoading,
}: {
  suggestion: AiPromotionResult;
  onApply: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
            <Users className="h-4 w-4" />
            AI 晋升阶段建议，未采纳
          </div>
          <p className="mt-1 text-xs leading-5 text-emerald-700">
            AI 会尝试从最新经历中推断阶段变化。采纳前不会写入公开网站。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={onApply}
            disabled={suggestion.stages.length === 0}
          >
            <Check className="h-3.5 w-3.5" />
            采纳阶段
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 bg-white"
            onClick={onRegenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            重新推断
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-emerald-700 hover:text-destructive"
            onClick={onDiscard}
          >
            丢弃
          </Button>
        </div>
      </div>

      {suggestion.stages.length === 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          AI 暂时没有抽取到可用阶段。建议补充职位变化、带队规模或职责变化后再试。
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {suggestion.stages.map((stage, index) => (
            <div key={stage.id || index} className="rounded-md border border-emerald-100 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{stage.title}</p>
                <Badge variant="secondary">{leadershipLabels[stage.leadershipType]}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {stage.period || "阶段时间未明确"} · {stage.teamScale || "团队规模未明确"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{stage.responsibility}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{stage.outcome}</p>
              {stage.reflection && (
                <p className="mt-2 text-sm leading-6 text-slate-500">{stage.reflection}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineNodeCard({
  node,
  suggestion,
  promotionSuggestion,
  isLatestCareerNode,
  onUpdate,
  onRemove,
  onAiOrganize,
  onPromotionExtract,
  onApplySuggestion,
  onApplyPromotion,
  onDiscardSuggestion,
  onDiscardPromotion,
  isAiLoading,
  isPromotionLoading,
}: {
  node: TimelineNode;
  suggestion?: AiStoryResult;
  promotionSuggestion?: AiPromotionResult;
  isLatestCareerNode: boolean;
  onUpdate: (id: string, data: Partial<TimelineNode>) => void;
  onRemove: (id: string) => void;
  onAiOrganize: (node: TimelineNode) => Promise<void>;
  onPromotionExtract: (node: TimelineNode) => Promise<void>;
  onApplySuggestion: (id: string) => void;
  onApplyPromotion: (id: string) => void;
  onDiscardSuggestion: (id: string) => void;
  onDiscardPromotion: (id: string) => void;
  isAiLoading?: boolean;
  isPromotionLoading?: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newHighlight, setNewHighlight] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const generatedStory = buildTimelineStory(node, node.order);

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

  const handleSkillKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  };

  const handleHighlightKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addHighlight();
    }
  };

  return (
    <Card className="group relative">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/40" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatDate(node.startDate)} - {formatDate(node.endDate)}
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
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-4 w-4 shrink-0 text-primary" />
          {node.company || "未命名公司"}
        </CardTitle>
        {node.position && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            {node.position}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {suggestion && (
          <SuggestionPanel
            suggestion={suggestion}
            isLoading={isAiLoading}
            onApply={() => onApplySuggestion(node.id)}
            onRegenerate={() => void onAiOrganize(node)}
            onDiscard={() => onDiscardSuggestion(node.id)}
          />
        )}
        {promotionSuggestion && (
          <PromotionSuggestionPanel
            suggestion={promotionSuggestion}
            isLoading={isPromotionLoading}
            onApply={() => onApplyPromotion(node.id)}
            onRegenerate={() => void onPromotionExtract(node)}
            onDiscard={() => onDiscardPromotion(node.id)}
          />
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <label className="text-xs font-medium text-muted-foreground">职位</label>
            <Input
              value={node.position}
              onChange={(e) => onUpdate(node.id, { position: e.target.value })}
              placeholder="请输入职位名称"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              开始时间
            </label>
            <Input
              value={node.startDate}
              onChange={(e) => onUpdate(node.id, { startDate: e.target.value })}
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              经历类型
            </label>
            <select
              value={node.careerKind ?? "auto"}
              onChange={(e) =>
                onUpdate(node.id, {
                  careerKind:
                    e.target.value === "auto"
                      ? undefined
                      : (e.target.value as TimelineNode["careerKind"]),
                })
              }
              className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="auto">自动识别（当前：{inferCareerKind(node) === "internship" ? "实习" : "社招"}）</option>
              <option value="internship">实习</option>
              <option value="fulltime">社招</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            原始工作描述
          </label>
          <Textarea
            value={node.description}
            onChange={(e) => onUpdate(node.id, { description: e.target.value })}
            placeholder="请输入工作描述"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            原始工作亮点
          </label>
          <div className="space-y-2">
            {node.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <Input
                  value={highlight}
                  onChange={(e) => {
                    const updated = [...node.highlights];
                    updated[index] = e.target.value;
                    onUpdate(node.id, { highlights: updated });
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeHighlight(index)}
                >
                  <X className="h-3.5 w-3.5" />
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
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            相关技能
          </label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {node.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="cursor-pointer gap-1 pr-1 hover:bg-destructive/10"
                onClick={() => removeSkill(skill)}
              >
                {skill}
                <X className="h-3 w-3" />
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
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <details className="group rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
              <Sparkles className="h-4 w-4" />
              职业故事与亮点支撑
            </span>
            <span className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isAiLoading}
                className="h-7 gap-1.5 rounded-full border-indigo-200 bg-white px-2.5 text-xs text-indigo-700 hover:bg-indigo-50"
                onClick={(event) => {
                  event.preventDefault();
                  void onAiOrganize(node);
                }}
              >
                {isAiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <WandSparkles className="h-3.5 w-3.5" />
                )}
                AI 生成建议
              </Button>
              <span className="text-xs text-indigo-500 group-open:hidden">
                展开校准
              </span>
              <span className="hidden text-xs text-indigo-500 group-open:inline">
                收起
              </span>
            </span>
          </summary>
          <p className="mt-2 text-xs leading-5 text-indigo-700/75">
            不填写时会按规则生成；AI 建议采纳后会优先展示在公开网站中。
          </p>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                故事标题
              </label>
              <Input
                value={node.storyTitle ?? ""}
                onChange={(e) => onUpdate(node.id, { storyTitle: e.target.value })}
                placeholder={generatedStory.title}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["背景", "storyScene", generatedStory.scene],
                ["挑战", "storyChallenge", generatedStory.challenge],
                ["行动", "storyAction", generatedStory.action],
                ["产出", "storyOutcome", generatedStory.outcome],
              ].map(([label, key, placeholder]) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {label}
                  </label>
                  <Textarea
                    value={(node[key as keyof TimelineNode] as string | undefined) ?? ""}
                    onChange={(e) => onUpdate(node.id, { [key]: e.target.value })}
                    placeholder={placeholder}
                    rows={3}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  思考
                </label>
                <Textarea
                  value={node.storyReflection ?? ""}
                  onChange={(e) =>
                    onUpdate(node.id, { storyReflection: e.target.value })
                  }
                  placeholder={generatedStory.reflection}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  情绪色板
                </label>
                <select
                  value={node.storyMood ?? generatedStory.mood}
                  onChange={(e) =>
                    onUpdate(node.id, {
                      storyMood: e.target.value as TimelineNode["storyMood"],
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {STORY_MOODS.map((mood) => (
                    <option key={mood} value={mood}>
                      {STORY_MOOD_LABELS[mood]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-white bg-white/70 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                亮点支撑
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ["挑战", "evidenceProblem", generatedStory.evidenceProblem],
                  ["行动", "evidenceAction", generatedStory.evidenceAction],
                  ["产出", "evidenceResult", generatedStory.evidenceResult],
                  ["细节", "evidenceProof", generatedStory.evidenceProof],
                ].map(([label, key, placeholder]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {label}
                    </label>
                    <Textarea
                      value={(node[key as keyof TimelineNode] as string | undefined) ?? ""}
                      onChange={(e) => onUpdate(node.id, { [key]: e.target.value })}
                      placeholder={placeholder}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        {isLatestCareerNode && (
          <details className="group rounded-lg border border-emerald-100 bg-emerald-50/40 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                <Users className="h-4 w-4" />
                晋升阶段
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPromotionLoading}
                className="h-7 gap-1.5 rounded-full border-emerald-200 bg-white px-2.5 text-xs text-emerald-700 hover:bg-emerald-50"
                onClick={(event) => {
                  event.preventDefault();
                  void onPromotionExtract(node);
                }}
              >
                {isPromotionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <WandSparkles className="h-3.5 w-3.5" />
                )}
                AI 推断晋升阶段
              </Button>
            </summary>
            <p className="mt-2 text-xs leading-5 text-emerald-700/75">
              用来展示最新经历中的角色跃迁。公开站只会展示已采纳的阶段。
            </p>
            {(node.promotionStages ?? []).length > 0 ? (
              <div className="mt-4 space-y-3">
                {(node.promotionStages ?? []).map((stage, index) => (
                  <div key={stage.id || index} className="rounded-md border bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{stage.title}</p>
                      <Badge variant="secondary">{leadershipLabels[stage.leadershipType]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stage.period || "阶段时间未明确"} · {stage.teamScale || "团队规模未明确"}
                    </p>
                    <p className="mt-2 text-sm leading-6">{stage.responsibility}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.outcome}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                还没有晋升阶段。可以先用 AI 推断，再采纳到这段经历里。
              </div>
            )}
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export function TimelineEditor() {
  const resumeData = useResumeStore((state) => state.resumeData);
  const updateTimelineNode = useResumeStore((state) => state.updateTimelineNode);
  const addTimelineNode = useResumeStore((state) => state.addTimelineNode);
  const removeTimelineNode = useResumeStore((state) => state.removeTimelineNode);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [promotionLoadingId, setPromotionLoadingId] = useState<string | null>(null);
  const [aiAllLoading, setAiAllLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [suggestions, setSuggestions] = useState<Record<string, AiStoryResult>>({});
  const [promotionSuggestions, setPromotionSuggestions] = useState<Record<string, AiPromotionResult>>({});

  const nodes = useMemo(() => resumeData?.timeline ?? [], [resumeData?.timeline]);
  const sortedNodes = useMemo(() => getOrderedTimeline(nodes), [nodes]);
  const careerNodes = useMemo(() => sortedNodes.filter((node) => inferCareerKind(node) === "fulltime"), [sortedNodes]);
  const latestCareerNodeId = careerNodes[0]?.id ?? null;

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
      storyMood: STORY_MOODS[nodes.length % STORY_MOODS.length],
    });
  };

  const handleAiOrganize = useCallback(async (node: TimelineNode) => {
    setAiError("");
    setAiLoadingId(node.id);
    try {
      const suggestion = await organizeTimelineStoryWithAI(node);
      setSuggestions((current) => ({ ...current, [node.id]: suggestion }));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI 整理失败，请稍后重试");
    } finally {
      setAiLoadingId(null);
    }
  }, []);

  const handlePromotionExtract = useCallback(async (node: TimelineNode) => {
    setAiError("");
    setPromotionLoadingId(node.id);
    try {
      const suggestion = await extractPromotionStagesWithAI(node);
      setPromotionSuggestions((current) => ({ ...current, [node.id]: suggestion }));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI 推断晋升阶段失败，请稍后重试");
    } finally {
      setPromotionLoadingId(null);
    }
  }, []);

  const handleAiOrganizeAll = useCallback(async () => {
    setAiError("");
    setAiAllLoading(true);
    try {
      for (const node of sortedNodes) {
        setAiLoadingId(node.id);
        const suggestion = await organizeTimelineStoryWithAI(node);
        setSuggestions((current) => ({ ...current, [node.id]: suggestion }));
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI 整理失败，请稍后重试");
    } finally {
      setAiLoadingId(null);
      setAiAllLoading(false);
    }
  }, [sortedNodes]);

  const applySuggestion = useCallback((id: string) => {
    const suggestion = suggestions[id];
    if (!suggestion) return;
    updateTimelineNode(id, suggestion);
    setSuggestions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, [suggestions, updateTimelineNode]);

  const applyPromotion = useCallback((id: string) => {
    const suggestion = promotionSuggestions[id];
    if (!suggestion) return;
    updateTimelineNode(id, { promotionStages: suggestion.stages });
    setPromotionSuggestions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, [promotionSuggestions, updateTimelineNode]);

  const discardSuggestion = useCallback((id: string) => {
    setSuggestions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const discardPromotion = useCallback((id: string) => {
    setPromotionSuggestions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">AI 职业故事校准</h2>
          <p className="text-sm text-muted-foreground">
            对比原始经历与 AI 建议，确认后再写入公开网站内容。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAiOrganizeAll}
            size="sm"
            variant="outline"
            disabled={sortedNodes.length === 0 || aiAllLoading}
            className="gap-1.5 rounded-full"
          >
            {aiAllLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <WandSparkles className="h-4 w-4" />
            )}
            AI 生成全部建议
          </Button>
          <Button onClick={handleAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            添加经历
          </Button>
        </div>
      </div>

      {aiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {aiError}
        </div>
      )}

      {sortedNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="mb-4 text-sm text-muted-foreground">
            暂无工作经历，点击添加第一段经历。
          </p>
          <Button onClick={handleAdd} variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            添加经历
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNodes.map((node) => (
            <TimelineNodeCard
              key={node.id}
              node={node}
              suggestion={suggestions[node.id]}
              promotionSuggestion={promotionSuggestions[node.id]}
              isLatestCareerNode={node.id === latestCareerNodeId}
              onUpdate={updateTimelineNode}
              onRemove={removeTimelineNode}
              onAiOrganize={handleAiOrganize}
              onPromotionExtract={handlePromotionExtract}
              onApplySuggestion={applySuggestion}
              onApplyPromotion={applyPromotion}
              onDiscardSuggestion={discardSuggestion}
              onDiscardPromotion={discardPromotion}
              isAiLoading={aiLoadingId === node.id}
              isPromotionLoading={promotionLoadingId === node.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
