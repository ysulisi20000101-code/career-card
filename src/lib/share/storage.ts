"use client";

import type { ResumeData } from "@/types";
import { sanitizeResumeData } from "@/lib/share/validation";
import { buildPublishSnapshot } from "@/lib/share/snapshot";
import { strFromU8, strToU8, unzlibSync, zlibSync } from "fflate";

const LEGACY_PREFIX = "career-card:published:";
const SITE_PREFIX = "career-card:published-site:";

export interface PublishedSite {
  slug: string;
  version: number;
  publishedAt: string;
  data: ResumeData;
}

export function savePublishedResume(slug: string, data: ResumeData): PublishedSite | null {
  if (typeof window === "undefined") return null;
  const sanitized = buildPublishSnapshot(data);
  if (!sanitized) return null;
  const site: PublishedSite = {
    slug,
    version: 1,
    publishedAt: new Date().toISOString(),
    data: sanitized,
  };
  window.localStorage.setItem(SITE_PREFIX + slug, JSON.stringify(site));
  window.localStorage.setItem(LEGACY_PREFIX + slug, JSON.stringify(site.data));
  return site;
}

export function removePublishedSite(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SITE_PREFIX + slug);
  window.localStorage.removeItem(LEGACY_PREFIX + slug);
}

export function loadPublishedSite(slug: string): PublishedSite | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SITE_PREFIX + slug);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PublishedSite>;
    if (!parsed.data) return null;
    const sanitized = sanitizeResumeData(parsed.data);
    if (!sanitized) return null;
    return {
      slug: parsed.slug || slug,
      version: parsed.version || 1,
      publishedAt: parsed.publishedAt || "",
      data: sanitized,
    };
  } catch {
    return null;
  }
}

export function loadPublishedResume(slug: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  const site = loadPublishedSite(slug);
  if (site) return site.data;

  const raw = window.localStorage.getItem(LEGACY_PREFIX + slug);
  if (!raw) return null;
  try {
    return sanitizeResumeData(JSON.parse(raw));
  } catch {
    return null;
  }
}

const COMPRESSED_HASH_PREFIX = "z.";

function truncate(s: string, max: number): string {
  if (!s || s.length <= max) return s ?? "";
  return s.slice(0, max - 1) + "…";
}

function limit<T>(arr: T[] | undefined | null, max: number): T[] {
  if (!arr) return [];
  return arr.slice(0, max);
}

function buildCompactPortablePayload(data: ResumeData): ResumeData {
  const timeline = limit(data.timeline, 5).map((node) => ({
    id: node.id,
    company: truncate(node.company || "", 60),
    position: truncate(node.position || "", 80),
    startDate: node.startDate ?? "",
    endDate: node.endDate ?? "",
    description: truncate(node.description || "", 180),
    highlights: limit(node.highlights, 3).map((h) => truncate(h, 100)),
    projects: [],
    skills: limit(node.skills, 6),
    order: node.order ?? 0,
    careerKind: node.careerKind,
    storyTitle: node.storyTitle ? truncate(node.storyTitle, 70) : undefined,
    storyOutcome: node.storyOutcome ? truncate(node.storyOutcome, 100) : undefined,
    evidenceResult: node.evidenceResult ? truncate(node.evidenceResult, 100) : undefined,
    promotionStages: limit(node.promotionStages, 3).map((stage) => ({
      id: stage.id,
      title: truncate(stage.title, 50),
      period: truncate(stage.period, 24),
      teamScale: truncate(stage.teamScale, 16),
      leadershipType: stage.leadershipType,
      responsibility: truncate(stage.responsibility, 120),
      outcome: truncate(stage.outcome, 120),
      reflection: "",
    })),
  }));

  return {
    profile: {
      id: data.profile.id || "profile",
      name: data.profile.name ?? "",
      email: data.profile.email ?? "",
      phone: data.profile.phone,
      title: truncate(data.profile.title ?? "", 80),
      summary: truncate(data.profile.summary ?? "", 180),
      location: data.profile.location,
      website: data.profile.website,
      linkedin: data.profile.linkedin,
    },
    publicSiteTemplate: data.publicSiteTemplate,
    siteThemeId: data.siteThemeId,
    timeline,
    skills: limit(data.skills, 12).map((s) => ({
      id: s.id,
      name: truncate(s.name, 40),
      category: s.category,
      level: s.level,
      parentId: s.parentId,
      status: s.status,
      importance: s.importance,
    })),
    architecture: limit(data.architecture, 8).map((m) => ({
      id: m.id,
      title: truncate(m.title, 50),
      description: truncate(m.description, 120),
      type: m.type,
      industry: m.industry,
      position: m.position,
      parentId: m.parentId,
      relatedTimelineIds: limit(m.relatedTimelineIds, 3),
    })),
    education: limit(data.education, 3).map((e) => ({
      id: e.id,
      school: truncate(e.school, 50),
      degree: truncate(e.degree, 40),
      major: truncate(e.major, 40),
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
    })),
    roleUnderstanding: {
      targetRoleTitle: truncate(data.roleUnderstanding?.targetRoleTitle || data.profile.title || "", 70),
      companyContext: data.roleUnderstanding?.companyContext,
      oneLineInterpretation: truncate(data.roleUnderstanding?.oneLineInterpretation || "", 120),
      priorityProblems: [],
      ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
      experienceMappings: [],
    },
  };
}

function compactPortablePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => compactPortablePayload(item))
      .filter((item) => {
        if (item == null || item === "") return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item as Record<string, unknown>).length > 0;
        return true;
      });
    return items.length > 0 ? items : undefined;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compactPortablePayload(item)] as const)
      .filter(([, item]) => {
        if (item == null || item === "") return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item as Record<string, unknown>).length > 0;
        return true;
      });
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return value;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = window.atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeResumeToHash(data: ResumeData): string {
  if (typeof window === "undefined") return "";
  const compactData = compactPortablePayload(buildCompactPortablePayload(data));
  const json = JSON.stringify(compactData);
  const legacy = bytesToBase64Url(new TextEncoder().encode(json));
  try {
    const compressed = `${COMPRESSED_HASH_PREFIX}${bytesToBase64Url(zlibSync(strToU8(json)))}`;
    return compressed.length < legacy.length ? compressed : legacy;
  } catch {
    return legacy;
  }
}

export function decodeResumeFromHash(encoded: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  if (!encoded) return null;
  try {
    const json = encoded.startsWith(COMPRESSED_HASH_PREFIX)
      ? strFromU8(unzlibSync(base64UrlToBytes(encoded.slice(COMPRESSED_HASH_PREFIX.length))))
      : new TextDecoder().decode(base64UrlToBytes(encoded));
    return sanitizeResumeData(JSON.parse(json));
  } catch {
    return null;
  }
}
