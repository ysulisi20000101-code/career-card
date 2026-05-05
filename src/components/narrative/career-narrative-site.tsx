"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  BarChart3,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Mail,
  Phone,
  Target,
} from "lucide-react";
import type { ResumeData } from "@/types";
import type { PublicExperienceDetail, PublicJourneyNode, PublicOverview } from "@/lib/public-site/content";
import { buildPublicSiteViewModel } from "@/lib/public-site/view-model";
import { getTheme, type SiteTheme, type SiteThemeId } from "@/lib/site-styles/theme-config";
import { cn, formatDate } from "@/lib/utils";
import SkillMapView from "@/components/skillmap/skill-map-view";
import ArchitectureView from "@/components/architecture/architecture-view";

interface CareerNarrativeSiteProps {
  data: ResumeData;
  showFooter?: boolean;
  siteThemeId?: SiteThemeId;
}

function MotionSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── v5 Designer Hero ───────────────────────────────────────────

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-emerald-50/30 via-transparent to-transparent blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[300px] rounded-full bg-gradient-to-t from-emerald-50/25 via-transparent to-transparent blur-3xl" />
    </div>
  );
}

function MetricCard({ value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 backdrop-blur p-4 text-center transition-all duration-350 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]">
      <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-350 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-xs text-slate-500 leading-relaxed">{body}</p>
    </div>
  );
}

function DesignerHero({
  data,
  overview,
  primarySkills,
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  primarySkills: string[];
  theme: SiteTheme;
}) {
  const valueCards = overview.summaryBullets.slice(0, 3).map((bullet, i) => ({
    title: primarySkills[i] ?? overview.targetRole,
    body: bullet,
  }));

  return (
    <header id="overview" className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-b from-neutral-50 via-white to-white">
      <Atmosphere />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 sm:py-32 w-full">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] text-emerald-600 uppercase">
            <span className="h-1 w-6 bg-emerald-200 rounded-full" />
            {overview.positionLine || overview.targetRole}
          </span>
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8"
        >
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-[-0.02em] leading-[1.05] text-slate-900">
            {overview.name}
          </h1>
        </motion.div>

        {/* One-liner */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl"
        >
          <p className="text-xl sm:text-2xl text-slate-500 font-light leading-relaxed">
            <span className="text-slate-700 font-normal">{overview.targetRole}</span>
            {overview.summaryBullets[0] && (
              <> — {overview.summaryBullets[0]}</>
            )}
          </p>
        </motion.div>

        {/* Metrics */}
        {overview.metrics.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.17, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl"
          >
            {overview.metrics.slice(0, 4).map((metric, i) => (
              <motion.div
                key={`${metric.label}-${metric.value}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.22 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <MetricCard {...metric} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Value cards */}
        {valueCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 grid gap-4 sm:grid-cols-3 max-w-3xl"
          >
            {valueCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.29 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                <ValueCard title={card.title} body={card.body} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.31, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-wrap gap-3"
        >
          {data.profile.email && (
            <a
              href={`mailto:${data.profile.email}`}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <Mail className="h-4 w-4" />
              {data.profile.email}
            </a>
          )}
          {data.profile.phone && (
            <a
              href={`tel:${data.profile.phone}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-400 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {data.profile.phone}
            </a>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-xs tracking-[0.2em] text-slate-300 uppercase">滚动了解经历</p>
          <ChevronDown className="mt-3 mx-auto h-4 w-4 text-slate-300 animate-bounce" />
        </motion.div>
      </div>
    </header>
  );
}

// ─── v5 Growth Rail ─────────────────────────────────────────────

const PHASE_LABELS = ["起步期", "成长期", "突破期"] as const;

function phaseLabel(index: number, total: number): string {
  if (index === total - 1) return "当前";
  return PHASE_LABELS[index] ?? PHASE_LABELS[PHASE_LABELS.length - 1];
}

function GrowthRail({ items }: { items: PublicJourneyNode[] }) {
  const count = items.length;

  return (
    <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium tracking-[0.15em] text-emerald-600 uppercase mb-2">成长路径</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">从起点到当前</h2>
        <p className="mt-3 text-sm text-slate-500 max-w-lg">
          {count} 段经历组成职业成长路径，点击跳转查看各阶段详情。
        </p>

        {/* Desktop horizontal */}
        <div className="relative mt-12 hidden md:block">
          <div className="absolute top-5 left-[8%] right-[8%] h-px bg-slate-200" />
          <div className="relative z-10 grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {items.map((item, idx) => {
              const isLatest = idx === count - 1;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className="group flex flex-col items-center px-2"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full text-sm font-bold mb-4 transition-all duration-300 group-hover:scale-115 group-hover:shadow-[0_0_0_6px_rgba(0,0,0,0.08)]",
                      isLatest
                        ? "w-12 h-12 bg-emerald-600 text-white shadow-lg shadow-emerald-300/20"
                        : "w-10 h-10 bg-white border-2 border-emerald-100 text-emerald-600",
                    )}
                  >
                    {idx + 1}
                  </div>
                  {isLatest && (
                    <span className="rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium px-2 py-0.5 mb-1">当前</span>
                  )}
                  <p className="text-[11px] font-medium text-emerald-600">{phaseLabel(idx, count)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.period}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-center leading-tight">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 text-center leading-relaxed max-w-[140px]">{item.keyword}</p>
                </a>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical */}
        <div className="mt-10 space-y-0 md:hidden">
          {items.map((item, idx) => {
            const isLatest = idx === count - 1;
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "group relative block pl-8",
                  idx < count - 1 && "pb-6",
                  isLatest ? "border-l-2 border-emerald-400" : "border-l-2 border-emerald-100",
                )}
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 -translate-x-1/2 flex items-center justify-center rounded-full text-xs font-bold",
                    isLatest
                      ? "w-8 h-8 bg-emerald-600 text-white shadow-md"
                      : "w-7 h-7 bg-white border-2 border-emerald-100 text-emerald-600",
                  )}
                >
                  {idx + 1}
                </div>
                {isLatest && (
                  <span className="inline-block rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium px-2 py-0.5 mb-1">当前</span>
                )}
                <p className="text-xs text-slate-400">{item.period}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-400">{item.keyword}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── v5 Experience Detail ──────────────────────────────────────

function DetailBlock({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function EarlyRows({ rows }: { rows?: PublicExperienceDetail["earlyRows"] }) {
  if (!rows?.length) return null;
  return (
    <div className="mt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={`${row.company}-${row.role}`} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-700">{row.company}</p>
            <p className="text-sm text-slate-500 mt-0.5">{row.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceDetail({
  detail,
  index,
  total,
  theme,
}: {
  detail: PublicExperienceDetail;
  index: number;
  total: number;
  theme: SiteTheme;
}) {
  const isLast = index === total - 1;
  const bg = index % 2 === 0 ? "bg-white" : "bg-neutral-50";
  const accentBar = isLast
    ? "bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#34d399]"
    : "bg-gradient-to-r from-[#065f46] via-[#059669] to-[#6ee7b7]";

  return (
    <MotionSection
      id={`experience-${detail.id}`}
      className={cn("relative scroll-mt-14 px-4 py-16 sm:px-6 lg:px-8", bg)}
    >
      {/* Accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-[3px]", accentBar)} />

      <div className="max-w-5xl mx-auto">
        {/* Header with number */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className={cn(
              "flex items-center justify-center rounded-full text-xs font-bold shrink-0",
              isLast
                ? "w-10 h-10 bg-emerald-600 text-white text-sm shadow-md shadow-emerald-300/20"
                : "w-8 h-8 bg-emerald-50 text-emerald-600",
            )}
          >
            {index + 1}
          </span>
          <div>
            <span className="text-xs font-medium tracking-[0.12em] text-emerald-600 uppercase">经历详情</span>
            {isLast && (
              <span className="ml-3 rounded-full bg-emerald-600 text-white text-[10px] font-medium px-2.5 py-0.5">
                最新重点经历
              </span>
            )}
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">{detail.title}</h2>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <BriefcaseBusiness className="h-4 w-4" />
            {detail.meta}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {detail.period}
          </span>
        </div>

        {/* Detail blocks */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {detail.blocks.map((block) => (
            <DetailBlock key={`${detail.id}-${block.label}`} label={block.label} value={block.value} />
          ))}
        </div>

        {/* Support blocks */}
        {detail.supportBlocks.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CheckCircle2 className={cn("h-4 w-4", theme.section.accent)} />
              亮点支撑
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {detail.supportBlocks.map((block) => (
                <DetailBlock key={`${detail.id}-support-${block.label}`} label={block.label} value={block.value} />
              ))}
            </div>
          </div>
        )}

        {/* Reflection + Skills */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.65fr]">
          {detail.reflection && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-500">思考</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{detail.reflection}</p>
            </div>
          )}
          <div className={cn("rounded-2xl border p-5", isLast ? "border-slate-200 bg-white" : "border-slate-200 bg-white")}>
            <p className="mb-3 text-xs font-semibold text-slate-500">关联能力</p>
            <div className="flex flex-wrap gap-1.5">
              {detail.skills.map((skill) => (
                <span
                  key={skill}
                  className={cn(
                    "text-[11px] rounded-full px-2.5 py-1",
                    isLast
                      ? "bg-slate-900 text-white font-medium"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <EarlyRows rows={detail.earlyRows} />
      </div>
    </MotionSection>
  );
}

// ─── v5 Capability Summary ─────────────────────────────────────

function CapabilitySummary({
  data,
  primarySkills,
  activeTimelineId,
  hasArchitectureSignal,
  theme,
}: {
  data: ResumeData;
  primarySkills: string[];
  activeTimelineId: string | null;
  hasArchitectureSignal: boolean;
  theme: SiteTheme;
}) {
  return (
    <MotionSection id="capability-summary" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium tracking-[0.15em] text-emerald-600 uppercase mb-2">能力摘要</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">从经历里沉淀出的工作方式</h2>
        <p className="mt-3 text-sm text-slate-500 max-w-lg">
          这里保留能力结构、强项来源和对应经历，便于快速理解我的工作方式。
        </p>

        {/* Skill tags */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {primarySkills.map((skill) => (
            <span key={skill} className="text-[11px] rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{skill}</span>
          ))}
        </div>

        {/* Skill map + Architecture */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <BarChart3 className={cn("h-4 w-4", theme.section.accent)} />
              能力结构
            </div>
            <div className="h-[420px] overflow-hidden rounded-xl bg-white">
              <SkillMapView data={data} activeTimelineId={activeTimelineId} className="min-h-[420px]" />
            </div>
          </div>
          {hasArchitectureSignal ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Target className={cn("h-4 w-4", theme.section.accent)} />
                业务结构
              </div>
              <div className="h-[420px] overflow-hidden rounded-xl bg-white">
                <ArchitectureView data={data} activeTimelineId={activeTimelineId} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Education — inline row */}
        {data.education.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/60 px-6 py-5 flex flex-wrap items-center gap-3">
            <GraduationCap className="h-5 w-5 text-emerald-500 shrink-0" />
            {data.education.map((edu, i) => (
              <span key={edu.id} className="text-base text-slate-800 font-medium">
                {i > 0 && <span className="text-slate-300 mx-2">|</span>}
                {edu.school}{" "}
                <span className="text-sm text-slate-400 font-normal">
                  {edu.degree} · {edu.major} · {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </MotionSection>
  );
}

// ─── Sticky Mini Nav ────────────────────────────────────────────

function MiniNav({
  data,
  overview,
  journey,
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
}) {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the header element after mount
    heroRef.current = document.querySelector("header");
    let heroBottom = 0;

    const measure = () => {
      if (heroRef.current) {
        heroBottom = heroRef.current.getBoundingClientRect().bottom + window.scrollY;
      }
    };
    measure();

    const onScroll = () => {
      if (heroBottom === 0) measure();
      setVisible(window.scrollY > heroBottom * 0.7);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-transform duration-350",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{overview.name}</span>
        <div className="flex items-center gap-5 text-xs text-slate-500">
          {journey.slice(0, 4).map((item) => (
            <a key={item.id} href={item.href} className="hover:text-emerald-600 transition-colors">
              {item.title.length > 8 ? item.title.slice(0, 8) + "…" : item.title}
            </a>
          ))}
        </div>
        {data.profile.email && (
          <a
            href={`mailto:${data.profile.email}`}
            className="text-xs rounded-full bg-emerald-600 text-white px-3 py-1.5 font-medium hover:bg-emerald-500 transition-colors"
          >
            联系我
          </a>
        )}
      </div>
    </nav>
  );
}

// ─── Main Exported Component ───────────────────────────────────

export function CareerNarrativeSite({ data, showFooter = true, siteThemeId }: CareerNarrativeSiteProps) {
  const viewModel = buildPublicSiteViewModel(data);
  const {
    overview,
    journey,
    details,
    primarySkills,
    activeTimelineId,
    hasArchitectureSignal,
    publicSiteTemplate,
  } = viewModel;

  const resolvedThemeId = siteThemeId || (data.siteThemeId as SiteThemeId) || "emerald-designer";
  const theme = getTheme(resolvedThemeId);

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Sticky mini nav */}
      <MiniNav data={data} overview={overview} journey={journey} />

      {/* Hero — always use designer layout for emerald-designer theme */}
      {publicSiteTemplate === "minimal-growth" ? (
        <DesignerHero data={data} overview={overview} journey={journey} primarySkills={primarySkills} theme={theme} />
      ) : (
        <DesignerHero data={data} overview={overview} journey={journey} primarySkills={primarySkills} theme={theme} />
      )}

      {/* Growth Rail */}
      <GrowthRail items={journey} />

      {/* Experience Details */}
      <div id="experience-details">
        {details.map((detail, i) => (
          <ExperienceDetail key={detail.id} detail={detail} index={i} total={details.length} theme={theme} />
        ))}
      </div>

      {/* Capability Summary */}
      <CapabilitySummary
        data={data}
        primarySkills={primarySkills}
        activeTimelineId={activeTimelineId}
        hasArchitectureSignal={hasArchitectureSignal}
        theme={theme}
      />

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all hover:bg-slate-800 hover:scale-105"
          aria-label="返回顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      {showFooter && (
        <footer className="border-t border-slate-100 bg-neutral-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            {data.profile.name} ·{" "}
            {data.profile.email && (
              <a href={`mailto:${data.profile.email}`} className="hover:text-emerald-600 transition-colors">
                {data.profile.email}
              </a>
            )}
            {data.profile.phone && <> · {data.profile.phone}</>}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            由{" "}
            <Link href="/" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Career Card
            </Link>{" "}
            提供技术支持
          </p>
        </footer>
      )}
    </div>
  );
}
