"use client";

import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Briefcase,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  MonitorSmartphone,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Rocket,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo } from "@/components/shell/brand-logo";
import {
  archiveProjectRecord,
  deleteProjectRecord,
  duplicateProjectRecord,
  listProjectRecords,
  listSitesByProject,
  migrateProjectToMultiSite,
  renameProjectRecord,
  loadPersonalProject,
  loadInterviewProject,
  saveInterviewProject,
} from "@/lib/projects/registry";
import { interviewToResumeData } from "@/lib/projects/adapters";
import { generatePresentationDraft } from "@/lib/presentation/generator";
import { savePresentationDraft, deletePresentationDraft } from "@/lib/presentation/storage";
import { formatRelativeTime } from "@/lib/utils";
import { SkeletonCard } from "@/components/skeleton";
import type { ProjectRecord } from "@/types/project";
import type { PersonalSite } from "@/types/site";

interface EventSummary {
  slug: string;
  opens: number;
  effectiveViews: number;
  contactClicks: number;
  lastViewedAt?: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const [records, setRecords] = useState<ProjectRecord[]>(() => listProjectRecords());
  const [showArchived, setShowArchived] = useState(false);
  const [eventSummaries, setEventSummaries] = useState<Record<string, EventSummary>>({});
  const [mounted, setMounted] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Mark as mounted after first render to avoid hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  const refreshRecords = () => setRecords(listProjectRecords());

  // Auto-migrate legacy projects without sites (runs once after mount)
  const migrationRunRef = useRef(false);
  useEffect(() => {
    if (!mounted || migrationRunRef.current) return;
    let changed = false;
    for (const record of records) {
      if (record.type !== "personal") continue;
      if (record.siteIds && record.siteIds.length > 0) continue;
      const legacy = loadPersonalProject(record.id);
      if (legacy) {
        migrateProjectToMultiSite(record.id);
        changed = true;
      }
    }
    if (changed) {
      migrationRunRef.current = true;
      refreshRecords();
    }
  }, [mounted, records]);

  // Load sites for all personal projects
  const projectSites = useMemo(() => {
    const map = new Map<string, PersonalSite[]>();
    for (const record of records.filter((r) => r.type === "personal")) {
      map.set(record.id, listSitesByProject(record.id));
    }
    return map;
  }, [records]);
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
  const opens = Object.values(activeEventSummaries).reduce((sum, item) => sum + item.opens, 0);
  const contactClicks = Object.values(activeEventSummaries).reduce((sum, item) => sum + item.contactClicks, 0);

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

  const handleGenerateStoryDeck = (record: ProjectRecord) => {
    if (record.type !== "interview") return;
    const interviewData = loadInterviewProject(record.id);
    if (!interviewData) return;
    setGeneratingId(record.id);
    try {
      const resumeData = interviewToResumeData(interviewData);
      const draft = generatePresentationDraft(resumeData);
      // Delete old draft after successful generation to prevent data loss
      if (interviewData.presentationDraftId) {
        deletePresentationDraft(interviewData.presentationDraftId);
      }
      savePresentationDraft(draft);
      saveInterviewProject(record.id, {
        ...interviewData,
        resume: resumeData,
        roleUnderstanding: resumeData.roleUnderstanding,
        presentationDraftId: draft.id,
      });
      refreshRecords();
      router.push(`/workspace/interview/${record.id}/present`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDeleteStoryDeck = (record: ProjectRecord) => {
    if (record.type !== "interview") return;
    const interviewData = loadInterviewProject(record.id);
    if (!interviewData?.presentationDraftId) return;
    deletePresentationDraft(interviewData.presentationDraftId);
    saveInterviewProject(record.id, { ...interviewData, presentationDraftId: undefined });
    refreshRecords();
  };

  const interviewDraftStatusMap = useMemo(() => {
    const map = new Map<string, "none" | "ready">();
    for (const record of records) {
      if (record.type !== "interview") continue;
      const data = loadInterviewProject(record.id);
      map.set(record.id, data?.presentationDraftId ? "ready" : "none");
    }
    return map;
  }, [records]);

  const getInterviewDraftStatus = (record: ProjectRecord): "none" | "ready" =>
    interviewDraftStatusMap.get(record.id) ?? "none";

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
            <Link href="/" className="text-xs text-muted-foreground hover:text-zinc-900">
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
              你的 Career Card 工作台
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground lg:text-base">
              管理职业网站和面试空间。上传简历后先生成完整初稿，再围绕讲述重点和表达节奏微调。
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

        {mounted && records.length === 0 && (
          <section className="mb-10 flex flex-col items-center rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-b from-indigo-50/60 to-white px-6 py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">还没有职业档案</h2>
            <p className="mt-2 max-w-md text-sm text-zinc-500">
              上传一份简历，AI 自动生成你的第一个职业网站。支持 PDF 简历解析、内容微调和发布分享。
            </p>
            <Link href="/workspace/personal/new" className="mt-6">
              <Button variant="brand" size="lg" className="gap-2 rounded-full px-8 shadow-md shadow-indigo-500/25">
                <FileText className="h-5 w-5" />
                上传简历并生成职业网站
              </Button>
            </Link>
          </section>
        )}

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <MetricCard label="职业档案" value={`${records.filter((item) => item.type === "personal").length} 个`} icon={FileText} />
          <MetricCard label="已发布" value={`${publishedCount} 个公开链接`} icon={Rocket} />
          <MetricCard label="阅读反馈" value={`${opens} 次打开 / ${contactClicks} 次联系点击`} icon={Eye} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {!mounted ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
          <>
          <SpaceCard
            icon={Briefcase}
            gradient="from-indigo-500 to-violet-500"
            title="职业档案"
            description="面向面试官阅读的候选人职业站。"
            newHref="/workspace/personal/new"
            newLabel="新建职业档案"
            records={personalRecords}
            sites={projectSites}
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
            description="把经历亮点和讲述节奏组织成演示场景。"
            newHref="/workspace/interview/new"
            newLabel="新建面试演示"
            records={interviewRecords}
            summaries={activeEventSummaries}
            makeEditHref={(id) => `/workspace/interview/${id}/edit`}
            makePrimaryHref={(item) => `/workspace/interview/${item.id}/present`}
            primaryAction={(item) => {
              const status = getInterviewDraftStatus(item);
              return status === "ready"
                ? { label: "面试 PPT", icon: Play }
                : { label: "演示", icon: Play };
            }}
            emptyHint="还没有面试演示。上传简历后可以直接生成一版可投屏的演示 PPT。"
            onRename={handleRename}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onDelete={handleDelete}
            extraActions={(item) => {
              if (item.type !== "interview") return null;
              const status = getInterviewDraftStatus(item);
              if (status === "ready") {
                return (
                  <Button
                    key="delete-deck"
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-full px-2 text-[11px] text-rose-600 hover:text-rose-700"
                    onClick={() => handleDeleteStoryDeck(item)}
                  >
                    <Trash2 className="h-3 w-3" />
                    删除演示稿
                  </Button>
                );
              }
              return (
                <Button
                  key="gen-deck"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 rounded-full px-2 text-[11px]"
                  disabled={generatingId === item.id}
                  onClick={() => handleGenerateStoryDeck(item)}
                >
                  <Sparkles className="h-3 w-3" />
                  {generatingId === item.id ? "生成中..." : "生成面试 PPT"}
                </Button>
              );
            }}
          />
          </>
          )}
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white/80 p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-800">{value}</p>
      </div>
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
  sites?: Map<string, PersonalSite[]>;
  summaries: Record<string, EventSummary>;
  makeEditHref: (id: string) => string;
  makePrimaryHref: (record: ProjectRecord) => string;
  primaryAction: (record: ProjectRecord) => { label: string; icon: React.ComponentType<{ className?: string }> };
  emptyHint: string;
  onRename: (record: ProjectRecord) => void;
  onDuplicate: (record: ProjectRecord) => void;
  onArchive: (record: ProjectRecord, archived: boolean) => void;
  onDelete: (record: ProjectRecord) => void;
  extraActions?: (record: ProjectRecord) => React.ReactNode;
}

function SpaceCard({
  icon: Icon,
  gradient,
  title,
  description,
  newHref,
  newLabel,
  records,
  sites,
  summaries,
  makeEditHref,
  makePrimaryHref,
  primaryAction,
  emptyHint,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
  extraActions,
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
          <Button size="sm" variant="brand" className="gap-1 rounded-full" aria-label={newLabel}>
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
                        <StatusBadge status={item.status} labels={{ draft: "草稿", published: "已发布", archived: "已归档" }} />
                        <span>·</span>
                        <span>{formatRelativeTime(item.updatedAt)}</span>
                        {summary && (
                          <>
                            <span>·</span>
                            <span>{summary.opens} 打开 / {summary.contactClicks} 联系</span>
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
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {extraActions?.(item)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 rounded-full p-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        <span className="sr-only">更多操作</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => onRename(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(item)}>
                        <Copy className="h-3.5 w-3.5" />
                        复制
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchive(item, item.status !== "archived")}>
                        {item.status === "archived" ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        {item.status === "archived" ? "恢复" : "归档"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Sites sub-list for personal projects */}
                {sites && item.type === "personal" && (
                  <SitesSubList
                    projectId={item.id}
                    projectSites={sites}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SitesSubList({ projectId, projectSites }: { projectId: string; projectSites: Map<string, PersonalSite[]> }) {
  const sites = projectSites.get(projectId) ?? [];
  if (sites.length === 0) return null;

  return (
    <div className="ml-12 border-l-2 border-zinc-100 pl-4 pt-1">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">目标站点</p>
      <ul className="space-y-2">
        {sites.map((site) => (
          <li key={site.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2.5 text-sm shadow-sm transition-shadow hover:shadow">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${site.status === "published" ? "bg-emerald-400" : site.status === "archived" ? "bg-zinc-300" : "bg-amber-400"}`} />
              <span className="truncate text-sm font-medium text-zinc-700">{site.targetRole}</span>
              <StatusBadge status={site.status} />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {site.status === "published" && site.slug ? (
                <a href={`/p/${site.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full text-[11px]">
                    <ExternalLink className="h-3 w-3" />
                    查看
                  </Button>
                </a>
              ) : (
                <Link href={`/workspace/personal/${projectId}/sites/${site.id}`}>
                  <Button size="sm" variant="brand" className="h-7 gap-1 rounded-full text-[11px]">
                    <Rocket className="h-3 w-3" />
                    进入工作台
                  </Button>
                </Link>
              )}
            </div>
          </li>
        ))}
        <li>
          <Link href={`/workspace/personal/${projectId}/sites/new`}>
            <Button size="sm" variant="ghost" className="h-8 gap-1 rounded-full text-[11px] text-zinc-500 hover:text-indigo-600">
              <Plus className="h-3 w-3" />
              新建站点
            </Button>
          </Link>
        </li>
      </ul>
    </div>
  );
}

