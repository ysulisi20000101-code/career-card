"use client";

import type { ProjectRecord, PersonalSiteData, InterviewProjectData } from "@/types/project";
import type { ResumeData } from "@/types";
import { resumeDataToPersonal } from "@/lib/projects/adapters";

const REGISTRY_KEY = "career-card:workspace:records";
const PERSONAL_PREFIX = "career-card:workspace:personal:";
const INTERVIEW_PREFIX = "career-card:workspace:interview:";
const LEGACY_EDITOR_KEY = "career-card:editor";
const LEGACY_MIGRATED_KEY = "career-card:workspace:migrated-legacy";

function nowIso() {
  return new Date().toISOString();
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function listProjectRecords(): ProjectRecord[] {
  if (typeof window === "undefined") return [];
  migrateLegacyEditorData();
  const records = safeParse<ProjectRecord[]>(window.localStorage.getItem(REGISTRY_KEY)) ?? [];
  return records.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
}

function migrateLegacyEditorData() {
  if (window.localStorage.getItem(LEGACY_MIGRATED_KEY) === "1") return;

  const legacyRaw = window.localStorage.getItem(LEGACY_EDITOR_KEY);
  const legacyParsed = safeParse<{ state?: { resumeData?: ResumeData | null } }>(legacyRaw);
  const legacyResume = legacyParsed?.state?.resumeData;
  if (!legacyResume) {
    window.localStorage.setItem(LEGACY_MIGRATED_KEY, "1");
    return;
  }

  const existing = safeParse<ProjectRecord[]>(window.localStorage.getItem(REGISTRY_KEY)) ?? [];
  if (existing.length === 0) {
    const record: ProjectRecord = {
      id: crypto.randomUUID(),
      type: "personal",
      title: "迁移的职业档案草稿",
      status: "draft",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    window.localStorage.setItem(PERSONAL_PREFIX + record.id, JSON.stringify(resumeDataToPersonal(legacyResume)));
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify([record]));
  }
  window.localStorage.setItem(LEGACY_MIGRATED_KEY, "1");
}

export function upsertProjectRecord(record: ProjectRecord): void {
  if (typeof window === "undefined") return;
  const records = listProjectRecords();
  const next = [...records.filter((item) => item.id !== record.id), record];
  window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(next));
}

export function createProjectRecord(type: "personal" | "interview", title: string): ProjectRecord {
  const record: ProjectRecord = {
    id: crypto.randomUUID(),
    type,
    title,
    status: "draft",
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
  updateProjectRecord(id, { status: archived ? "archived" : "draft" });
}

export function deleteProjectRecord(id: string): void {
  if (typeof window === "undefined") return;
  const records = listProjectRecords();
  const existing = records.find((item) => item.id === id);
  if (!existing) return;
  window.localStorage.setItem(
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

  const duplicated: ProjectRecord = {
    ...existing,
    id: crypto.randomUUID(),
    title: `${existing.title} 副本`,
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    publishedSlug: undefined,
    publishedAt: undefined,
  };
  const sourceKey = existing.type === "personal" ? PERSONAL_PREFIX + id : INTERVIEW_PREFIX + id;
  const targetKey =
    duplicated.type === "personal"
      ? PERSONAL_PREFIX + duplicated.id
      : INTERVIEW_PREFIX + duplicated.id;
  const sourceData = window.localStorage.getItem(sourceKey);
  if (sourceData) window.localStorage.setItem(targetKey, sourceData);
  upsertProjectRecord(duplicated);
  return duplicated;
}

export function savePersonalProject(id: string, data: PersonalSiteData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERSONAL_PREFIX + id, JSON.stringify(data));
  updateProjectRecord(id, {});
}

export function loadPersonalProject(id: string): PersonalSiteData | null {
  if (typeof window === "undefined") return null;
  return safeParse<PersonalSiteData>(window.localStorage.getItem(PERSONAL_PREFIX + id));
}

export function saveInterviewProject(id: string, data: InterviewProjectData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTERVIEW_PREFIX + id, JSON.stringify(data));
  updateProjectRecord(id, {});
}

export function loadInterviewProject(id: string): InterviewProjectData | null {
  if (typeof window === "undefined") return null;
  return safeParse<InterviewProjectData>(window.localStorage.getItem(INTERVIEW_PREFIX + id));
}
