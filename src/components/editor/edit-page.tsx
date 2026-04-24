"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Clock, Brain, Boxes, Target } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TimelineView } from "@/components/timeline/timeline-view";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import SkillMapView from "@/components/skillmap/skill-map-view";
import SkillMapEditor from "@/components/skillmap/skill-map-editor";
import ArchitectureView from "@/components/architecture/architecture-view";
import ArchitectureEditor from "@/components/architecture/architecture-editor";
import { RoleUnderstandingEditor } from "@/components/role-understanding/role-understanding-editor";
import { RoleUnderstandingView } from "@/components/role-understanding/role-understanding-view";

const tabs = [
  { value: "timeline", label: "时间线", icon: Clock },
  { value: "skills", label: "技能导图", icon: Brain },
  { value: "architecture", label: "架构图", icon: Boxes },
  { value: "role", label: "岗位理解", icon: Target },
] as const;

type TabValue = (typeof tabs)[number]["value"];

interface EditPageProps {
  mode?: "personal" | "interview";
  onEnterPreview?: () => void;
}

export function EditPage({ mode = "personal", onEnterPreview }: EditPageProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("timeline");
  const setCurrentStep = useResumeStore((s) => s.setCurrentStep);
  const resumeData = useResumeStore((s) => s.resumeData);
  const visibleTabs = mode === "interview" ? tabs : tabs.filter((t) => t.value !== "role");

  if (!resumeData) return null;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-zinc-50/60 via-white to-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
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

        <Button
          size="sm"
          variant="brand"
          className="gap-1.5 rounded-full"
          onClick={() => {
            if (onEnterPreview) {
              onEnterPreview();
            } else {
              setCurrentStep("preview");
            }
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          {mode === "interview" ? "进入面试预览" : "进入网站预览"}
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <motion.div
          key={`editor-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-y-auto border-b border-zinc-100 lg:border-b-0 lg:border-r"
        >
          {activeTab === "timeline" && <TimelineEditor />}
          {activeTab === "skills" && <SkillMapEditor />}
          {activeTab === "architecture" && <ArchitectureEditor />}
          {mode === "interview" && activeTab === "role" && <RoleUnderstandingEditor />}
        </motion.div>

        <motion.div
          key={`preview-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-y-auto bg-gradient-to-b from-zinc-50/60 to-white"
        >
          <div className="p-4 lg:p-6">
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em]">
              <Eye className="h-3.5 w-3.5 text-indigo-500" />
              <span className="brand-gradient-text">实时预览</span>
            </div>
            <div className="min-h-[400px] rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm shadow-zinc-200/50">
              {activeTab === "timeline" && <TimelineView nodes={resumeData.timeline} readOnly />}
              {activeTab === "skills" && <SkillMapView />}
              {activeTab === "architecture" && <ArchitectureView />}
              {mode === "interview" && activeTab === "role" && (
                <RoleUnderstandingView roleUnderstanding={resumeData.roleUnderstanding} />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
