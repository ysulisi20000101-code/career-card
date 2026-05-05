"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  BarChart3,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Target,
  TrendingUp,
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
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.38, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function initials(name: string) {
  const value = name.trim();
  if (!value) return "ME";
  if (/^[a-z\s]+$/i.test(value)) {
    return value
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return value.slice(0, 2);
}

function IdentityBadge({ data, compact = false }: { data: ResumeData; compact?: boolean }) {
  const { profile } = data;
  if (profile.avatar) {
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm", compact ? "p-2.5" : "p-3")}>
        <div className="relative overflow-hidden rounded-xl bg-zinc-100 aspect-[3/4]">
          <div
            aria-label={profile.name}
            role="img"
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.avatar})` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3 lg:block">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-lg font-semibold text-white lg:h-16 lg:w-16 lg:text-xl">
          {initials(profile.name)}
        </div>
        <div className="min-w-0 lg:mt-2">
          <p className="truncate text-sm font-semibold text-zinc-950">{profile.name || "个人主页"}</p>
        </div>
      </div>
    </div>
  );
}

function ContactStrip({ data, dark = false }: { data: ResumeData; dark?: boolean }) {
  const { profile } = data;
  const tone = dark ? "border-white/10 bg-white/[0.08] text-white/72" : "border-zinc-200 bg-white text-zinc-600";
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs shadow-sm", tone)}>
      <span className={cn("inline-flex items-center gap-1.5 font-semibold", dark ? "text-white" : "text-zinc-950")}>
        <Mail className="h-3.5 w-3.5" />
        联系我
      </span>
      {profile.email && (
        <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:underline">
          <Mail className="h-3.5 w-3.5" />
          {profile.email}
        </a>
      )}
      {profile.phone && (
        <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
          <Phone className="h-3.5 w-3.5" />
          {profile.phone}
        </a>
      )}
      {profile.location && (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {profile.location}
        </span>
      )}
    </div>
  );
}

function CapabilityPills({ skills, dark = false, limit = 8 }: { skills: string[]; dark?: boolean; limit?: number }) {
  if (skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.slice(0, limit).map((skill) => (
        <span
          key={skill}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            dark ? "border-white/10 bg-white/[0.08] text-white/75" : "border-zinc-200 bg-zinc-50 text-zinc-600",
          )}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function OverviewMetric({ label, value, helper, dark = false }: { label: string; value: string; helper: string; dark?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", dark ? "border-white/10 bg-white/[0.08]" : "border-zinc-200 bg-white")}>
      <p className={cn("text-xs", dark ? "text-white/45" : "text-zinc-500")}>{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-normal", dark ? "text-white" : "text-zinc-950")}>{value}</p>
      <p className={cn("mt-1 line-clamp-2 text-xs leading-5", dark ? "text-white/55" : "text-zinc-500")}>{helper}</p>
    </div>
  );
}

function GrowthRail({ items, dark = false }: { items: PublicJourneyNode[]; dark?: boolean }) {
  const count = items.length;

  const dotRing = dark ? "ring-slate-900" : "ring-white";
  const dotBg = dark ? "bg-teal-300" : "bg-teal-500";
  const dotHiBg = dark ? "bg-indigo-300" : "bg-indigo-500";
  const dotHiRing = dark ? "ring-indigo-900/50" : "ring-indigo-50";
  const lineBg = dark ? "bg-teal-500/30" : "bg-teal-200";
  const hiLineBg = dark ? "bg-indigo-400/40" : "bg-indigo-200";

  // Single continuous line from center of 1st to center of last column
  const lineLeft = `${(0.5 / count) * 100}%`;
  const lineRight = `${((count - 0.5) / count) * 100}%`;

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", dark ? "border-white/10 bg-white/[0.07]" : "border-zinc-200 bg-white")}>
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <TrendingUp className="h-4 w-4" />
        成长路径
      </div>

      {/* Desktop: single horizontal line + grid */}
      <div className="relative hidden md:block pt-1.5">
        <div
          className={cn("absolute top-[8px] h-0.5", lineBg)}
          style={{ left: lineLeft, right: `calc(100% - ${lineRight})` }}
        />
        <div className="relative z-10 grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {items.map((item, idx) => {
            const isLatest = idx === count - 1;
            return (
              <a
                key={item.id}
                href={item.href}
                className="group flex flex-col items-center px-1.5"
              >
                <div
                  className={cn(
                    "mb-3 rounded-full ring-2",
                    isLatest ? cn("h-3.5 w-3.5", dotHiBg, dotHiRing) : cn("h-3 w-3", dotBg, dotRing)
                  )}
                />
                {isLatest && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", dark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600")}>
                    晋升
                  </span>
                )}
                <p className={cn("mt-1 text-[10px] font-medium text-center", isLatest ? (dark ? "text-indigo-300" : "text-indigo-600") : (dark ? "text-teal-300" : "text-teal-600"))}>
                  {item.subtitle}
                </p>
                <p className={cn("text-xs mt-0.5 text-center", dark ? "text-white/45" : "text-zinc-400")}>{item.period}</p>
                <p className={cn("mt-0.5 text-sm font-semibold text-center leading-tight group-hover:underline", dark ? "text-white" : "text-zinc-950")}>
                  {item.title}
                </p>
                <p className={cn("mt-0.5 text-xs text-center leading-5", dark ? "text-white/45" : "text-zinc-500")}>{item.keyword}</p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical timeline with left border */}
      <div className="space-y-0 md:hidden">
        {items.map((item, idx) => {
          const isLatest = idx === count - 1;
          return (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                "group relative block pl-6",
                idx < count - 1 && "pb-4",
                isLatest ? "border-l-2 border-indigo-300" : "border-l-2 border-teal-200"
              )}
            >
              <div
                className={cn(
                  "absolute left-0 top-1 -translate-x-1/2 rounded-full ring-2",
                  isLatest ? cn("h-3.5 w-3.5", dotHiBg, dotHiRing) : cn("h-3 w-3", dotBg, dotRing)
                )}
              />
              {isLatest && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", dark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600")}>
                  晋升
                </span>
              )}
              <p className={cn("text-xs", dark ? "text-white/45" : "text-zinc-500")}>{item.period}</p>
              <p className={cn("mt-0.5 text-sm font-semibold group-hover:underline", dark ? "text-white" : "text-zinc-950")}>{item.title}</p>
              <p className={cn("mt-0.5 text-xs leading-5", dark ? "text-white/45" : "text-zinc-500")}>{item.keyword}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ExecutiveDossierOverview({
  data,
  overview,
  journey,
  primarySkills,
  theme,
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  primarySkills: string[];
  theme: SiteTheme;
}) {
  return (
    <section className={cn("px-4 py-5 text-zinc-950 sm:px-6 lg:px-8", theme.section.bg)}>
      <div className="mx-auto max-w-7xl rounded-[28px] border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-300/45 lg:p-7">
        <div className="grid gap-5 lg:grid-cols-[140px_1fr]">
          <IdentityBadge data={data} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">{overview.name}</h1>
                <p className="mt-2 text-sm text-zinc-500">{overview.targetRole}</p>
              </div>
              <ContactStrip data={data} />
            </div>
            {overview.summaryBullets.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {overview.summaryBullets.map((item) => (
                  <div key={item} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
                    {item}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5">
              <p className="mb-3 text-xs font-semibold text-zinc-500">核心能力</p>
              <CapabilityPills skills={primarySkills} limit={5} />
            </div>
          </div>
        </div>

        <div className={cn("mt-6 grid gap-5 rounded-2xl p-5 text-white lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)]", theme.hero.bg)}>
          <div>
            <p className="text-xs text-white/45">代表成果</p>
            <h2 className="mt-2 text-2xl font-semibold leading-9">{overview.heroOutcome}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {overview.metrics.map((metric) => (
              <OverviewMetric key={`${metric.label}-${metric.value}`} dark {...metric} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <GrowthRail items={journey} />
        </div>

      </div>
    </section>
  );
}

function MinimalGrowthOverview({
  data,
  overview,
  journey,
  primarySkills,
  theme,
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  primarySkills: string[];
  theme: SiteTheme;
}) {
  const hasAvatar = Boolean(data.profile.avatar);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const sections = ["overview", "experience-details", "capability-summary"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const navLink = (href: string, label: string) => {
    const sectionId = href.replace("#", "");
    return (
      <a
        href={href}
        className={activeSection === sectionId ? "text-zinc-950" : "text-zinc-500"}
      >
        {label}
      </a>
    );
  };

  return (
    <section className={cn("px-4 py-5 text-zinc-950 sm:px-6 lg:px-8", theme.section.bg)}>
      <div className="mx-auto max-w-7xl rounded-[26px] border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-300/45 lg:p-7">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="text-xl font-bold tracking-tight">{initials(overview.name)}.</div>
          <nav className="hidden items-center gap-8 text-xs font-medium md:flex">
            {navLink("#overview", "首页")}
            {navLink("#capability-summary", "核心能力")}
            {navLink("#experience-details", "成长路径")}
          </nav>
          {data.profile.email && (
            <a href={`mailto:${data.profile.email}`} className={cn("rounded-lg px-4 py-2 text-xs font-medium text-white", theme.hero.bg)}>
              联系我
            </a>
          )}
        </header>

        <div id="overview" className={cn("grid gap-6 lg:items-start", hasAvatar ? "lg:grid-cols-[160px_1fr_300px]" : "lg:grid-cols-[1fr_300px]")}>
          {hasAvatar && <IdentityBadge data={data} compact />}
          <div>
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">{overview.name}</h1>
            <p className={cn("mt-3 text-sm font-medium", theme.section.accent)}>目标角色：{overview.targetRole}</p>
            {overview.summaryBullets.length > 0 && (
              <div className="mt-5 grid gap-2">
                {overview.summaryBullets.map((item) => (
                  <p key={item} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-700">
                    {item}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {overview.metrics.map((metric) => (
                <OverviewMetric key={`${metric.label}-${metric.value}`} {...metric} />
              ))}
            </div>
          </div>
          <div className={cn("rounded-2xl p-5 text-white shadow-xl", theme.hero.bg)}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-amber-300" />
              代表成果
            </div>
            <h2 className="text-xl font-semibold leading-8">{overview.heroOutcome}</h2>
            <div className="mt-5">
              <CapabilityPills skills={primarySkills} dark limit={5} />
            </div>
          </div>
        </div>

        <div className="mt-7">
          <GrowthRail items={journey} />
        </div>

      </div>
    </section>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{value}</p>
    </div>
  );
}

function EarlyRows({ rows }: { rows?: PublicExperienceDetail["earlyRows"] }) {
  if (!rows?.length) return null;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-zinc-950">实习经历</p>
      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <div key={`${row.company}-${row.role}`} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <p className="text-sm font-semibold text-zinc-950">{row.company}</p>
            <p className="mt-1 text-xs text-zinc-500">{row.role}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-600">{row.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceDetail({ detail, theme }: { detail: PublicExperienceDetail; theme: SiteTheme }) {
  return (
    <MotionSection id={`experience-${detail.id}`} className="scroll-mt-8 border-t border-zinc-200 bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={cn("text-xs font-semibold", theme.section.accent)}>{detail.eyebrow}</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-zinc-950">{detail.title}</h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness className="h-4 w-4" />
                {detail.meta}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {detail.period}
              </span>
            </div>
          </div>
          {detail.isLatest && <span className={cn("rounded-full px-3 py-1.5 text-xs font-medium text-white", theme.hero.bg)}>最新重点经历</span>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {detail.blocks.map((block) => (
            <DetailBlock key={`${detail.id}-${block.label}`} label={block.label} value={block.value} />
          ))}
        </div>

        {detail.supportBlocks.length > 0 && (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-950">
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

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.65fr]">
          {detail.reflection && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-zinc-500">思考</p>
              <p className="mt-3 text-sm leading-7 text-zinc-700">{detail.reflection}</p>
            </div>
          )}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-zinc-500">关联能力</p>
            <CapabilityPills skills={detail.skills} />
          </div>
        </div>

        <div className="mt-4">
          <EarlyRows rows={detail.earlyRows} />
        </div>
      </div>
    </MotionSection>
  );
}

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
    <MotionSection id="capability-summary" className="border-t border-zinc-200 bg-white px-4 py-14 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className={cn("text-xs font-semibold", theme.section.accent)}>能力摘要</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">从经历里沉淀出的工作方式</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600">
              这里保留能力结构、强项来源和对应经历，便于快速理解我的工作方式。
            </p>
            <div className="mt-5">
              <CapabilityPills skills={primarySkills} />
            </div>
          </div>
          {data.education.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <GraduationCap className={cn("h-4 w-4", theme.section.accent)} />
                教育背景
              </div>
              <div className="space-y-2">
                {data.education.map((edu) => (
                  <div key={edu.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{edu.school}</span>
                    <span className="text-zinc-500">
                      {edu.degree} · {edu.major} · {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className={cn("h-4 w-4", theme.section.accent)} />
              能力结构
            </div>
            <div className="h-[420px] overflow-hidden rounded-xl bg-zinc-50">
              <SkillMapView data={data} activeTimelineId={activeTimelineId} className="min-h-[420px]" />
            </div>
          </div>
          {hasArchitectureSignal && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className={cn("h-4 w-4", theme.section.accent)} />
                业务结构
              </div>
              <div className="h-[420px] overflow-hidden rounded-xl bg-zinc-50">
                <ArchitectureView data={data} activeTimelineId={activeTimelineId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </MotionSection>
  );
}

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

  const resolvedThemeId = siteThemeId || (data.siteThemeId as SiteThemeId) || "warm-business";
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
    <div className="min-h-screen bg-white text-zinc-950">
      {publicSiteTemplate === "minimal-growth" ? (
        <MinimalGrowthOverview data={data} overview={overview} journey={journey} primarySkills={primarySkills} theme={theme} />
      ) : (
        <ExecutiveDossierOverview data={data} overview={overview} journey={journey} primarySkills={primarySkills} theme={theme} />
      )}

      <div id="experience-details">
        {details.map((detail) => (
          <ExperienceDetail key={detail.id} detail={detail} theme={theme} />
        ))}
      </div>

      <CapabilitySummary
        data={data}
        primarySkills={primarySkills}
        activeTimelineId={activeTimelineId}
        hasArchitectureSignal={hasArchitectureSignal}
        theme={theme}
      />

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:bg-zinc-800 hover:scale-105"
          aria-label="返回顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {showFooter && (
        <footer className="border-t border-zinc-200 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-zinc-700">
            由{" "}
            <Link href="/" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Career Card
            </Link>{" "}
            提供技术支持
          </p>
          <p className="mt-2 text-xs text-zinc-400">简历变职业网站，面试变故事演示</p>
        </footer>
      )}
    </div>
  );
}
