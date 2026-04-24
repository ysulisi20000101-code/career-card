"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadInterviewProject } from "@/lib/projects/registry";
import { interviewToResumeData } from "@/lib/projects/adapters";
import { PreviewPage } from "@/components/preview/preview-page";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";

export default function InterviewPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const setResumeData = useResumeStore((s) => s.setResumeData);
  const setIsPresenting = useResumeStore((s) => s.setIsPresenting);

  useEffect(() => {
    const existing = loadInterviewProject(id);
    if (existing) setResumeData(interviewToResumeData(existing));
  }, [id, setResumeData]);

  return (
    <AppShell
      breadcrumbs={[
        { label: "工作台", href: "/workspace" },
        { label: "面试空间" },
        { label: "预览" },
      ]}
      actions={
        <>
          <Link href={`/workspace/interview/${id}/edit`}>
            <Button size="sm" variant="ghost" className="gap-1 rounded-full">
              <ArrowLeft className="h-3.5 w-3.5" />
              返回编辑
            </Button>
          </Link>
          <Button
            size="sm"
            variant="brand"
            className="gap-1.5 rounded-full"
            onClick={() => {
              setIsPresenting(true);
              router.push(`/workspace/interview/${id}/present`);
            }}
          >
            <Play className="h-3.5 w-3.5" />
            进入演示
          </Button>
        </>
      }
    >
      <PreviewPage
        mode="interview"
        onStartPresentation={() => router.push(`/workspace/interview/${id}/present`)}
      />
    </AppShell>
  );
}
