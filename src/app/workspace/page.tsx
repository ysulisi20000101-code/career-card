"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Briefcase,
  Copy,
  ExternalLink,
  MonitorSmartphone,
  Pencil,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/shell/brand-logo";
import { AccountPanel } from "@/components/commercial/account-panel";
import {
  archiveProjectRecord,
  deleteProjectRecord,
  duplicateProjectRecord,
  listProjectRecords,
  renameProjectRecord,
} from "@/lib/projects/registry";
import { formatRelativeTime } from "@/lib/utils";
import type { ProjectRecord } from "@/types/project";

interface EventSummary {
  slug: string;
  opens: number;
  effectiveViews: number;
  lastViewedAt?: string;
}

export default function WorkspacePage() {
  const [records, setRecords] = useState<ProjectRecord[]>(() => listProjectRecords());
  const [showArchived, setShowArchived] = useState(false);
  const [eventSummaries, setEventSummaries] = useState<Record<string, EventSummary>>({});

  const refreshRecords = () => setRecords(listProjectRecords());

  const publishedSlugs = useMemo(
    () => records.map((item) => item.publishedSlug).filter((slug): slug is string => Boolean(slug)),
    [records],
  );
  const activeEventSummaries = useMemo(
    () =>
      Object.fromEntries(
        publishedSlugs
          .map((slug) => [slug, eventSummaries[slug]] as const)
          .filter((entry): entry is [string, EventSummary] => Boolean(entry[1])),
      ),
    [eventSummaries, publishedSlugs],
  );

  useEffect(() => {
    if (publishedSlugs.length === 0) return;
    let cancelled = false;
    async function loadSummaries() {
      const response = await fetch(`/api/events?slugs=${publishedSlugs.join(",")}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { summaries?: EventSummary[] };
      if (cancelled) return;
      setEventSummaries(
        Object.fromEntries((payload.summaries ?? []).map((summary) => [summary.slug, summary])),
      );
    }
    void loadSummaries();
    return () => {
      cancelled = true;
    };
  }, [publishedSlugs]);

  const visibleRecords = useMemo(
    () => records.filter((item) => showArchived || item.status !== "archived"),
    [records, showArchived],
  );
  const personalRecords = visibleRecords.filter((item) => item.type === "personal");
  const interviewRecords = visibleRecords.filter((item) => item.type === "interview");
  const publishedCount = records.filter((item) => item.status === "published").length;
  const archivedCount = records.filter((item) => item.status === "archived").length;
  const effectiveViews = Object.values(activeEventSummaries).reduce((sum, item) => sum + item.effectiveViews, 0);

  const handleRename = (record: ProjectRecord) => {
    const title = window.prompt("输入新的项目名称", record.title);
    if (!title) return;
    renameProjectRecord(record.id, title);
    refreshRecords();
  };

  const handleDuplicate = (record: ProjectRecord) => {
    duplicateProjectRecord(record.id);
    refreshRecords();
  };

  const handleArchive = (record: ProjectRecord, archived: boolean) => {
    archiveProjectRecord(record.id, archived);
    refreshRecords();
  };

  const handleDelete = (record: ProjectRecord) => {
    if (!window.confirm(`确认删除「${record.title}」？删除后当前浏览器里的项目数据也会被移除。`)) return;
    deleteProjectRecord(record.id);
    refreshRecords();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100/60 via-sky-100/35 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-gradient-to-tl from-emerald-100/35 via-amber-100/20 to-transparent blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-zinc-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <AccountPanel compact />
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
        <section className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-xs font-medium text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              工作台
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-zinc-950 lg:text-4xl">
              管理职业档案、面试演示和公开链接
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-500 lg:text-base">
              主流程聚焦上传、校准、完整预览和发布。项目操作、访问反馈和多版本管理统一放在这里，避免编辑时被无关入口打断。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-1.5 rounded-full px-5"
              onClick={() => setShowArchived((value) => !value)}
            >
              {showArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {showArchived ? "隐藏归档" : `查看归档${archivedCount ? ` ${archivedCount}` : ""}`}
            </Button>
            <Link href="/workspace/personal/new">
              <Button variant="brand" className="gap-1.5 rounded-full px-5">
                <Plus className="h-4 w-4" />
                新建职业档案
              </Button>
            </Link>
            <Link href="/workspace/interview/new">
              <Button variant="outline" className="gap-1.5 rounded-full px-5">
                <Plus className="h-4 w-4" />
                新建面试演示
              </Button>
            </Link>
          </div>
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <MetricCard label="职业档案" value={`${records.filter((item) => item.type === "personal").length} 个`} />
          <MetricCard label="已发布" value={`${publishedCount} 个公开链接`} />
          <MetricCard label="有效浏览" value={`${effectiveViews} 次`} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <SpaceCard
            icon={Briefcase}
            gradient="from-indigo-500 to-violet-500"
            title="职业档案"
            description="面向面试官阅读的候选人职业站。"
            newHref="/workspace/personal/new"
            newLabel="新建职业档案"
            records={personalRecords}
            summaries={activeEventSummaries}
            makeEditHref={(id) => `/workspace/personal/${id}/edit`}
            makePrimaryHref={(item) => (item.status === "published" && item.publishedSlug ? `/p/${item.publishedSlug}` : `/workspace/personal/${item.id}/publish`)}
            primaryAction={(item) => (item.status === "published" && item.publishedSlug ? { label: "查看公开页", icon: ExternalLink } : { label: "发布", icon: Rocket })}
            emptyHint="还没有职业档案。上传一份简历后，可以先生成草稿，再校准并发布为稳定链接。"
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />

          <SpaceCard
            icon={MonitorSmartphone}
            gradient="from-rose-500 to-amber-500"
            title="面试演示"
            description="把经历、岗位理解和讲述节奏组织成演示场景。"
            newHref="/workspace/interview/new"
            newLabel="新建面试演示"
            records={interviewRecords}
            summaries={activeEventSummaries}
            makeEditHref={(id) => `/workspace/interview/${id}/edit`}
            makePrimaryHref={(item) => `/workspace/interview/${item.id}/present`}
            primaryAction={() => ({ label: "演示", icon: Play })}
            emptyHint="还没有面试演示。可以基于目标岗位搭建讲述节奏。"
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-white/80 p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-zinc-800">{value}</p>
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
  summaries: Record<string, EventSummary>;
  makeEditHref: (id: string) => string;
  makePrimaryHref: (record: ProjectRecord) => string;
  primaryAction: (record: ProjectRecord) => { label: string; icon: React.ComponentType<{ className?: string }> };
  emptyHint: string;
  onRename: (record: ProjectRecord) => void;
  onDuplicate: (record: ProjectRecord) => void;
  onArchive: (record: ProjectRecord, archived: boolean) => void;
  onDelete: (record: ProjectRecord) => void;
}

function SpaceCard({
  icon: Icon,
  gradient,
  title,
  description,
  newHref,
  newLabel,
  records,
  summaries,
  makeEditHref,
  makePrimaryHref,
  primaryAction,
  emptyHint,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
}: SpaceCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-100 bg-white/80 p-6 shadow-sm backdrop-blur transition-all hover:border-zinc-200 hover:shadow-md">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-10 text-center">
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
        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100 bg-white/60">
          {records.map((item) => {
            const action = primaryAction(item);
            const ActionIcon = action.icon;
            const summary = item.publishedSlug ? summaries[item.publishedSlug] : undefined;
            return (
              <li key={item.id} className="flex flex-col gap-3 px-3 py-3 text-sm transition-colors hover:bg-zinc-50/70">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-xs font-semibold uppercase text-white shadow-sm`}>
                      {item.title.slice(0, 2) || "CC"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{item.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
                        <StatusBadge status={item.status} />
                        <span>·</span>
                        <span>{formatRelativeTime(item.updatedAt)}</span>
                        {summary && (
                          <>
                            <span>·</span>
                            <span>{summary.opens} 打开 / {summary.effectiveViews} 有效浏览</span>
                          </>
                        )}
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
                    <Link href={makePrimaryHref(item)}>
                      <Button size="sm" variant="brand" className="gap-1 rounded-full">
                        <ActionIcon className="h-3.5 w-3.5" />
                        {action.label}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <Button size="sm" variant="ghost" className="h-7 rounded-full px-2 text-[11px]" onClick={() => onRename(item)}>
                    重命名
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full px-2 text-[11px]" onClick={() => onDuplicate(item)}>
                    <Copy className="h-3 w-3" />
                    复制
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full px-2 text-[11px]" onClick={() => onArchive(item, item.status !== "archived")}>
                    {item.status === "archived" ? <RotateCcw className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                    {item.status === "archived" ? "恢复" : "归档"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full px-2 text-[11px] text-rose-600 hover:text-rose-700" onClick={() => onDelete(item)}>
                    <Trash2 className="h-3 w-3" />
                    删除
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectRecord["status"] }) {
  if (status === "published") {
    return (
      <Badge className="border border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-700">
        已发布
      </Badge>
    );
  }
  if (status === "archived") {
    return (
      <Badge className="border border-zinc-200 bg-zinc-100 text-[10px] font-medium text-zinc-500">
        已归档
      </Badge>
    );
  }
  return (
    <Badge className="border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-600">
      草稿
    </Badge>
  );
}
