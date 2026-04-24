"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shell/brand-logo";
import { cn } from "@/lib/utils";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface AppShellProps {
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  contained?: boolean;
  tone?: "default" | "muted";
}

export function AppShell({
  breadcrumbs,
  actions,
  footer,
  children,
  contentClassName,
  contained = false,
  tone = "default",
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex h-screen flex-col",
        tone === "muted"
          ? "bg-gradient-to-b from-zinc-50 via-white to-white"
          : "bg-white",
      )}
    >
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div
          className={cn(
            "flex items-center justify-between gap-4 px-4 py-3 lg:px-8",
            contained && "mx-auto w-full max-w-6xl",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo />
            {breadcrumbs && breadcrumbs.length > 0 && (
              <>
                <div className="hidden h-5 w-px bg-zinc-200 md:block" />
                <nav className="hidden min-w-0 items-center gap-1 text-xs text-zinc-500 md:flex">
                  {breadcrumbs.map((crumb, idx) => (
                    <span key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
                      {idx > 0 && <ChevronRight className="h-3 w-3 text-zinc-300" />}
                      {crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="truncate rounded px-1.5 py-0.5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            "truncate px-1.5 py-0.5",
                            idx === breadcrumbs.length - 1
                              ? "font-medium text-zinc-900"
                              : "text-zinc-500",
                          )}
                        >
                          {crumb.label}
                        </span>
                      )}
                    </span>
                  ))}
                </nav>
              </>
            )}
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>

      <main
        className={cn(
          "flex-1 overflow-hidden",
          contentClassName,
        )}
      >
        {children}
      </main>

      {footer && (
        <footer className="border-t border-zinc-100 bg-white/80 backdrop-blur-md">
          {footer}
        </footer>
      )}
    </div>
  );
}
