export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[•·]\s*/g, "").replace(/\s+/g, " ").trim();
}

export function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function compact(value: unknown, max = 120): string {
  const s = clean(value);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function compactOr(value: unknown, fallback: string, max = 120): string {
  const s = clean(value) || fallback;
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function unique(values: unknown[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}
