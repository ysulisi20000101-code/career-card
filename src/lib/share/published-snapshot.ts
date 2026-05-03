import type { ResumeData } from "@/types";
import { sanitizeResumeData } from "@/lib/share/validation";
import { isRecord, asString } from "@/lib/utils-helpers";

export interface PublishedSnapshotV1 {
  schemaVersion?: 1;
  slug: string;
  version: number;
  publishedAt: string;
  data: ResumeData;
}

export interface PublishedSnapshotV2 {
  schemaVersion: 2;
  slug: string;
  version: number;
  publishedAt: string;
  resumeData: ResumeData;
  siteId?: string;
}

export type PublishedSiteSnapshot = PublishedSnapshotV1 | PublishedSnapshotV2;

function asNumber(value: unknown, fallback = 1): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function isPublishedSnapshotV2(snapshot: PublishedSiteSnapshot): snapshot is PublishedSnapshotV2 {
  return snapshot.schemaVersion === 2;
}

export function getSnapshotResumeData(snapshot: PublishedSiteSnapshot): ResumeData {
  return isPublishedSnapshotV2(snapshot) ? snapshot.resumeData : snapshot.data;
}

export function normalizePublishedSnapshot(input: unknown, fallbackSlug = ""): PublishedSiteSnapshot | null {
  if (!isRecord(input)) return null;
  const schemaVersion = input.schemaVersion;
  const slug = asString(input.slug) || fallbackSlug;
  const version = asNumber(input.version);
  const publishedAt = asString(input.publishedAt) || new Date().toISOString();

  if (schemaVersion === 2) {
    const resumeData = sanitizeResumeData(input.resumeData);
    if (!slug || !resumeData) return null;
    return {
      schemaVersion: 2,
      slug,
      version,
      publishedAt,
      resumeData,
    };
  }

  const data = sanitizeResumeData(input.data);
  if (!slug || !data) return null;
  return {
    schemaVersion: 1,
    slug,
    version,
    publishedAt,
    data,
  };
}
