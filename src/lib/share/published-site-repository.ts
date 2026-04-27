import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ResumeData } from "@/types";
import { sanitizeResumeData } from "@/lib/share/validation";

export interface PublishedSiteSnapshot {
  slug: string;
  version: number;
  publishedAt: string;
  data: ResumeData;
}

export interface PublishedSiteRepository {
  save(site: PublishedSiteSnapshot): Promise<PublishedSiteSnapshot>;
  find(slug: string): Promise<PublishedSiteSnapshot | null>;
}

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "published-sites.json");

async function readStore(): Promise<Record<string, PublishedSiteSnapshot>> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, PublishedSiteSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, PublishedSiteSnapshot>): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function createLocalPublishedSiteRepository(): PublishedSiteRepository {
  return {
    async save(site) {
      const sanitized = sanitizeResumeData(site.data);
      if (!sanitized) throw new Error("INVALID_SITE_DATA");
      const snapshot: PublishedSiteSnapshot = {
        ...site,
        data: sanitized,
      };
      const store = await readStore();
      store[site.slug] = snapshot;
      await writeStore(store);
      return snapshot;
    },
    async find(slug) {
      const store = await readStore();
      const site = store[slug];
      if (!site) return null;
      const sanitized = sanitizeResumeData(site.data);
      if (!sanitized) return null;
      return { ...site, data: sanitized };
    },
  };
}

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 48);
}
