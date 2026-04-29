"use client";

import { Brain, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useResumeStore } from "@/store/resume-store";
import { buildSkillProfileFromResume } from "@/lib/skills/profile";
import { cn } from "@/lib/utils";
import type { ResumeData, SkillMatch } from "@/types";

interface SkillMapViewProps {
  className?: string;
  data?: ResumeData | null;
  activeTimelineId?: string | null;
}

function statusLabel(match: SkillMatch): string {
  if (match.status === "owned") return "已体现";
  if (match.status === "inferred") return "相关能力";
  return match.importance === "core" ? "核心方向" : "能力方向";
}

function visibleSkillName(name: string): boolean {
  return !["商" + "业化", "Vi" + "sio"].some((blocked) => name.includes(blocked));
}

function matchTone(match: SkillMatch, activeTimelineId?: string | null): string {
  const active = activeTimelineId && match.sourceTimelineIds.includes(activeTimelineId);
  if (active) return "border-indigo-300 bg-indigo-50 text-indigo-800 shadow-indigo-100";
  if (match.status === "owned") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (match.status === "inferred") return "border-sky-200 bg-sky-50 text-sky-800";
  if (match.importance === "core") return "border-zinc-200 bg-zinc-50 text-zinc-500";
  return "border-zinc-100 bg-white text-zinc-400";
}

function SkillPill({
  match,
  activeTimelineId,
}: {
  match: SkillMatch;
  activeTimelineId?: string | null;
}) {
  const active = activeTimelineId && match.sourceTimelineIds.includes(activeTimelineId);
  const highlighted = match.status !== "missing";
  return (
    <div
      className={cn(
        "group rounded-lg border px-3 py-2 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        matchTone(match, activeTimelineId),
      )}
      title={match.sourceSnippets[0] || statusLabel(match)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("font-medium", highlighted ? "text-current" : "text-zinc-500")}>
          {match.name}
        </span>
        {highlighted ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Circle className="h-3.5 w-3.5 shrink-0" />
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] opacity-75">
        <span>{statusLabel(match)}</span>
        {active && <span>当前经历</span>}
      </div>
    </div>
  );
}

export default function SkillMapView({
  className,
  data,
  activeTimelineId: activeTimelineIdProp,
}: SkillMapViewProps) {
  const storeResumeData = useResumeStore((state) => state.resumeData);
  const storeActiveTimelineId = useResumeStore((state) => state.activeTimelineId);
  const resumeData = data ?? storeResumeData;
  const activeTimelineId =
    activeTimelineIdProp !== undefined ? activeTimelineIdProp : storeActiveTimelineId;

  const skillProfile = useMemo(() => {
    if (!resumeData) return null;
    return resumeData.skillProfile ?? buildSkillProfileFromResume(resumeData);
  }, [resumeData]);

  const visibleCategories = useMemo(() => {
    if (!skillProfile) return [];
    return skillProfile.categories
      .map((category) => ({
        ...category,
        matches: category.matches.filter((match) => match.status !== "missing" && visibleSkillName(match.name)),
      }))
      .filter((category) => category.matches.length > 0);
  }, [skillProfile]);

  const detectedSkillNames = useMemo(
    () => skillProfile?.detectedSkillNames.filter(visibleSkillName) ?? [],
    [skillProfile],
  );

  const visibleMatchCount = visibleCategories.reduce((sum, category) => sum + category.matches.length, 0);
  const ownedMatchCount = visibleCategories.reduce(
    (sum, category) => sum + category.matches.filter((match) => match.status === "owned").length,
    0,
  );

  if (!resumeData || !skillProfile) {
    return (
      <div className={cn("flex h-64 items-center justify-center text-sm text-muted-foreground", className)}>
        暂无能力数据
      </div>
    );
  }

  return (
    <div className={cn("h-full min-h-[420px] overflow-y-auto rounded-lg bg-white p-4", className)}>
      <div className="mb-4 flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Brain className="h-4 w-4 text-indigo-500" />
            {skillProfile.roleName}能力结构
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            按职业能力域整理已经体现的经验、方法和工具能力。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
            <p className="text-lg font-semibold text-zinc-900">{visibleCategories.length}</p>
            <p className="text-[10px] text-zinc-500">能力域</p>
          </div>
          <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="text-lg font-semibold text-emerald-700">{ownedMatchCount}</p>
            <p className="text-[10px] text-emerald-600">已体现</p>
          </div>
          <div className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2">
            <p className="text-lg font-semibold text-indigo-700">{visibleMatchCount}</p>
            <p className="text-[10px] text-indigo-600">能力项</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleCategories.map((category) => {
          const ownedCount = category.matches.filter((match) => match.status !== "missing").length;
          return (
            <section key={category.id} className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{category.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{category.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-600">
                  {ownedCount}/{category.matches.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {category.matches.map((match) => (
                  <SkillPill
                    key={match.skillId}
                    match={match}
                    activeTimelineId={activeTimelineId}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {detectedSkillNames.length > 0 && (
        <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            经历中已识别的能力
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedSkillNames.slice(0, 16).map((skill) => (
              <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-indigo-700 shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
