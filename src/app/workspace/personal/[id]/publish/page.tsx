"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadPersonalProject, updateProjectRecord } from "@/lib/projects/registry";
import { personalToResumeData } from "@/lib/projects/adapters";
import { PublishPage } from "@/components/publish/publish-page";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";

export default function PersonalPublishPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const setResumeData = useResumeStore((state) => state.setResumeData);

  useEffect(() => {
    const existing = loadPersonalProject(id);
    if (existing) setResumeData(personalToResumeData(existing));
  }, [id, setResumeData]);

  return (
    <AppShell
      tone="muted"
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
      <div className="h-full overflow-auto">
        <PublishPage
          onPublished={({ slug, publishedAt }) => {
            updateProjectRecord(id, {
              status: "published",
              publishedSlug: slug,
              publishedAt,
            });
          }}
        />
      </div>
    </AppShell>
  );
}
