import type { PublishedSiteSnapshot } from "@/lib/share/published-snapshot";
import { getSnapshotResumeData, normalizePublishedSnapshot } from "@/lib/share/published-snapshot";
import { getStorageAdapter, type PublishedSiteRecord } from "@/lib/server/storage-adapter";

export interface PublishedSiteRepository {
  save(site: PublishedSiteSnapshot): Promise<PublishedSiteSnapshot>;
  find(slug: string): Promise<PublishedSiteSnapshot | null>;
  remove(slug: string): Promise<void>;
}

export function createLocalPublishedSiteRepository(): PublishedSiteRepository {
  const adapter = getStorageAdapter();

  return {
    async save(site) {
      const normalized = normalizePublishedSnapshot(site);
      if (!normalized) throw new Error("INVALID_SITE_DATA");
      const sanitized = getSnapshotResumeData(normalized);
      if (!sanitized) throw new Error("INVALID_SITE_DATA");
      // Check slug uniqueness: reject if a different snapshot already exists at this slug
      const existing = await adapter.getPublishedSite(normalized.slug);
      if (existing) {
        const existingNormalized = normalizePublishedSnapshot(existing, normalized.slug);
        const existingData = existingNormalized ? getSnapshotResumeData(existingNormalized) : null;
        if (existingData && existingData.profile.name !== sanitized.profile.name) {
          throw new Error("SLUG_TAKEN");
        }
      }
      const record = normalized as PublishedSiteRecord;
      await adapter.savePublishedSite(record);
      return normalized;
    },
    async find(slug) {
      const site = await adapter.getPublishedSite(slug);
      if (!site) return null;
      return normalizePublishedSnapshot(site, slug);
    },
    async remove(slug) {
      await adapter.deletePublishedSite(slug);
    },
  };
}

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 48);
}
