"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeTone = "info" | "success" | "warning" | "danger";

interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

const toneStyles: Record<NoticeTone, { wrap: string; icon: string; title: string }> = {
  info: {
    wrap: "bg-indigo-50/70 border-indigo-200/70 text-indigo-900",
    icon: "text-indigo-500",
    title: "text-indigo-900",
  },
  success: {
    wrap: "bg-emerald-50/70 border-emerald-200/70 text-emerald-900",
    icon: "text-emerald-500",
    title: "text-emerald-900",
  },
  warning: {
    wrap: "bg-amber-50/70 border-amber-200/70 text-amber-900",
    icon: "text-amber-500",
    title: "text-amber-900",
  },
  danger: {
    wrap: "bg-rose-50/70 border-rose-200/70 text-rose-900",
    icon: "text-rose-500",
    title: "text-rose-900",
  },
};

const toneIcons: Record<NoticeTone, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

export function Notice({ tone = "info", title, children, className, icon }: NoticeProps) {
  const styles = toneStyles[tone];
  const DefaultIcon = toneIcons[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        styles.wrap,
        className,
      )}
    >
      <div className={cn("mt-0.5 shrink-0", styles.icon)}>
        {icon ?? <DefaultIcon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 space-y-1">
        {title && <p className={cn("font-medium", styles.title)}>{title}</p>}
        {children && <div className="text-[13px] leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}
