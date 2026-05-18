"use client";

import type { ProjectRecord, PersonalSiteData, InterviewProjectData } from "@/types/project";
import type { ResumeData } from "@/types";
import type { PersonalSite } from "@/types/site";
import { resumeDataToPersonal } from "@/lib/projects/adapters";
import { generateId } from "@/lib/utils";
import {
  deletePresentationDraft,
  loadPresentationDraft,
  savePresentationDraft,
} from "@/lib/presentation/storage";

const REGISTRY_KEY = "career-card:workspace:records";
const PERSONAL_PREFIX = "career-card:workspace:personal:";
const INTERVIEW_PREFIX = "career-card:workspace:interview:";
const LEGACY_EDITOR_KEY = "career-card:editor";
const LEGACY_MIGRATED_KEY = "career-card:workspace:migrated-legacy";

// ─── Multi-site storage keys ─────────────────────────────────────────────────
const RESUME_BASE_PREFIX = "career-card:resume:v2:";
const SITE_PREFIX = "career-card:site:v1:";
const PROJECT_SITES_PREFIX = "career-card:project-sites:v1:";
const MULTI_SITE_MIGRATED = "career-card:workspace:multi-site-migrated";

let legacyMigrationDone = false;

function nowIso() {
  return new Date().toISOString();
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    console.warn("[career-card] localStorage.setItem failed — storage may be full or unavailable", { key });
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn("[career-card] JSON.parse failed for localStorage value");
    return null;
  }
}

export function listProjectRecords(): ProjectRecord[] {
  if (typeof window === "undefined") return [];
  migrateLegacyEditorData();
  const records = safeParse<ProjectRecord[]>(window.localStorage.getItem(REGISTRY_KEY)) ?? [];
  return records.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
}

function saveProjectRecords(records: ProjectRecord[]): void {
  if (typeof window === "undefined") return;
  safeSetItem(REGISTRY_KEY, JSON.stringify(records));
}

function migrateLegacyEditorData() {
  if (legacyMigrationDone) return;
  if (window.localStorage.getItem(LEGACY_MIGRATED_KEY) === "1") { legacyMigrationDone = true; return; }

  const legacyRaw = window.localStorage.getItem(LEGACY_EDITOR_KEY);
  const legacyParsed = safeParse<{ state?: { resumeData?: ResumeData | null } }>(legacyRaw);
  const legacyResume = legacyParsed?.state?.resumeData;
  if (!legacyResume) {
    safeSetItem(LEGACY_MIGRATED_KEY, "1");
    legacyMigrationDone = true;
    return;
  }

  const existing = safeParse<ProjectRecord[]>(window.localStorage.getItem(REGISTRY_KEY)) ?? [];
  if (existing.length === 0) {
    const record: ProjectRecord = {
      id: generateId(),
      type: "personal",
      title: "迁移的职业档案草稿",
      status: "draft",
      siteIds: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    safeSetItem(PERSONAL_PREFIX + record.id, JSON.stringify(resumeDataToPersonal(legacyResume)));
    safeSetItem(REGISTRY_KEY, JSON.stringify([record]));
  }
  safeSetItem(LEGACY_MIGRATED_KEY, "1");
  window.localStorage.removeItem(LEGACY_EDITOR_KEY);
  legacyMigrationDone = true;
}

export function upsertProjectRecord(record: ProjectRecord): void {
  if (typeof window === "undefined") return;
  const records = listProjectRecords();
  const next = [...records.filter((item) => item.id !== record.id), record];
  safeSetItem(REGISTRY_KEY, JSON.stringify(next));
}

export function createProjectRecord(type: "personal" | "interview", title: string): ProjectRecord {
  const trimmed = title.trim().slice(0, 100);
  const record: ProjectRecord = {
    id: generateId(),
    type,
    title: trimmed || (type === "personal" ? "职业档案草稿" : "面试演示"),
    status: "draft",
    siteIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  upsertProjectRecord(record);
  return record;
}

export function updateProjectRecord(
  id: string,
  patch: Partial<Omit<ProjectRecord, "id" | "type">>,
): void {
  const records = listProjectRecords();
  const existing = records.find((item) => item.id === id);
  if (!existing) return;
  upsertProjectRecord({
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  });
}

export function renameProjectRecord(id: string, title: string): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  updateProjectRecord(id, { title: trimmed });
}

export function archiveProjectRecord(id: string, archived = true): void {
  const records = listProjectRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const record = { ...records[idx] };
  if (archived) {
    record._prevStatus = record.status;
    record.status = "archived";
  } else {
    record.status = (record._prevStatus || "draft") as ProjectRecord["status"];
    delete record._prevStatus;
  }
  record.updatedAt = new Date().toISOString();
  const next = [...records];
  next[idx] = record;
  saveProjectRecords(next);
}

export function deleteProjectRecord(id: string): void {
  if (typeof window === "undefined") return;
  const records = listProjectRecords();
  const existing = records.find((item) => item.id === id);
  if (!existing) return;
  // Clean up associated sites
  for (const siteId of existing.siteIds) {
    window.localStorage.removeItem(SITE_PREFIX + siteId);
  }
  window.localStorage.removeItem(PROJECT_SITES_PREFIX + id);
  // Clean up associated presentation draft
  if (existing.type === "interview") {
    const data = safeParse<InterviewProjectData>(window.localStorage.getItem(INTERVIEW_PREFIX + id));
    if (data?.presentationDraftId) {
      deletePresentationDraft(data.presentationDraftId);
    }
  }
  safeSetItem(
    REGISTRY_KEY,
    JSON.stringify(records.filter((item) => item.id !== id)),
  );
  window.localStorage.removeItem(PERSONAL_PREFIX + id);
  window.localStorage.removeItem(INTERVIEW_PREFIX + id);
}

export function duplicateProjectRecord(id: string): ProjectRecord | null {
  if (typeof window === "undefined") return null;
  const records = listProjectRecords();
  const existing = records.find((item) => item.id === id);
  if (!existing) return null;

  const newId = generateId();
  const duplicated: ProjectRecord = {
    ...existing,
    id: newId,
    title: `${existing.title} 副本`,
    status: "draft",
    siteIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    publishedSlug: undefined,
    publishedAt: undefined,
  };

  // Duplicate resume base (v2 key)
  const oldResumeBase = loadResumeBase(id) ?? safeParse<PersonalSiteData>(window.localStorage.getItem(PERSONAL_PREFIX + id));
  if (oldResumeBase) {
    saveResumeBase(newId, oldResumeBase);
  }

  // Duplicate sites (reset slug/published state)
  const newSiteIds: string[] = [];
  const oldSites = listSitesByProject(id);
  for (const oldSite of oldSites) {
    const newSiteId = generateId();
    const newSite: PersonalSite = {
      ...oldSite,
      id: newSiteId,
      projectId: newId,
      slug: null,
      status: "draft",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      publishedAt: undefined,
    };
    saveSite(newSite);
    newSiteIds.push(newSiteId);
  }
  // If no sites existed, create a default site from legacy data
  if (newSiteIds.length === 0 && oldResumeBase) {
    const defaultSite = createSite(newId, {
      targetRole: oldResumeBase.roleUnderstanding?.targetRoleTitle ?? oldResumeBase.profile?.title ?? "",
    });
    if (defaultSite) newSiteIds.push(defaultSite.id);
  }
  duplicated.siteIds = newSiteIds;

  // Also duplicate legacy personal data for backward compat
  const sourceKey = existing.type === "personal" ? PERSONAL_PREFIX + id : INTERVIEW_PREFIX + id;
  const targetKey =
    duplicated.type === "personal"
      ? PERSONAL_PREFIX + duplicated.id
      : INTERVIEW_PREFIX + duplicated.id;
  const sourceData = window.localStorage.getItem(sourceKey);
  if (sourceData) safeSetItem(targetKey, sourceData);

  // Duplicate presentation draft for interview projects
  if (existing.type === "interview" && sourceData) {
    const sourceInterview = safeParse<InterviewProjectData>(sourceData);
    if (sourceInterview?.presentationDraftId) {
      const originalDraft = loadPresentationDraft(sourceInterview.presentationDraftId);
      if (originalDraft) {
        const newDraft = { ...originalDraft, id: generateId(), createdAt: nowIso(), updatedAt: nowIso() };
        savePresentationDraft(newDraft);
        const duplicatedData = safeParse<InterviewProjectData>(window.localStorage.getItem(targetKey));
        if (duplicatedData) {
          duplicatedData.presentationDraftId = newDraft.id;
          safeSetItem(targetKey, JSON.stringify(duplicatedData));
        }
      }
    }
  }
  upsertProjectRecord(duplicated);
  return duplicated;
}

export function savePersonalProject(id: string, data: PersonalSiteData): void {
  if (typeof window === "undefined") return;
  safeSetItem(PERSONAL_PREFIX + id, JSON.stringify(data));
  // Also save to new resume base key
  saveResumeBase(id, data);
  updateProjectRecord(id, {});
}

export function loadPersonalProject(id: string): PersonalSiteData | null {
  if (typeof window === "undefined") return null;
  return safeParse<PersonalSiteData>(window.localStorage.getItem(PERSONAL_PREFIX + id));
}

export function saveInterviewProject(id: string, data: InterviewProjectData): void {
  if (typeof window === "undefined") return;
  safeSetItem(INTERVIEW_PREFIX + id, JSON.stringify(data));
  updateProjectRecord(id, {});
}

export function loadInterviewProject(id: string): InterviewProjectData | null {
  if (typeof window === "undefined") return null;
  return safeParse<InterviewProjectData>(window.localStorage.getItem(INTERVIEW_PREFIX + id));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Multi-site: Resume Base
// ═══════════════════════════════════════════════════════════════════════════════

export function saveResumeBase(projectId: string, data: ResumeData): void {
  if (typeof window === "undefined") return;
  safeSetItem(RESUME_BASE_PREFIX + projectId, JSON.stringify(data));
}

export function loadResumeBase(projectId: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  // Auto-migrate from legacy key if needed
  const existing = safeParse<ResumeData>(window.localStorage.getItem(RESUME_BASE_PREFIX + projectId));
  if (existing) return existing;
  const legacyKey = window.localStorage.getItem(MULTI_SITE_MIGRATED + projectId);
  if (legacyKey === "1") return null;
  const legacy = safeParse<PersonalSiteData>(window.localStorage.getItem(PERSONAL_PREFIX + projectId));
  if (legacy) {
    migrateProjectToMultiSite(projectId);
    return safeParse<ResumeData>(window.localStorage.getItem(RESUME_BASE_PREFIX + projectId));
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Multi-site: Site CRUD
// ═══════════════════════════════════════════════════════════════════════════════

export function saveSite(site: PersonalSite): void {
  if (typeof window === "undefined") return;
  safeSetItem(SITE_PREFIX + site.id, JSON.stringify(site));
}

export function loadSite(siteId: string): PersonalSite | null {
  if (typeof window === "undefined") return null;
  return safeParse<PersonalSite>(window.localStorage.getItem(SITE_PREFIX + siteId));
}

export function deleteSite(siteId: string): void {
  if (typeof window === "undefined") return;
  const site = loadSite(siteId);
  if (!site) return;
  // Remove from project's siteIds list
  const siteIds = listSiteIdsForProject(site.projectId);
  const nextIds = siteIds.filter((id) => id !== siteId);
  safeSetItem(PROJECT_SITES_PREFIX + site.projectId, JSON.stringify(nextIds));
  // Update project record
  const records = listProjectRecords();
  const project = records.find((r) => r.id === site.projectId);
  if (project) {
    upsertProjectRecord({ ...project, siteIds: nextIds });
  }
  window.localStorage.removeItem(SITE_PREFIX + siteId);
}

export function listSiteIdsForProject(projectId: string): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(window.localStorage.getItem(PROJECT_SITES_PREFIX + projectId)) ?? [];
}

export function listSitesByProject(projectId: string): PersonalSite[] {
  if (typeof window === "undefined") return [];
  const siteIds = listSiteIdsForProject(projectId);
  return siteIds
    .map((id) => loadSite(id))
    .filter((site): site is PersonalSite => site !== null);
}

export function createSite(
  projectId: string,
  params: { targetRole?: string },
): PersonalSite {
  const now = nowIso();
  const site: PersonalSite = {
    id: generateId(),
    projectId,
    targetRole: params.targetRole?.trim().slice(0, 80) || "目标岗位待确认",
    draft: null,
    slug: null,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  // Persist site
  safeSetItem(SITE_PREFIX + site.id, JSON.stringify(site));

  // Add to project's siteIds list
  const existingIds = listSiteIdsForProject(projectId);
  const siteIds = [...existingIds, site.id];
  safeSetItem(PROJECT_SITES_PREFIX + projectId, JSON.stringify(siteIds));

  // Update project record
  updateProjectRecord(projectId, { siteIds });

  return site;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Multi-site: Migration
// ═══════════════════════════════════════════════════════════════════════════════

export function migrateProjectToMultiSite(projectId: string): void {
  if (typeof window === "undefined") return;

  // Check if already migrated
  const migratedKey = MULTI_SITE_MIGRATED + projectId;
  if (window.localStorage.getItem(migratedKey) === "1") return;

  // Read legacy personal data
  const legacyData = safeParse<PersonalSiteData>(window.localStorage.getItem(PERSONAL_PREFIX + projectId));
  if (!legacyData) {
    safeSetItem(migratedKey, "1");
    return;
  }

  // Save as resume base (v2 key)
  safeSetItem(RESUME_BASE_PREFIX + projectId, JSON.stringify(legacyData));

  // Read project record for published slug
  const records = safeParse<ProjectRecord[]>(window.localStorage.getItem(REGISTRY_KEY)) ?? [];
  const record = records.find((r) => r.id === projectId);
  const targetRole = legacyData.roleUnderstanding?.targetRoleTitle
    || legacyData.profile?.title
    || legacyData.timeline[0]?.position
    || "目标岗位待确认";

  // Create a default site from legacy data
  const now = nowIso();
  const site: PersonalSite = {
    id: generateId(),
    projectId,
    targetRole,
    draft: null,
    slug: record?.publishedSlug ?? null,
    status: record?.publishedSlug ? "published" : "draft",
    createdAt: record?.createdAt ?? now,
    updatedAt: now,
    publishedAt: record?.publishedAt ?? undefined,
  };
  safeSetItem(SITE_PREFIX + site.id, JSON.stringify(site));

  // Store siteIds
  const siteIds = [site.id];
  safeSetItem(PROJECT_SITES_PREFIX + projectId, JSON.stringify(siteIds));

  // Update project record with siteIds
  if (record) {
    const updated: ProjectRecord = { ...record, siteIds };
    safeSetItem(
      REGISTRY_KEY,
      JSON.stringify(records.map((r) => (r.id === projectId ? updated : r))),
    );
  }

  // Mark as migrated
  safeSetItem(migratedKey, "1");

  // Note: legacy PERSONAL_PREFIX key is intentionally preserved for backward compat
}
