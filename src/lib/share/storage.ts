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
  const compactData = compactPortablePayload(data) ?? data;
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
