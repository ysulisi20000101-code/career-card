"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { useResumeStore } from "@/store/resume-store";
import { loadPersonalProject } from "@/lib/projects/registry";
import { personalToResumeData } from "@/lib/projects/adapters";
import { PublishPage } from "@/components/publish/publish-page";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { useClientValue } from "@/hooks/use-client-value";

export default function PersonalPublishPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const setResumeData = useResumeStore((state) => state.setResumeData);
  const { value: existing, loading } = useClientValue(() => loadPersonalProject(id), null, [id]);

  useEffect(() => {
    if (existing) setResumeData(personalToResumeData(existing));
  }, [existing, setResumeData]);

  if (loading) {
    return (
      <LoadingPage />
    );
  }

  if (!existing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">项目未找到</p>
          <p className="mt-2 text-sm text-zinc-500">该项目可能已被删除。</p>
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
        <Link href={`/workspace/personal/${id}/preview`}>
          <Button size="sm" variant="ghost" className="gap-1 rounded-full">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回预览
          </Button>
        </Link>
      }
    >
      <PublishPage projectId={id} />
    </AppShell>
  );
}
