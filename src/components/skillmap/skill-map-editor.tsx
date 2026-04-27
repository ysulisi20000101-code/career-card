"use client";

import { RefreshCw } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import SkillMapView from "@/components/skillmap/skill-map-view";
import { buildSkillNodesFromProfile, buildSkillProfileFromResume } from "@/lib/skills/profile";
import { cn } from "@/lib/utils";

export default function SkillMapEditor({ className }: { className?: string }) {
  const resumeData = useResumeStore((state) => state.resumeData);
  const setResumeData = useResumeStore((state) => state.setResumeData);

  const refreshSkillProfile = () => {
    if (!resumeData) return;
    const skillProfile = buildSkillProfileFromResume(resumeData);
    setResumeData({
      ...resumeData,
      skillProfile,
      roleTemplateId: skillProfile.templateId,
      skills: buildSkillNodesFromProfile(skillProfile),
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">职业技能导图</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            技能图谱会根据简历自动判断职业模板，展示完整能力地图，并高亮简历中已体现的能力。
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={refreshSkillProfile}>
          <RefreshCw className="h-3.5 w-3.5" />
          重新识别
        </Button>
      </div>
      <div className="min-h-[520px] rounded-lg border border-zinc-100 bg-white shadow-sm">
        <SkillMapView data={resumeData} />
      </div>
    </div>
  );
}
