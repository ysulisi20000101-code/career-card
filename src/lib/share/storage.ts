"use client";

import type { ResumeData } from "@/types";
import { sanitizeResumeData } from "@/lib/share/validation";

const PREFIX = "career-card:published:";

export function savePublishedResume(slug: string, data: ResumeData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + slug, JSON.stringify(data));
}

export function loadPublishedResume(slug: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PREFIX + slug);
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
  // Make UTF-8 bytes survive btoa.
  const utf8 = new TextEncoder().encode(json);
  let binary = "";
  utf8.forEach((b) => (binary += String.fromCharCode(b)));
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeResumeFromHash(encoded: string): ResumeData | null {
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
