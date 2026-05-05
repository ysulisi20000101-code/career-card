import type { PublishedSiteSnapshot } from "@/lib/share/published-snapshot";
import { normalizePublishedSnapshot } from "@/lib/share/published-snapshot";

export type PublishedSiteRecord = PublishedSiteSnapshot & { userId?: string };

export interface StorageAdapter {
  savePublishedSite(site: PublishedSiteRecord): Promise<void>;
  getPublishedSite(slug: string): Promise<PublishedSiteRecord | null>;
  deletePublishedSite(slug: string): Promise<void>;
  listPublishedSites(userId?: string): Promise<PublishedSiteRecord[]>;
}

// Simple in-memory mutex per file path to prevent concurrent read-modify-write races
const fileLocks = new Map<string, Promise<void>>();

async function withFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const prev = fileLocks.get(filePath) ?? Promise.resolve();
  const current = prev.then(fn, fn);
  fileLocks.set(filePath, current.then(() => undefined, () => undefined));
  try {
    return await current;
  } finally {
    // Only clean up if this is still the current lock
    const cleanup = fileLocks.get(filePath);
    if (cleanup && cleanup === current.then(() => undefined, () => undefined)) {
      fileLocks.delete(filePath);
    }
  }
}

// JSON File Adapter (本地开发 / serverless fallback)
const JSON_FILE_STORE_KEY = ".data/published-sites.json";

let _storeBaseDir: string | null = null;

async function getStoreBaseDir(): Promise<string> {
  if (_storeBaseDir) return _storeBaseDir;
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  // Try project-local .data first (local dev)
  const cwdDir = path.join(process.cwd(), ".data");
  try {
    await fs.mkdir(cwdDir, { recursive: true });
    // verify writable
    const testFile = path.join(cwdDir, ".write-test");
    await fs.writeFile(testFile, "ok", "utf8");
    await fs.unlink(testFile);
    _storeBaseDir = cwdDir;
    return _storeBaseDir;
  } catch {
    // Fallback to /tmp for serverless platforms (Vercel / EdgeOne)
    const tmpDir = path.join("/tmp", ".data");
    await fs.mkdir(tmpDir, { recursive: true });
    _storeBaseDir = tmpDir;
    return _storeBaseDir;
  }
}

class JsonFileAdapter implements StorageAdapter {
  private async readStore(): Promise<Record<string, PublishedSiteRecord>> {
    try {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const baseDir = await getStoreBaseDir();
      const STORE_FILE = path.join(baseDir, "published-sites.json");
      const raw = await fs.readFile(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw) as Record<string, PublishedSiteRecord>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  private async writeStore(store: Record<string, PublishedSiteRecord>): Promise<void> {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const baseDir = await getStoreBaseDir();
    const STORE_FILE = path.join(baseDir, "published-sites.json");
    await fs.mkdir(baseDir, { recursive: true });
    await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  }

  async savePublishedSite(site: PublishedSiteRecord): Promise<void> {
    const normalized = normalizePublishedSnapshot(site);
    if (!normalized) throw new Error("INVALID_SITE_DATA");
    await withFileLock(JSON_FILE_STORE_KEY, async () => {
      const store = await this.readStore();
      store[site.slug] = { ...normalized, userId: site.userId } as PublishedSiteRecord;
      await this.writeStore(store);
    });
  }

  async getPublishedSite(slug: string): Promise<PublishedSiteRecord | null> {
    return withFileLock(JSON_FILE_STORE_KEY, async () => {
      const store = await this.readStore();
      const site = store[slug];
      if (!site) return null;
      const normalized = normalizePublishedSnapshot(site, slug);
      if (!normalized) return null;
      return { ...normalized, userId: site.userId } as PublishedSiteRecord;
    });
  }

  async deletePublishedSite(slug: string): Promise<void> {
    await withFileLock(JSON_FILE_STORE_KEY, async () => {
      const store = await this.readStore();
      delete store[slug];
      await this.writeStore(store);
    });
  }

  async listPublishedSites(userId?: string): Promise<PublishedSiteRecord[]> {
    return withFileLock(JSON_FILE_STORE_KEY, async () => {
      const store = await this.readStore();
      const sites = Object.values(store);
      if (userId) {
        return sites.filter((site) => site.userId === userId);
      }
      return sites;
    });
  }
}

// EdgeOne KV Adapter (生产环境)
class EdgeOneKVAdapter implements StorageAdapter {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  private getKey(slug: string): string {
    return `published:${slug}`;
  }

  async savePublishedSite(site: PublishedSiteRecord): Promise<void> {
    const normalized = normalizePublishedSnapshot(site);
    if (!normalized) throw new Error("INVALID_SITE_DATA");

    // EdgeOne KV API (需要根据实际 SDK 调整)
    const response = await fetch(`${process.env.EDGEONE_KV_API_URL}/${this.namespace}/kv/put`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EDGEONE_KV_API_TOKEN}`,
      },
      body: JSON.stringify({
        key: this.getKey(site.slug),
        value: JSON.stringify({ ...normalized, userId: site.userId }),
        expirationTtl: 60 * 60 * 24 * 365, // 1 year
      }),
    });

    if (!response.ok) {
      throw new Error(`EdgeOne KV save failed: ${response.status}`);
    }
  }

  async getPublishedSite(slug: string): Promise<PublishedSiteRecord | null> {
    const response = await fetch(
      `${process.env.EDGEONE_KV_API_URL}/${this.namespace}/kv/get?key=${this.getKey(slug)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EDGEONE_KV_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`EdgeOne KV get failed: ${response.status}`);
    }

    const payload = (await response.json()) as { value?: string };
    if (!payload.value) return null;

    try {
      const site = JSON.parse(payload.value) as PublishedSiteRecord;
      const normalized = normalizePublishedSnapshot(site, slug);
      if (!normalized) return null;
      return { ...normalized, userId: site.userId } as PublishedSiteRecord;
    } catch {
      return null;
    }
  }

  async deletePublishedSite(slug: string): Promise<void> {
    const response = await fetch(`${process.env.EDGEONE_KV_API_URL}/${this.namespace}/kv/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EDGEONE_KV_API_TOKEN}`,
      },
      body: JSON.stringify({
        key: this.getKey(slug),
      }),
    });

    if (!response.ok) {
      throw new Error(`EdgeOne KV delete failed: ${response.status}`);
    }
  }

  async listPublishedSites(userId?: string): Promise<PublishedSiteRecord[]> {
    // EdgeOne KV 不支持前缀查询，需要维护一个索引
    // 这里简化处理，实际应该维护一个 slugs 索引
    const response = await fetch(
      `${process.env.EDGEONE_KV_API_URL}/${this.namespace}/kv/list?prefix=published:`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EDGEONE_KV_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`EdgeOne KV list failed: ${response.status}`);
    }

    const payload = (await response.json()) as { keys?: { name: string }[] };
    const keys = payload.keys ?? [];

    const sites: PublishedSiteRecord[] = [];
    for (const key of keys) {
      const slug = key.name.replace("published:", "");
      const site = await this.getPublishedSite(slug);
      if (site && (!userId || site.userId === userId)) {
        sites.push(site);
      }
    }

    return sites;
  }
}

// 创建存储适配器
export function createStorageAdapter(): StorageAdapter {
  const adapterType = process.env.STORAGE_ADAPTER || "json-file";

  switch (adapterType) {
    case "edgeone-kv":
      return new EdgeOneKVAdapter(process.env.EDGEONE_KV_NAMESPACE || "career-card");
    case "json-file":
    default:
      return new JsonFileAdapter();
  }
}

// 全局单例
let adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) {
    adapter = createStorageAdapter();
  }
  return adapter;
}
