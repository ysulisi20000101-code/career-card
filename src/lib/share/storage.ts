"use client";

import type { ResumeData } from "@/types";
import { sanitizeResumeData } from "@/lib/share/validation";
import { buildPublishSnapshot } from "@/lib/share/snapshot";

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

/**
 * Encode the entire resume into a URL-safe base64 string so the share link
 * can be opened on any device without requiring a backend.
 */
export function encodeResumeToHash(data: ResumeData): string {
  const json = JSON.stringify(data);
  if (typeof window === "undefined") return "";
  const utf8 = new TextEncoder().encode(json);
  let binary = "";
  utf8.forEach((byte) => (binary += String.fromCharCode(byte)));
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeResumeFromHash(encoded: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  if (!encoded) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = window.atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return sanitizeResumeData(JSON.parse(json));
  } catch {
    return null;
  }
}
