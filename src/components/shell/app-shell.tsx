"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  FileText,
  Globe,
  LayoutDashboard,
  Menu,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Eye,
} from "lucide-react";
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

const DRAWER_EXPANDED = 240;
const DRAWER_COLLAPSED = 56;

const crumbIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "工作台": LayoutDashboard,
  "职业档案": FileText,
  "编辑": Pencil,
  "发布": Globe,
  "预览": Eye,
  "面试演示": MonitorSmartphone,
  "演示预览": MonitorSmartphone,
};

function crumbIcon(label: string) {
  const Icon = crumbIcons[label];
  return Icon ? <Icon className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />;
}

export function AppShell({
  breadcrumbs,
  actions,
  footer,
  children,
  contentClassName,
  tone = "default",
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const sidebarWidth = collapsed && !hovered ? DRAWER_COLLAPSED : DRAWER_EXPANDED;
  const showLabels = !collapsed || hovered;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header: logo + toggle */}
      <div
        className={cn(
          "flex items-center border-b border-zinc-100 px-3",
          showLabels ? "h-14 justify-between" : "h-14 justify-center",
        )}
      >
        {showLabels ? (
          <BrandLogo size="sm" />
        ) : (
          <BrandLogo size="sm" href="/" className="[&_.brand-gradient-text]:hidden" />
        )}
        <button
          type="button"
          onClick={() => { setCollapsed(!collapsed); setHovered(false); }}
          className={cn(
            "hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors",
            !showLabels && "ml-0",
          )}
          aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav items from breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return crumb.href ? (
                <Link
                  key={`${crumb.label}-${idx}`}
                  href={crumb.href}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isLast
                      ? "bg-zinc-100 text-zinc-900 font-medium"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700",
                    !showLabels && "justify-center px-0",
                  )}
                  title={!showLabels ? crumb.label : undefined}
                >
                  {crumbIcon(crumb.label)}
                  {showLabels && <span className="truncate">{crumb.label}</span>}
                </Link>
              ) : (
                <div
                  key={`${crumb.label}-${idx}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                    isLast
                      ? "bg-zinc-100 text-zinc-900 font-medium"
                      : "text-zinc-400",
                    !showLabels && "justify-center px-0",
                  )}
                  title={!showLabels ? crumb.label : undefined}
                >
                  {crumbIcon(crumb.label)}
                  {showLabels && <span className="truncate">{crumb.label}</span>}
                </div>
              );
            })}
          </div>
        </nav>
      )}

      {/* Actions at bottom */}
      {actions && (
        <div
          className={cn(
            "border-t border-zinc-100 p-2",
            !showLabels && "flex flex-col items-center",
          )}
        >
          {showLabels ? (
            <div className="flex flex-col gap-1">{actions}</div>
          ) : (
            <div className="flex flex-col items-center gap-1">{actions}</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex h-screen",
        tone === "muted"
          ? "bg-gradient-to-b from-zinc-50 via-white to-white"
          : "bg-white",
      )}
    >
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -DRAWER_EXPANDED }}
            animate={{ x: 0 }}
            exit={{ x: -DRAWER_EXPANDED }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 top-0 z-50 w-[240px] border-r border-zinc-100 bg-white shadow-xl lg:hidden"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-zinc-100 bg-white shrink-0 transition-[width] overflow-hidden",
        )}
        style={{
          width: sidebarWidth,
          transitionDuration: "280ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={() => { if (collapsed) setHovered(true); }}
        onMouseLeave={() => setHovered(false)}
      >
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with hamburger */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-100 bg-white/80 backdrop-blur-md px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo size="sm" />
          {breadcrumbs && breadcrumbs.length > 0 && (
            <>
              <div className="h-5 w-px bg-zinc-200" />
              <span className="truncate text-xs font-medium text-zinc-500">
                {breadcrumbs[breadcrumbs.length - 1]?.label}
              </span>
            </>
          )}
        </header>

        <main
          className={cn(
            "min-h-0 flex-1 overflow-hidden",
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
    </div>
  );
}
