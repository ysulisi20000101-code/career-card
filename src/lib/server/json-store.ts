import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_DIR = path.join(process.cwd(), ".data");

export async function readJsonStore<T extends Record<string, unknown>>(
  fileName: string,
  fallback: T,
): Promise<T> {
  try {
    const raw = await readFile(path.join(STORE_DIR, fileName), "utf8");
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJsonStore<T extends Record<string, unknown>>(
  fileName: string,
  value: T,
): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(path.join(STORE_DIR, fileName), JSON.stringify(value, null, 2), "utf8");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}
