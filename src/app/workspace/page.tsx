"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Briefcase,
  Eye,
  MonitorSmartphone,
  Pencil,
  Play,
  Plus,
  Rocket,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/shell/brand-logo";
import { listProjectRecords } from "@/lib/projects/registry";
import { formatRelativeTime } from "@/lib/utils";
import type { ProjectRecord } from "@/types/project";

export default function WorkspacePage() {
  const records: ProjectRecord[] = useMemo(() => listProjectRecords(), []);

  const personalRecords = useMemo(
    () => records.filter((item) => item.type === "personal"),
    [records],
  );
  const interviewRecords = useMemo(
    () => records.filter((item) => item.type === "interview"),
    [records],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100/60 via-violet-100/40 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-gradient-to-tl from-rose-100/40 via-amber-100/20 to-transparent blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-zinc-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <BrandLogo />
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900">
            返回首页
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
        <section className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-xs font-medium text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              我的空间
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 lg:text-4xl">
              让你的职业叙事，<span className="brand-gradient-text">被看见</span>
            </h1>
            <p className="max-w-xl text-sm text-zinc-500 lg:text-base">
              在这里管理你的个人网站与面试空间，随时回来继续编辑、预览或发布。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/workspace/personal/new">
              <Button variant="brand" className="gap-1.5 rounded-full px-5">
                <Plus className="h-4 w-4" />
                新建个人网站
              </Button>
            </Link>
            <Link href="/workspace/interview/new">
              <Button variant="outline" className="gap-1.5 rounded-full px-5">
                <Plus className="h-4 w-4" />
                新建面试空间
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <SpaceCard
            icon={Briefcase}
            gradient="from-indigo-500 to-violet-500"
            title="个人网站工作室"
            description="一键生成可投递的职业网站，用来展示你的成长叙事。"
            newHref="/workspace/personal/new"
            newLabel="新建个人网站"
            records={personalRecords}
            makeEditHref={(id) => `/workspace/personal/${id}/edit`}
            makePreviewHref={(id) => `/workspace/personal/${id}/preview`}
            makePublishHref={(id) => `/workspace/personal/${id}/publish`}
            emptyHint="还没有个人网站项目。上传一份简历，只需几步即可拥有专属展示页。"
            extraAction={{ label: "发布", icon: Share2 }}
          />

          <SpaceCard
            icon={MonitorSmartphone}
            gradient="from-rose-500 to-amber-500"
            title="面试空间工作室"
            description="构建独立的面试讲述空间，包含岗位理解与讲述节奏设计。"
            newHref="/workspace/interview/new"
            newLabel="新建面试空间"
            records={interviewRecords}
            makeEditHref={(id) => `/workspace/interview/${id}/edit`}
            makePreviewHref={(id) => `/workspace/interview/${id}/preview`}
            makePublishHref={(id) => `/workspace/interview/${id}/present`}
            emptyHint="还没有面试空间。可基于岗位快速搭建一个专属的讲述场域。"
            extraAction={{ label: "演示", icon: Play }}
          />
        </section>
      </main>
    </div>
  );
}

interface SpaceCardProps {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  title: string;
  description: string;
  newHref: string;
  newLabel: string;
  records: ProjectRecord[];
  makeEditHref: (id: string) => string;
  makePreviewHref: (id: string) => string;
  makePublishHref: (id: string) => string;
  emptyHint: string;
  extraAction: { label: string; icon: React.ComponentType<{ className?: string }> };
}

function SpaceCard({
  icon: Icon,
  gradient,
  title,
  description,
  newHref,
  newLabel,
  records,
  makeEditHref,
  makePreviewHref,
  makePublishHref,
  emptyHint,
  extraAction,
}: SpaceCardProps) {
  const ExtraIcon = extraAction.icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm backdrop-blur transition-all hover:border-zinc-200 hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          </div>
        </div>
        <Link href={newHref}>
          <Button size="sm" variant="brand" className="gap-1 rounded-full">
            <Plus className="h-3.5 w-3.5" />
            新建
          </Button>
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-zinc-800">暂无记录</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">{emptyHint}</p>
          <Link href={newHref} className="mt-4">
            <Button size="sm" variant="outline" className="gap-1 rounded-full">
              <Plus className="h-3.5 w-3.5" />
              {newLabel}
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-white/60">
          {records.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-3 py-3 text-sm transition-colors hover:bg-zinc-50/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-xs font-semibold uppercase text-white shadow-sm`}
                >
                  {item.title.slice(0, 2) || "CC"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">{item.title}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <StatusBadge status={item.status} />
                    <span>·</span>
                    <span>{formatRelativeTime(item.updatedAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link href={makeEditHref(item.id)}>
                  <Button size="sm" variant="ghost" className="gap-1 rounded-full">
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </Button>
                </Link>
                <Link href={makePreviewHref(item.id)}>
                  <Button size="sm" variant="ghost" className="gap-1 rounded-full">
                    <Eye className="h-3.5 w-3.5" />
                    预览
                  </Button>
                </Link>
                <Link href={makePublishHref(item.id)}>
                  <Button size="sm" variant="brand" className="gap-1 rounded-full">
                    {extraAction.label === "发布" ? (
                      <Rocket className="h-3.5 w-3.5" />
                    ) : (
                      <ExtraIcon className="h-3.5 w-3.5" />
                    )}
                    {extraAction.label}
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <Badge className="border border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-700">
        已发布
      </Badge>
    );
  }
  return (
    <Badge className="border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-600">
      草稿
    </Badge>
  );
}
