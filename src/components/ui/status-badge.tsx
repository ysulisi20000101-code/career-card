"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "draft" | "published" | "archived";
  className?: string;
  /** 自定义 status 对应的中文标签 */
  labels?: Partial<Record<"draft" | "published" | "archived", string>>;
}

const defaultLabels = { draft: "草稿", published: "已发布", archived: "已归档" } as const;

const variantClasses = {
  draft: "border-zinc-200 bg-zinc-50 text-zinc-600",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-zinc-200 bg-zinc-100 text-zinc-500",
} as const;

export function StatusBadge({ status, className, labels }: StatusBadgeProps) {
  const label = labels?.[status] ?? defaultLabels[status];
  return (
    <Badge className={cn("text-[10px] font-medium", variantClasses[status], className)}>
      {label}
    </Badge>
  );
}
