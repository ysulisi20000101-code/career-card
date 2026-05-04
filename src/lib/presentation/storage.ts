"use client";

import type { PresentationDraft } from "./types";

const DRAFT_PREFIX = "career-card:presentation-draft:";
const DRAFT_INDEX_KEY = "career-card:presentation-draft:index";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.warn("[career-card] localStorage.setItem failed — storage may be full or unavailable", { key });
    return false;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitizePresentationDraft(raw: unknown): PresentationDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (d.schemaVersion !== 1) return null;
  if (typeof d.id !== "string" || !d.id) return null;
  if (!Array.isArray(d.slides) || d.slides.some((s: unknown) => !isRecord(s) || typeof s.id !== "string" || typeof s.kind !== "string")) return null;
  return raw as PresentationDraft;
}

function readIndex(): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(window.localStorage.getItem(DRAFT_INDEX_KEY)) ?? [];
}

function writeIndex(ids: string[]) {
  if (typeof window === "undefined") return;
  safeSetItem(DRAFT_INDEX_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function listPresentationDrafts(): PresentationDraft[] {
  if (typeof window === "undefined") return [];
  return readIndex()
    .map((id) => sanitizePresentationDraft(safeParse(window.localStorage.getItem(DRAFT_PREFIX + id))))
    .filter((draft): draft is PresentationDraft => Boolean(draft))
    .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
}

export function loadPresentationDraft(id: string): PresentationDraft | null {
  if (typeof window === "undefined") return null;
  return sanitizePresentationDraft(safeParse(window.localStorage.getItem(DRAFT_PREFIX + id)));
}

export function savePresentationDraft(draft: PresentationDraft): void {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const toSave: PresentationDraft = {
    ...draft,
    updatedAt: now,
    createdAt: draft.createdAt || now,
  };
  safeSetItem(DRAFT_PREFIX + toSave.id, JSON.stringify(toSave));
  writeIndex([toSave.id, ...readIndex()]);
}

export function deletePresentationDraft(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_PREFIX + id);
  writeIndex(readIndex().filter((i) => i !== id));
}
