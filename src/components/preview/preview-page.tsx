"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Building2, Eye, GraduationCap, Play } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { getOrderedTimeline } from "@/lib/timeline/order";
import { calculateDuration, cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SkillMapView from "@/components/skillmap/skill-map-view";
import ArchitectureView from "@/components/architecture/architecture-view";
import { RoleUnderstandingView } from "@/components/role-understanding/role-understanding-view";
import { AgentSiteWorkbench } from "@/components/agent-first/agent-site-workbench";
import type { SiteThemeId } from "@/lib/site-styles/theme-config";
import { savePersonalProject } from "@/lib/projects/registry";
import { resumeDataToPersonal } from "@/lib/projects/adapters";
import type { ResumeData } from "@/types";

type SectionId = "timeline" | "role" | "skills" | "architecture";

const interviewSections: { id: SectionId; label: string }[] = [
  { id: "timeline", label: "职业经历" },
  { id: "role", label: "岗位理解" },
  { id: "skills", label: "技能导图" },
  { id: "architecture", label: "架构视图" },
];

interface PreviewPageProps {
  mode?: "personal" | "interview";
  projectId?: string;
  onStartPresentation?: () => void;
}

function materializedSignature(data: ResumeData): string {
  return JSON.stringify({
    theme: data.siteThemeId,
    profile: data.profile,
    timeline: data.timeline.map((node) => ({
      id: node.id,
      order: node.order,
      description: node.description,
      highlights: node.highlights,
      storyTitle: node.storyTitle,
      evidenceResult: node.evidenceResult,
    })),
    role: data.roleUnderstanding,
  });
}

export function PreviewPage({ mode = "personal", projectId, onStartPresentation }: PreviewPageProps) {
  const resumeData = useResumeStore((state) => state.resumeData);
  const setResumeData = useResumeStore((state) => state.setResumeData);
  const updateSiteThemeId = useResumeStore((state) => state.updateSiteThemeId);
  const setIsPresenting = useResumeStore((state) => state.setIsPresenting);
  const [activeSection, setActiveSection] = useState<SectionId>("timeline");
  const lastMaterializedRef = useRef("");
  const orderedTimeline = useMemo(
    () => getOrderedTimeline(resumeData?.timeline ?? []),
    [resumeData?.timeline],
  );
  const activeTimelineId = orderedTimeline[0]?.id ?? null;
  const handleRenderedDataChange = useCallback(
    (nextData: ResumeData) => {
      const signature = materializedSignature(nextData);
      if (signature === lastMaterializedRef.current) return;
      lastMaterializedRef.current = signature;
      setResumeData(nextData);
      if (projectId) savePersonalProject(projectId, resumeDataToPersonal(nextData));
    },
    [projectId, setResumeData],
  );
  const handleThemeChange = useCallback(
    (nextThemeId: SiteThemeId) => {
      updateSiteThemeId(nextThemeId);
      const current = useResumeStore.getState().resumeData;
      if (current && projectId) {
        savePersonalProject(projectId, resumeDataToPersonal({ ...current, siteThemeId: nextThemeId }));
      }
    },
    [projectId, updateSiteThemeId],
  );

  if (!resumeData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">数据未加载</p>
          <p className="mt-2 text-sm text-zinc-500">请先上传简历或手动填写信息。</p>
          <a href="/workspace" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            返回工作台
          </a>
        </div>
      </div>
    );
  }

  if (mode === "personal") {
    return (
      <div className="h-full overflow-hidden bg-zinc-100">
        <AgentSiteWorkbench
          resumeData={resumeData}
          themeId={(resumeData.siteThemeId as SiteThemeId) || "warm-business"}
          onRenderedDataChange={handleRenderedDataChange}
          onThemeChange={handleThemeChange}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-zinc-50/80 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-5 flex flex-col items-stretch gap-3 rounded-lg border border-zinc-100 bg-white/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/30">
              <Eye className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">面试空间预览</p>
              <p className="mt-0.5 text-xs text-zinc-500">确认讲述节奏后进入演示模式。</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="brand"
            className="gap-1.5 rounded-full"
            onClick={() => {
              if (onStartPresentation) onStartPresentation();
              else setIsPresenting(true);
            }}
          >
            <Play className="h-3.5 w-3.5" />
            进入演示模式
          </Button>
        </div>

        <nav className="sticky top-0 z-10 mb-6 flex gap-1 border-b border-zinc-100 bg-white/80 px-1 backdrop-blur">
          {interviewSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "relative -mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeSection === section.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-900",
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {activeSection === "timeline" && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900">
                <Building2 className="h-4.5 w-4.5 text-indigo-500" />
                工作经历
              </h2>
              <div className="space-y-3">
                {orderedTimeline.map((node) => (
                  <article key={node.id} className="rounded-lg border border-zinc-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:shadow-indigo-200/30">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-sm">
                        {(node.company || "?").slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-zinc-900">{node.company}</h3>
                            <p className="text-sm text-zinc-500">{node.position}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                            <span>{formatDate(node.startDate)} - {formatDate(node.endDate)}</span>
                            <Badge variant="secondary" className="rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium text-zinc-600">
                              {calculateDuration(node.startDate, node.endDate)}
                            </Badge>
                          </div>
                        </div>
                        {node.description && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{node.description}</p>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            {resumeData.education.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900">
                  <GraduationCap className="h-4.5 w-4.5 text-indigo-500" />
                  教育背景
                </h2>
                <div className="space-y-3">
                  {resumeData.education.map((edu) => (
                    <article key={edu.id} className="rounded-lg border border-zinc-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:shadow-indigo-200/30">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-sm">
                          {(edu.school || "?").slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold text-zinc-900">{edu.school}</h3>
                              <p className="text-sm text-zinc-500">{edu.degree} - {edu.major}</p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                              <span>{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeSection === "role" && (
          <div className="rounded-lg border border-zinc-100 bg-white p-5 shadow-sm">
            <RoleUnderstandingView roleUnderstanding={resumeData.roleUnderstanding} compact />
          </div>
        )}

        {activeSection === "skills" && (
          <div className="rounded-lg border border-zinc-100 bg-white p-4 shadow-sm" style={{ minHeight: 500 }}>
            <SkillMapView data={resumeData} activeTimelineId={activeTimelineId} />
          </div>
        )}

        {activeSection === "architecture" && (
          <div className="rounded-lg border border-zinc-100 bg-white p-4 shadow-sm" style={{ minHeight: 500 }}>
            <ArchitectureView data={resumeData} activeTimelineId={activeTimelineId} />
          </div>
        )}
      </div>
    </div>
  );
}
