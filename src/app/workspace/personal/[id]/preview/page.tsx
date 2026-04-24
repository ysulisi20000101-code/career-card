"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Rocket } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadPersonalProject } from "@/lib/projects/registry";
import { personalToResumeData } from "@/lib/projects/adapters";
import { PreviewPage } from "@/components/preview/preview-page";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";

export default function PersonalPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const setResumeData = useResumeStore((s) => s.setResumeData);

  useEffect(() => {
    const existing = loadPersonalProject(id);
    if (existing) setResumeData(personalToResumeData(existing));
  }, [id, setResumeData]);

  return (
    <AppShell
      breadcrumbs={[
        { label: "工作台", href: "/workspace" },
        { label: "个人网站" },
        { label: "预览" },
      ]}
      actions={
        <>
          <Link href={`/workspace/personal/${id}/edit`}>
            <Button size="sm" variant="ghost" className="gap-1 rounded-full">
              <ArrowLeft className="h-3.5 w-3.5" />
              返回编辑
            </Button>
          </Link>
          <Link href={`/workspace/personal/${id}/publish`}>
            <Button size="sm" variant="brand" className="gap-1.5 rounded-full">
              <Rocket className="h-3.5 w-3.5" />
              发布分享
            </Button>
          </Link>
        </>
      }
    >
      <PreviewPage mode="personal" />
    </AppShell>
  );
}
