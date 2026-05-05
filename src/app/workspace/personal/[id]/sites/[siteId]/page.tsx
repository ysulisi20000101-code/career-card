"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Plus, Rocket } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import {
  loadResumeBase,
  saveResumeBase,
  loadSite,
  saveSite,
  listSitesByProject,
  loadPersonalProject,
  savePersonalProject,
} from "@/lib/projects/registry";
import { personalToResumeData, resumeDataToPersonal } from "@/lib/projects/adapters";
import { AgentSiteWorkbench } from "@/components/agent-first/agent-site-workbench";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import type { SiteThemeId } from "@/lib/site-styles/theme-config";
import type { CareerSiteDraft } from "@/lib/agent/site-generator/types";
import type { ResumeData } from "@/types";

export default function SiteAgentWorkbenchPage() {
  const params = useParams<{ id: string; siteId: string }>();
  const router = useRouter();
  const projectId = params.id;
  const siteId = params.siteId;

  const setResumeData = useResumeStore((s) => s.setResumeData);
  const resumeData = useResumeStore((s) => s.resumeData);
  const setStoreDraftData = useResumeStore((s) => s.setDraftData);

  const loadState = useMemo(() => {
    // Try new resume base key first, fall back to legacy
    let base = loadResumeBase(projectId);
    if (!base) {
      const legacy = loadPersonalProject(projectId);
      if (legacy) {
        base = personalToResumeData(legacy);
      }
    }
    const site = loadSite(siteId);
    return { base, site, siteMissing: Boolean(base && !site) };
  }, [projectId, siteId]);

  const activeResumeData = resumeData ?? loadState.base;

  // Synchronize loaded local project data into the shared store.
  useEffect(() => {
    if (loadState.base) setResumeData(loadState.base);
    if (loadState.site?.draft) setStoreDraftData(loadState.site.draft as CareerSiteDraft);
  }, [loadState.base, loadState.site, setResumeData, setStoreDraftData]);

  // Save draft back to site when it changes
  const handleDraftSave = useCallback(
    (draft: CareerSiteDraft) => {
      const site = loadSite(siteId);
      if (site) {
        saveSite({ ...site, draft: draft as CareerSiteDraft, updatedAt: new Date().toISOString() });
      }
    },
    [siteId],
  );

  // Save materialized data to resume base
  const handleRenderedDataChange = useCallback(
    (nextData: ResumeData) => {
      savePersonalProject(projectId, resumeDataToPersonal(nextData));
      saveResumeBase(projectId, nextData);
    },
    [projectId],
  );

  const handleThemeChange = useCallback(
    (themeId: SiteThemeId) => {
      const current = useResumeStore.getState().resumeData;
      if (current) {
        savePersonalProject(projectId, resumeDataToPersonal({ ...current, siteThemeId: themeId }));
      }
    },
    [projectId],
  );

  // Site selector
  const sites = useMemo(() => {
    try {
      return listSitesByProject(projectId);
    } catch {
      return [];
    }
  }, [projectId]);

  if (loadState.siteMissing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">站点未找到</p>
          <p className="mt-2 text-sm text-zinc-500">该站点可能已被删除。</p>
          <Link href="/workspace" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            返回工作台
          </Link>
        </div>
      </div>
    );
  }

  if (!activeResumeData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">未找到简历数据</p>
          <p className="mt-2 text-sm text-zinc-500">请先上传简历。</p>
          <Link href={`/workspace/personal/${projectId}/edit`} className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            前往上传简历
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
        { label: "Agent 工作台" },
      ]}
      actions={
        <>
          {/* Site selector */}
          {sites.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <select
                className="bg-transparent text-xs font-medium text-zinc-700 outline-none"
                value={siteId}
                onChange={(e) => {
                  const newId = e.target.value;
                  if (newId !== siteId) {
                    router.push(`/workspace/personal/${projectId}/sites/${newId}`);
                  }
                }}
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.targetRole} {s.status === "published" ? " (已发布)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Link href={`/workspace/personal/${projectId}/sites/new`}>
            <Button size="sm" variant="outline" className="gap-1 rounded-full">
              <Plus className="h-3.5 w-3.5" />
              新建站点
            </Button>
          </Link>
          <Link href={`/workspace/personal/${projectId}/sites/${siteId}/publish`}>
            <Button size="sm" variant="brand" className="gap-1.5 rounded-full">
              <Rocket className="h-3.5 w-3.5" />
              发布
            </Button>
          </Link>
        </>
      }
    >
      <div className="h-full overflow-hidden bg-zinc-100">
        <AgentSiteWorkbench
          resumeData={activeResumeData}
          siteId={siteId}
          themeId={(activeResumeData.siteThemeId as SiteThemeId) || "warm-business"}
          onRenderedDataChange={handleRenderedDataChange}
          onThemeChange={handleThemeChange}
          onDraftSave={handleDraftSave}
        />
      </div>
    </AppShell>
  );
}
