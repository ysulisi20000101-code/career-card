"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadResumeBase, loadPersonalProject } from "@/lib/projects/registry";
import { personalToResumeData } from "@/lib/projects/adapters";
import { PublishPage } from "@/components/publish/publish-page";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";

export default function SitePublishPage() {
  const params = useParams<{ id: string; siteId: string }>();
  const projectId = params.id;
  const siteId = params.siteId;
  const setResumeData = useResumeStore((state) => state.setResumeData);

  const base = useMemo(() => {
    let base = loadResumeBase(projectId);
    if (!base) {
      const legacy = loadPersonalProject(projectId);
      if (legacy) base = personalToResumeData(legacy);
    }
    return base;
  }, [projectId]);

  useEffect(() => {
    if (!base) return;
    setResumeData(base);
  }, [base, setResumeData]);

  const error = base ? "" : "未找到简历数据。";

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">{error}</p>
          <Link href="/workspace" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            返回工作台
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "工作台", href: "/workspace" },
        { label: "职业档案" },
        { label: "发布" },
      ]}
      actions={
        <Link href={`/workspace/personal/${projectId}/sites/${siteId}`}>
          <Button size="sm" variant="ghost" className="gap-1 rounded-full">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回 Agent 工作台
          </Button>
        </Link>
      }
    >
      <PublishPage projectId={projectId} siteId={siteId} />
    </AppShell>
  );
}
