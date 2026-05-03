"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Boxes, Brain, Clock, Eye, LayoutTemplate, Sparkles, Target } from "lucide-react";
import type { PublicSiteTemplate } from "@/types";
import { useResumeStore } from "@/store/resume-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import SkillMapEditor from "@/components/skillmap/skill-map-editor";
import ArchitectureEditor from "@/components/architecture/architecture-editor";
import { RoleUnderstandingEditor } from "@/components/role-understanding/role-understanding-editor";
import { CareerNarrativeSite } from "@/components/narrative/career-narrative-site";
import { CareerAgentPanel } from "@/components/agent/career-agent-panel";
import { generatePresentationDraft } from "@/lib/presentation/generator";
import { savePresentationDraft, deletePresentationDraft } from "@/lib/presentation/storage";
import { loadInterviewProject, saveInterviewProject } from "@/lib/projects/registry";

const tabs = [
  { value: "timeline", label: "时间线", icon: Clock },
  { value: "skills", label: "技能导图", icon: Brain },
  { value: "architecture", label: "架构图", icon: Boxes },
  { value: "role", label: "岗位理解", icon: Target },
] as const;

type TabValue = (typeof tabs)[number]["value"];

const publicTemplates: { value: PublicSiteTemplate; label: string; description: string }[] = [
  {
    value: "executive-dossier",
    label: "档案总览",
    description: "商务档案式总览，适合默认发布",
  },
  {
    value: "minimal-growth",
    label: "成长看板",
    description: "更极简的成长路径与经历卡片",
  },
];

interface EditPageProps {
  mode?: "personal" | "interview";
  projectId?: string;
}

export function EditPage({ mode = "personal", projectId }: EditPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("timeline");
  const resumeData = useResumeStore((state) => state.resumeData);
  const updatePublicSiteTemplate = useResumeStore((state) => state.updatePublicSiteTemplate);
  const visibleTabs = mode === "interview" ? tabs : tabs.filter((tab) => tab.value !== "role");

  const handleGeneratePresentation = () => {
    if (!resumeData || !projectId) return;
    const interviewData = loadInterviewProject(projectId);
    if (interviewData?.presentationDraftId) {
      deletePresentationDraft(interviewData.presentationDraftId);
    }
    const draft = generatePresentationDraft(resumeData);
    savePresentationDraft(draft);
    if (interviewData) {
      saveInterviewProject(projectId, { ...interviewData, presentationDraftId: draft.id });
    }
    router.push(`/workspace/interview/${projectId}/present`);
  };

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

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-zinc-50/60 via-white to-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="h-10 rounded-full bg-zinc-100/80 p-1">
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 rounded-full px-4 text-xs font-medium text-zinc-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {mode === "personal" ? (
          <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1 shadow-sm md:flex">
            <LayoutTemplate className="h-3.5 w-3.5 text-zinc-400" />
            {publicTemplates.map((template) => {
              const active = (resumeData.publicSiteTemplate ?? "executive-dossier") === template.value;
              return (
                <button
                  key={template.value}
                  type="button"
                  title={template.description}
                  onClick={() => updatePublicSiteTemplate(template.value)}
                  className={
                    active
                      ? "rounded-full bg-zinc-950 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  }
                >
                  {template.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            {projectId && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 rounded-full px-2 text-[11px]"
                onClick={handleGeneratePresentation}
              >
                <Sparkles className="h-3 w-3" />
                重新生成演示
              </Button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Eye className="h-3.5 w-3.5" />
              右侧为真实公开页预览
            </div>
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-2">
        <motion.div
          key={`editor-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="min-h-0 overflow-y-auto border-b border-zinc-100 p-4 xl:border-b-0 xl:border-r xl:p-6"
        >
          <CareerAgentPanel currentSection={activeTab} />
          {activeTab === "timeline" && <TimelineEditor />}
          {activeTab === "skills" && <SkillMapEditor />}
          {activeTab === "architecture" && <ArchitectureEditor />}
          {mode === "interview" && activeTab === "role" && <RoleUnderstandingEditor />}
        </motion.div>

        <motion.aside
          key="true-site-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="hidden min-h-0 overflow-hidden bg-zinc-950 xl:block"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/95 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">
                <Eye className="h-3.5 w-3.5 text-indigo-300" />
                预览 — 发布后访客看到的效果
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CareerNarrativeSite data={resumeData} showFooter={false} />
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
