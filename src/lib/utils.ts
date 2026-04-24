import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'present' || dateStr === '至今') return '至今';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const diff = Date.now() - date.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 30) return "刚刚";
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day} 天前`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function calculateDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = end === 'present' || end === '至今' ? new Date() : new Date(end);
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0 && remainingMonths > 0) return `${years}年${remainingMonths}个月`;
  if (years > 0) return `${years}年`;
  return `${remainingMonths}个月`;
}
