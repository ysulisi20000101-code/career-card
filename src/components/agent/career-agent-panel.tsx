"use client";

import { useCallback, useMemo, useState } from "react";
import type React from "react";
import {
  Bot,
  Check,
  ClipboardCheck,
  HelpCircle,
  Loader2,
  PenLine,
  SearchCheck,
  Target,
} from "lucide-react";
import type { ResumeData, RoleUnderstanding, TimelineNode } from "@/types";
import type {
  AgentFinding,
  AgentInput,
  AgentIntent,
  AgentPatch,
  AgentPatchValue,
  AgentResponse,
  AgentSection,
  AgentSuggestion,
} from "@/lib/agent/types";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/utils";

const intentOptions: {
  intent: AgentIntent;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { intent: "analyze_resume", label: "分析", icon: SearchCheck },
  { intent: "ask_clarifying_questions", label: "追问", icon: HelpCircle },
  { intent: "rewrite_experience_story", label: "整理经历", icon: PenLine },
  { intent: "map_to_target_role", label: "匹配岗位", icon: Target },
  { intent: "review_before_publish", label: "发布检查", icon: ClipboardCheck },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function setObjectField<T extends object>(target: T, field: string, value: unknown): void {
  (target as unknown as Record<string, unknown>)[field] = value;
}

function applyAgentPatch(data: ResumeData, patch: AgentPatch): ResumeData {
  const next = structuredClone(data) as ResumeData;
  if (patch.path === "roleUnderstanding" && isRecord(patch.value)) {
    next.roleUnderstanding = patch.value as unknown as RoleUnderstanding;
    return next;
  }

  const profileMatch = patch.path.match(/^profile\.([A-Za-z0-9_]+)$/);
  if (profileMatch) {
    setObjectField(next.profile, profileMatch[1], patch.value);
    return next;
  }

  const roleMatch = patch.path.match(/^roleUnderstanding\.([A-Za-z0-9_]+)$/);
  if (roleMatch) {
    setObjectField(next.roleUnderstanding, roleMatch[1], patch.value);
    return next;
  }

  const timelineMatch = patch.path.match(/^timeline\[id=([^\]]+)\]\.([A-Za-z0-9_]+)$/);
  if (timelineMatch) {
    const [, id, field] = timelineMatch;
    next.timeline = next.timeline.map((node) =>
      node.id === id ? ({ ...node, [field]: patch.value } as TimelineNode) : node,
    );
    return next;
  }

  return next;
}

function severityClass(severity: AgentFinding["severity"]) {
  if (severity === "blocker") return "border-rose-100 bg-rose-50 text-rose-800";
  if (severity === "warning") return "border-amber-100 bg-amber-50 text-amber-800";
  if (severity === "passed") return "border-emerald-100 bg-emerald-50 text-emerald-800";
  return "border-zinc-100 bg-zinc-50 text-zinc-700";
}

function displayPatchValue(value: AgentPatchValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "空";
  if (Array.isArray(value)) return `${value.length} 项内容`;
  if (isRecord(value)) {
    if (typeof value.targetRoleTitle === "string") {
      return [
        value.targetRoleTitle,
        typeof value.oneLineInterpretation === "string" ? value.oneLineInterpretation : "",
      ]
        .filter(Boolean)
        .join(" · ");
    }
    return Object.keys(value).slice(0, 4).join(" / ");
  }
  return "结构化内容";
}

function patchPathLabel(path: string): string {
  if (path === "roleUnderstanding") return "岗位理解模块";
  if (path.startsWith("profile.")) return `个人信息 · ${path.replace("profile.", "")}`;
  if (path.startsWith("roleUnderstanding.")) return `岗位理解 · ${path.replace("roleUnderstanding.", "")}`;
  const timelineMatch = path.match(/^timeline\[id=([^\]]+)\]\.([A-Za-z0-9_]+)$/);
  if (timelineMatch) return `经历字段 · ${timelineMatch[2]}`;
  return path;
}

export function CareerAgentPanel({ currentSection }: { currentSection: AgentSection }) {
  const resumeData = useResumeStore((state) => state.resumeData);
  const setResumeData = useResumeStore((state) => state.setResumeData);
  const activeTimelineId = useResumeStore((state) => state.activeTimelineId);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [pendingIntent, setPendingIntent] = useState<AgentIntent | null>(null);
  const [error, setError] = useState("");
  const [appliedPatchIds, setAppliedPatchIds] = useState<Set<string>>(() => new Set());

  const currentRole = useMemo(() => {
    return resumeData?.roleUnderstanding.targetRoleTitle || resumeData?.profile.title || "";
  }, [resumeData]);

  const runAgent = useCallback(
    async (intent: AgentIntent) => {
      if (!resumeData) return;
      setPendingIntent(intent);
      setError("");
      setAppliedPatchIds(new Set());
      try {
        const payload: AgentInput = {
          resumeData,
          intent,
          currentSection,
          activeTimelineId,
          message,
          targetRole: currentRole,
          jobDescription: intent === "map_to_target_role" ? message : undefined,
        };
        const result = await fetch("/api/agent/career-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await result.json()) as { response?: AgentResponse; error?: string };
        if (!result.ok || !json.response) {
          throw new Error(json.error ?? "AGENT_FAILED");
        }
        setResponse(json.response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "助手暂时不可用，请稍后再试。");
      } finally {
        setPendingIntent(null);
      }
    },
    [activeTimelineId, currentRole, currentSection, message, resumeData],
  );

  const applyPatch = useCallback(
    (agentPatch: AgentPatch) => {
      if (!resumeData) return;
      setResumeData(applyAgentPatch(resumeData, agentPatch));
      setAppliedPatchIds((current) => new Set(current).add(agentPatch.id));
    },
    [resumeData, setResumeData],
  );

  const applySuggestion = useCallback(
    (suggestion: AgentSuggestion) => {
      if (!resumeData || suggestion.patches.length === 0) return;
      const next = suggestion.patches.reduce(applyAgentPatch, resumeData);
      setResumeData(next);
      setAppliedPatchIds((current) => {
        const nextIds = new Set(current);
        suggestion.patches.forEach((item) => nextIds.add(item.id));
        return nextIds;
      });
    },
    [resumeData, setResumeData],
  );

  if (!resumeData) return null;

  return (
    <section className="mb-4 rounded-lg border border-indigo-100 bg-white p-4 shadow-sm shadow-indigo-100/40">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <Bot className="h-4 w-4 text-indigo-600" />
            职业表达助手
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            当前目标：{currentRole || "尚未设置目标岗位"}
          </p>
        </div>
        {response && (
          <Badge variant="outline" className="shrink-0 border-indigo-200 text-indigo-700">
            {response.type}
          </Badge>
        )}
      </div>

      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="粘贴 JD、补充目标岗位，或告诉助手这次想优化什么"
        rows={3}
        className="mt-3 resize-none bg-zinc-50/70 text-sm"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {intentOptions.map((option) => {
          const Icon = option.icon;
          const pending = pendingIntent === option.intent;
          return (
            <Button
              key={option.intent}
              size="sm"
              variant={option.intent === "rewrite_experience_story" ? "brand" : "outline"}
              className="rounded-full"
              onClick={() => runAgent(option.intent)}
              disabled={Boolean(pendingIntent)}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              {option.label}
            </Button>
          );
        })}
      </div>

      {error && (
        <Notice tone="danger" className="mt-3">
          {error}
        </Notice>
      )}

      {response && (
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-zinc-100 bg-zinc-50/70 p-3">
            <p className="text-sm font-medium text-zinc-900">{response.summary}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {response.safety[0]?.message}
            </p>
          </div>

          {response.questions.length > 0 && (
            <div className="space-y-2">
              {response.questions.map((question) => (
                <div key={question.id} className="rounded-md border border-amber-100 bg-amber-50/70 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                    <HelpCircle className="h-4 w-4" />
                    {question.label}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-amber-800/80">{question.reason}</p>
                </div>
              ))}
            </div>
          )}

          {response.findings.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {response.findings.map((finding) => (
                <div
                  key={finding.id}
                  className={cn("rounded-md border p-3 text-xs leading-5", severityClass(finding.severity))}
                >
                  <p className="font-semibold">{finding.title}</p>
                  <p className="mt-1 opacity-85">{finding.body}</p>
                </div>
              ))}
            </div>
          )}

          {response.suggestions.length > 0 && (
            <div className="space-y-3">
              {response.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="rounded-lg border border-zinc-100 bg-white p-3 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={suggestion.priority === "high" ? "default" : "secondary"}>
                          {suggestion.priority}
                        </Badge>
                        <h3 className="text-sm font-semibold text-zinc-950">{suggestion.title}</h3>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-zinc-600">{suggestion.body}</p>
                    </div>
                    {suggestion.patches.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-full"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        应用全部
                      </Button>
                    )}
                  </div>

                  {suggestion.evidence.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {suggestion.evidence.map((item) => (
                        <span key={item} className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {suggestion.patches.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {suggestion.patches.map((agentPatch) => {
                        const applied = appliedPatchIds.has(agentPatch.id);
                        return (
                          <div key={agentPatch.id} className="rounded-md border border-zinc-100 bg-zinc-50/70 p-2">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="text-xs font-medium text-zinc-800">{agentPatch.label}</p>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                                    {patchPathLabel(agentPatch.path)}
                                  </span>
                                </div>
                                {agentPatch.previousValue !== undefined && (
                                  <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-zinc-400">
                                    当前：{displayPatchValue(agentPatch.previousValue)}
                                  </p>
                                )}
                                <p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-700">
                                  建议：{displayPatchValue(agentPatch.value)}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant={applied ? "secondary" : "outline"}
                                className="shrink-0 rounded-full"
                                onClick={() => applyPatch(agentPatch)}
                                disabled={applied}
                              >
                                {applied ? "已应用" : "应用"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
