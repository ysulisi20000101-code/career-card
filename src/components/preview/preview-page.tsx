"use client";

import { useMemo, useState } from "react";
import { Building2, Eye, GraduationCap, Play } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { getOrderedTimeline } from "@/lib/timeline/order";
import { formatDate, calculateDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SkillMapView from "@/components/skillmap/skill-map-view";
import ArchitectureView from "@/components/architecture/architecture-view";
import { RoleUnderstandingView } from "@/components/role-understanding/role-understanding-view";
import { cn } from "@/lib/utils";

type SectionId = "timeline" | "role" | "skills" | "architecture";

const interviewSections: { id: SectionId; label: string }[] = [
  { id: "timeline", label: "职业经历" },
  { id: "role", label: "岗位理解" },
  { id: "skills", label: "技能图谱" },
  { id: "architecture", label: "架构视图" },
];
const personalSections: { id: SectionId; label: string }[] = [
  { id: "timeline", label: "职业经历" },
  { id: "skills", label: "技能图谱" },
  { id: "architecture", label: "架构视图" },
];

interface PreviewPageProps {
  mode?: "personal" | "interview";
  onStartPresentation?: () => void;
}

export function PreviewPage({ mode = "personal", onStartPresentation }: PreviewPageProps) {
  const resumeData = useResumeStore((s) => s.resumeData);
  const setIsPresenting = useResumeStore((s) => s.setIsPresenting);
  const [activeSection, setActiveSection] = useState<SectionId>("timeline");
  const orderedTimeline = useMemo(
    () => getOrderedTimeline(resumeData?.timeline ?? []),
    [resumeData?.timeline],
  );
  const activeTimelineId = orderedTimeline[0]?.id ?? null;

  if (!resumeData) return null;
  const sections = mode === "interview" ? interviewSections : personalSections;

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-zinc-50/80 via-white to-white">
      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-5 flex flex-col items-stretch gap-3 rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-sm shadow-zinc-200/40 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-500/30">
              <Eye className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">
                {mode === "interview" ? "面试空间预览" : "个人网站预览"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {mode === "interview"
                  ? "预览面试空间效果，确认讲述节奏后进入演示"
                  : "预览你的个人网站效果，确认无误后再发布分享"}
              </p>
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
          {sections.map((section) => (
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
            {mode === "interview" && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  角色匹配摘要
                </h2>
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-4 text-sm shadow-sm shadow-indigo-200/30">
                  <p className="text-zinc-700">
                    <span className="text-zinc-500">目标岗位：</span>
                    <span className="font-medium text-zinc-900">
                      {resumeData.roleUnderstanding.targetRoleTitle || "未填写"}
                    </span>
                  </p>
                  <p className="mt-1.5 text-zinc-700">
                    <span className="text-zinc-500">一句话理解：</span>
                    {resumeData.roleUnderstanding.oneLineInterpretation || "未填写"}
                  </p>
                </div>
              </section>
            )}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-900">
                <Building2 className="h-4.5 w-4.5 text-indigo-500" />
                工作经历
              </h2>
              <div className="space-y-3">
                {orderedTimeline.map((node) => (
                  <article
                    key={node.id}
                    className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-200/40 transition-all hover:shadow-md hover:shadow-indigo-200/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-sm">
                        {(node.company || "?").slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-zinc-900">
                              {node.company}
                            </h3>
                            <p className="text-sm text-zinc-500">{node.position}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                            <span>
                              {formatDate(node.startDate)} – {formatDate(node.endDate)}
                            </span>
                            <Badge
                              variant="secondary"
                              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium text-zinc-600"
                            >
                              {calculateDuration(node.startDate, node.endDate)}
                            </Badge>
                          </div>
                        </div>
                        {node.description && (
                          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                            {node.description}
                          </p>
                        )}
                        {node.highlights && node.highlights.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {node.highlights.map((h, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-[13px] text-zinc-600"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                        {node.skills && node.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {node.skills.map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
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
                <div className="space-y-2">
                  {resumeData.education.map((edu) => (
                    <div
                      key={edu.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 text-sm shadow-sm shadow-zinc-200/40"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">{edu.school}</p>
                        <p className="text-zinc-500">
                          {edu.degree} · {edu.major}
                        </p>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {mode === "interview" && activeSection === "role" && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-200/40">
            <RoleUnderstandingView roleUnderstanding={resumeData.roleUnderstanding} compact />
          </div>
        )}

        {activeSection === "skills" && (
          <div
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm shadow-zinc-200/40"
            style={{ minHeight: 500 }}
          >
            <SkillMapView data={resumeData} activeTimelineId={activeTimelineId} />
          </div>
        )}

        {activeSection === "architecture" && (
          <div
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm shadow-zinc-200/40"
            style={{ minHeight: 500 }}
          >
            <ArchitectureView data={resumeData} activeTimelineId={activeTimelineId} />
          </div>
        )}
      </div>
    </div>
  );
}
