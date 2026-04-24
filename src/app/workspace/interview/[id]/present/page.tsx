"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadInterviewProject } from "@/lib/projects/registry";
import { interviewToResumeData } from "@/lib/projects/adapters";
import { PresentationMode } from "@/components/presentation/presentation-mode";
import { BrandLogo } from "@/components/shell/brand-logo";
import { Button } from "@/components/ui/button";

export default function InterviewPresentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const setResumeData = useResumeStore((s) => s.setResumeData);
  const setIsPresenting = useResumeStore((s) => s.setIsPresenting);

  useEffect(() => {
    const existing = loadInterviewProject(id);
    if (existing) setResumeData(interviewToResumeData(existing));
    setIsPresenting(true);
    return () => setIsPresenting(false);
  }, [id, setResumeData, setIsPresenting]);

  return (
    <div className="relative h-screen bg-zinc-50">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-3">
        <div className="pointer-events-auto rounded-full border border-white/40 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur">
          <BrandLogo href="/" size="sm" />
        </div>
        <div className="pointer-events-auto flex gap-2 rounded-full border border-white/40 bg-white/70 p-1 shadow-sm backdrop-blur">
          <Link href={`/workspace/interview/${id}/preview`}>
            <Button size="sm" variant="ghost" className="gap-1 rounded-full">
              <ArrowLeft className="h-3.5 w-3.5" />
              返回预览
            </Button>
          </Link>
          <Link href="/workspace">
            <Button size="sm" variant="ghost" className="gap-1 rounded-full">
              <LayoutDashboard className="h-3.5 w-3.5" />
              工作台
            </Button>
          </Link>
        </div>
      </div>
      <PresentationMode includeRoleSections />
    </div>
  );
}
