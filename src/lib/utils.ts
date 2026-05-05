import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function uuidV4(): string {
  // crypto.randomUUID() requires secure context (HTTPS). EdgeOne preview may be HTTP.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch { /* fall through */ }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function generateId(): string {
  return uuidV4();
}

export function formatDate(dateStr: string): string {
  if (!dateStr || /present|now|至今|现在/i.test(dateStr)) return "至今";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.round(diff / 1000));
  if (seconds < 30) return "刚刚";
  if (seconds < 60) return `${seconds} 秒前`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} 天前`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function calculateDuration(start: string, end: string): string {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return "";
  const endDate = !end || /present|now|至今|现在/i.test(end) ? new Date() : new Date(end);
  if (Number.isNaN(endDate.getTime())) return "";
  const months = Math.max(
    0,
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()),
  );
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0 && remainingMonths > 0) return `${years}年${remainingMonths}个月`;
  if (years > 0) return `${years}年`;
  return `${remainingMonths || 1}个月`;
}
