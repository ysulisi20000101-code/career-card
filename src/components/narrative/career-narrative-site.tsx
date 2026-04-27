"use client";

import type React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
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
import { cn, formatDate } from "@/lib/utils";
import SkillMapView from "@/components/skillmap/skill-map-view";
import ArchitectureView from "@/components/architecture/architecture-view";

interface CareerNarrativeSiteProps {
  data: ResumeData;
  showFooter?: boolean;
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
      <div className={cn("overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm", compact ? "p-3" : "p-4")}>
        <div className={cn("relative overflow-hidden rounded-xl bg-zinc-100", compact ? "aspect-square" : "aspect-[4/5]")}>
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4 lg:block">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-xl font-semibold text-white lg:h-20 lg:w-20 lg:text-2xl">
          {initials(profile.name)}
        </div>
        <div className="min-w-0 lg:mt-3">
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

function journeyLevel(title: string): number {
  if (/实习/.test(title)) return 0;
  if (/总监/.test(title)) return 3;
  if (/负责人|Leader|leader/.test(title)) return 2;
  if (/经理/.test(title)) return 1;
  return 1;
}

function GrowthRail({ items, dark = false }: { items: PublicJourneyNode[]; dark?: boolean }) {
  const plottedItems = items.map((item) => ({ ...item, level: journeyLevel(item.title) }));
  const maxLevel = Math.max(1, ...plottedItems.map((item) => item.level));
  const points = plottedItems
    .map((item, index) => {
      const x = plottedItems.length === 1 ? 50 : 6 + (index * 88) / (plottedItems.length - 1);
      const y = 84 - (item.level / maxLevel) * 58;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm", dark ? "border-white/10 bg-white/[0.07]" : "border-zinc-200 bg-white")}>
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <TrendingUp className="h-4 w-4" />
        成长路径
      </div>
      <div className="relative">
        <svg
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-24 w-full md:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={points}
            fill="none"
            stroke={dark ? "rgba(94,234,212,0.5)" : "rgba(15,118,110,0.45)"}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="grid gap-6 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
          {plottedItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="group relative block"
            style={{ marginTop: `${(maxLevel - item.level) * 18}px` }}
          >
            <div className={cn("relative z-10 mb-3 h-3 w-3 rounded-full ring-4", dark ? "bg-teal-300 ring-slate-900" : "bg-teal-700 ring-white")} />
            <p className={cn("text-xs", dark ? "text-white/45" : "text-zinc-500")}>{item.period}</p>
            <p className={cn("mt-1 text-sm font-semibold group-hover:underline", dark ? "text-white" : "text-zinc-950")}>
              {item.title}
            </p>
            <p className={cn("mt-1 text-xs leading-5", dark ? "text-white/45" : "text-zinc-500")}>{item.keyword}</p>
          </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutiveDossierOverview({
  data,
  overview,
  journey,
  primarySkills,
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  primarySkills: string[];
}) {
  return (
    <section className="bg-[#f7f7f4] px-4 py-5 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-300/45 lg:p-7">
        <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
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

        <div className="mt-6 grid gap-5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-5 text-white lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)]">
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
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  primarySkills: string[];
}) {
  const hasAvatar = Boolean(data.profile.avatar);
  return (
    <section className="bg-[#f6f7f4] px-4 py-5 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[26px] border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-300/45 lg:p-7">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="text-xl font-bold tracking-tight">{initials(overview.name)}.</div>
          <nav className="hidden items-center gap-8 text-xs font-medium text-zinc-500 md:flex">
            <a href="#overview" className="text-zinc-950">首页</a>
            <a href="#capability-summary">核心能力</a>
            <a href="#experience-details">成长路径</a>
          </nav>
          {data.profile.email && (
            <a href={`mailto:${data.profile.email}`} className="rounded-lg bg-teal-950 px-4 py-2 text-xs font-medium text-white">
              联系我
            </a>
          )}
        </header>

        <div id="overview" className={cn("grid gap-8 lg:items-start", hasAvatar ? "lg:grid-cols-[200px_1fr_300px]" : "lg:grid-cols-[1fr_300px]")}>
          {hasAvatar && <IdentityBadge data={data} compact />}
          <div>
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">{overview.name}</h1>
            <p className="mt-3 text-sm font-medium text-teal-800">目标角色：{overview.targetRole}</p>
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
          <div className="rounded-2xl bg-teal-950 p-5 text-white shadow-xl shadow-teal-950/20">
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

function ExperienceDetail({ detail }: { detail: PublicExperienceDetail }) {
  return (
    <MotionSection id={`experience-${detail.id}`} className="scroll-mt-8 border-t border-zinc-200 bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-teal-700">{detail.eyebrow}</p>
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
          {detail.isLatest && <span className="rounded-full bg-teal-950 px-3 py-1.5 text-xs font-medium text-white">最新重点经历</span>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {detail.blocks.map((block) => (
            <DetailBlock key={`${detail.id}-${block.label}`} label={block.label} value={block.value} />
          ))}
        </div>

        {detail.supportBlocks.length > 0 && (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <CheckCircle2 className="h-4 w-4 text-teal-700" />
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
}: {
  data: ResumeData;
  primarySkills: string[];
  activeTimelineId: string | null;
  hasArchitectureSignal: boolean;
}) {
  return (
    <MotionSection id="capability-summary" className="border-t border-zinc-200 bg-white px-4 py-14 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold text-teal-700">能力摘要</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">从经历里沉淀出的工作方式</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600">
              这里保留能力结构、强项来源和对应经历，便于快速理解我的工作方式。
            </p>
            <div className="mt-5">
              <CapabilityPills skills={primarySkills} />
            </div>
          </div>
          {data.education.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <GraduationCap className="h-4 w-4 text-teal-700" />
                教育背景
              </div>
              <div className="space-y-3">
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
              <BarChart3 className="h-4 w-4 text-teal-700" />
              能力结构
            </div>
            <div className="h-[420px] overflow-hidden rounded-xl bg-zinc-50">
              <SkillMapView data={data} activeTimelineId={activeTimelineId} className="min-h-[420px]" />
            </div>
          </div>
          {hasArchitectureSignal && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-teal-700" />
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

export function CareerNarrativeSite({ data, showFooter = true }: CareerNarrativeSiteProps) {
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

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      {publicSiteTemplate === "minimal-growth" ? (
        <MinimalGrowthOverview data={data} overview={overview} journey={journey} primarySkills={primarySkills} />
      ) : (
        <ExecutiveDossierOverview data={data} overview={overview} journey={journey} primarySkills={primarySkills} />
      )}

      <div id="experience-details">
        {details.map((detail) => (
          <ExperienceDetail key={detail.id} detail={detail} />
        ))}
      </div>

      <CapabilitySummary
        data={data}
        primarySkills={primarySkills}
        activeTimelineId={activeTimelineId}
        hasArchitectureSignal={hasArchitectureSignal}
      />

      {showFooter && (
        <footer className="border-t border-zinc-200 bg-white px-6 py-8 text-center text-xs text-zinc-500">
          Career Card · 个人职业主页
        </footer>
      )}
    </div>
  );
}
