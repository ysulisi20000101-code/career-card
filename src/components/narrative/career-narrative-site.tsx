"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Mail,
  Maximize2,
  Phone,
  X,
} from "lucide-react";
import type { ResumeData } from "@/types";
import type { PublicExperienceDetail, PublicJourneyNode, PublicOverview } from "@/lib/public-site/content";
import { buildPublicSiteViewModel } from "@/lib/public-site/view-model";
import { getTheme, type SiteTheme, type SiteThemeId } from "@/lib/site-styles/theme-config";
import { cn, formatDate } from "@/lib/utils";

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

function Atmosphere({ theme }: { theme: SiteTheme }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b via-transparent to-transparent blur-3xl", theme.hero.glowA)} />
      <div className={cn("absolute bottom-1/3 right-1/4 w-[400px] h-[300px] rounded-full bg-gradient-to-t via-transparent to-transparent blur-3xl", theme.hero.glowB)} />
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

function publicProfileText(data: ResumeData): string {
  return [
    data.profile.name,
    data.profile.title,
    data.profile.summary,
    data.roleUnderstanding?.targetRoleTitle,
    data.skillProfile?.roleName,
    ...data.timeline.flatMap((node) => [
      node.company,
      node.position,
      node.description,
      node.storyReflection,
      ...node.highlights,
      ...node.skills,
      ...(node.promotionStages ?? []).flatMap((stage) => [
        stage.title,
        stage.period,
        stage.teamScale,
        stage.responsibility,
        stage.outcome,
        stage.reflection,
      ]),
    ]),
    ...data.skills.map((skill) => skill.name),
    ...data.architecture.flatMap((item) => [item.title, item.description]),
  ]
    .filter(Boolean)
    .join(" ");
}

function isReferenceDesignerProfile(data: ResumeData): boolean {
  const text = publicProfileText(data);
  const evidence = [
    /Groot-Arch/i,
    /AI\s*Agent/i,
    /RAG/i,
    /国科础石/,
    /工具链/,
    /SOME\/IP|DDS/,
    /产品总监|产品负责人/,
  ];
  return evidence.filter((pattern) => pattern.test(text)).length >= 2;
}

function referenceHeroMetrics(fallback: PublicOverview["metrics"]): PublicOverview["metrics"] {
  const preferred: PublicOverview["metrics"] = [
    { label: "客户项目", value: "10+", helper: "汽车 / 军工等客户项目" },
    { label: "协作范围", value: "100+", helper: "研发用户与业务团队支撑" },
    { label: "效率提升", value: "50%+", helper: "关键环节效率提升" },
    { label: "专家 Agent", value: "0→1", helper: "E/E 全域协作系统" },
  ];

  if (fallback.length >= 4) return preferred;
  const seen = new Set(preferred.map((metric) => metric.value));
  for (const metric of fallback) {
    if (!seen.has(metric.value) && preferred.length < 4) preferred.push(metric);
  }
  return preferred.slice(0, 4);
}

const REFERENCE_VALUE_CARDS = [
  {
    title: "专家 Agent 协作落地",
    body: "具备工程对象建模、专家路由、工具编排、设计依据维护与工程评审机制设计经验。",
  },
  {
    title: "复杂业务快速抽象",
    body: "快速切入高门槛业务场景，将专家经验、业务流程和交付要求抽象为可复用产品能力。",
  },
  {
    title: "平台产品与商业闭环",
    body: "管理 10 人产品团队，覆盖产品规划、重点交付、售前转化与商业化闭环。",
  },
] as const;

function DesignerHero({
  data,
  overview,
  primarySkills,
  theme,
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  primarySkills: string[];
  theme: SiteTheme;
}) {
  const referenceMode = isReferenceDesignerProfile(data);
  const metrics = referenceMode ? referenceHeroMetrics(overview.metrics) : overview.metrics.slice(0, 4);
  const valueCards = referenceMode
    ? REFERENCE_VALUE_CARDS
    : overview.summaryBullets.slice(0, 3).map((bullet, i) => ({
        title: primarySkills[i] ?? overview.targetRole,
        body: bullet,
      }));
  const label = referenceMode ? "Candidate Profile / AI Product Lead" : overview.positionLine || overview.targetRole;

  return (
    <header id="overview" className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-b from-neutral-50 via-white to-white">
      <Atmosphere theme={theme} />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 sm:py-32 w-full">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={cn("inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase", theme.section.accent)}>
            <span className={cn("h-1 w-6 rounded-full", theme.section.accentBg)} />
            {label}
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

        {referenceMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5"
          >
            <span className={cn("inline-flex rounded-full px-4 py-2 text-sm font-medium", theme.section.accentBg, theme.section.accentText)}>
              AI 产品负责人 · 平台产品 / Agent 落地 / 复杂业务抽象
            </span>
          </motion.div>
        )}

        {/* One-liner */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl"
        >
          <p className="text-xl sm:text-2xl text-slate-500 font-light leading-relaxed">
            {referenceMode ? (
              <>
                AI 产品负责人 / 平台产品负责人。
                <br className="hidden sm:block" />
                <span className="text-slate-700 font-normal">
                  擅长将复杂业务流程抽象为平台能力、AI Agent 工作流与可落地的商业化方案。
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-700 font-normal">{overview.targetRole}</span>
                {overview.summaryBullets[0] && <> — {overview.summaryBullets[0]}</>}
              </>
            )}
          </p>
        </motion.div>

        {/* Metrics */}
        {metrics.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.17, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl"
          >
            {metrics.map((metric, i) => (
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
          <p className="text-xs tracking-[0.2em] text-slate-300 uppercase">{referenceMode ? "查看关键经历" : "滚动了解经历"}</p>
          <ChevronDown className="mt-3 mx-auto h-4 w-4 text-slate-300 animate-bounce" />
        </motion.div>
      </div>
    </header>
  );
}

// ─── v5 Growth Rail ─────────────────────────────────────────────

const PHASE_LABELS = ["实习期", "成长期", "突破期"] as const;

function phaseLabel(index: number, total: number): string {
  if (index === total - 1) return "当前";
  return PHASE_LABELS[index] ?? PHASE_LABELS[PHASE_LABELS.length - 1];
}

const REFERENCE_JOURNEY = [
  { title: "产品实习生", keyword: "京东健康 · 百度 · 京东" },
  { title: "工具链产品经理", keyword: "经纬恒润" },
  { title: "平台产品经理", keyword: "国科础石" },
  { title: "产品负责人 / 总监", keyword: "国科础石 · 10人团队" },
] as const;

function referenceJourneyLabel(item: PublicJourneyNode, index: number, field: "title" | "keyword", referenceMode: boolean): string {
  if (!referenceMode) return item[field];
  return REFERENCE_JOURNEY[index]?.[field] ?? item[field];
}

function GrowthRail({ items, theme, referenceMode }: { items: PublicJourneyNode[]; theme: SiteTheme; referenceMode: boolean }) {
  const count = items.length;

  return (
    <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <p className={cn("text-xs font-medium tracking-[0.15em] uppercase mb-2", theme.section.accent)}>成长路径</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          {referenceMode ? "从互联网产品基础到 AI 平台负责人" : "从起点到当前"}
        </h2>
        <p className="mt-3 text-sm text-slate-500 max-w-lg">
          {referenceMode
            ? "经历互联网产品基础训练、汽车/工业软件平台建设与企业级 AI 能力落地，逐步从单点产品执行成长为平台体系负责人。"
            : `${count} 段经历组成职业成长路径，点击跳转查看各阶段详情。`}
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
                        ? cn("w-12 h-12 text-white shadow-lg", theme.section.accentSolid, "shadow-emerald-300/20")
                        : cn("w-10 h-10 bg-white border-2", theme.section.accentBorder, theme.section.accentText),
                    )}
                  >
                    {idx + 1}
                  </div>
                  {isLatest && (
                    <span className={cn("rounded-full text-[10px] font-medium px-2 py-0.5 mb-1", theme.section.accentBg, theme.section.accentText)}>当前</span>
                  )}
                  <p className={cn("text-[11px] font-medium", theme.section.accent)}>{phaseLabel(idx, count)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.period}</p>
                  <p className={cn("mt-1.5 text-sm font-semibold text-slate-800 transition-colors text-center leading-tight", theme.section.groupHoverAccent)}>
                    {referenceJourneyLabel(item, idx, "title", referenceMode)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 text-center leading-relaxed max-w-[140px]">
                    {referenceJourneyLabel(item, idx, "keyword", referenceMode)}
                  </p>
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
                  isLatest
                    ? cn("border-l-2", theme.section.accentLight?.replace("text-", "border-") || "border-emerald-400")
                    : cn("border-l-2", theme.section.accentBorder),
                )}
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 -translate-x-1/2 flex items-center justify-center rounded-full text-xs font-bold",
                    isLatest
                      ? cn("w-8 h-8 text-white shadow-md", theme.section.accentSolid)
                      : cn("w-7 h-7 bg-white border-2", theme.section.accentBorder, theme.section.accentText),
                  )}
                >
                  {idx + 1}
                </div>
                {isLatest && (
                  <span className={cn("inline-block rounded-full text-[10px] font-medium px-2 py-0.5 mb-1", theme.section.accentBg, theme.section.accentText)}>当前</span>
                )}
                <p className="text-xs text-slate-400">{item.period}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{referenceJourneyLabel(item, idx, "title", referenceMode)}</p>
                <p className="text-xs text-slate-400">{referenceJourneyLabel(item, idx, "keyword", referenceMode)}</p>
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

function tagStyle(index: number, total: number, isFirst: boolean, theme: SiteTheme): string {
  const isLatest = index === total - 1;
  if (isLatest && isFirst) return "bg-slate-900 text-white font-medium";
  if (isFirst) return cn(theme.section.accentBg, theme.section.accentText, "font-medium");
  return "bg-slate-100 text-slate-500";
}

const REFERENCE_INTERNSHIP_CARDS = [
  {
    company: "京东健康",
    summary: "后台产品 · 测评中台 0-1 建设与上线",
  },
  {
    company: "百度",
    summary: "后台产品 · 机构答主系统搭建，数据 BI 与用户画像体系建设",
  },
  {
    company: "京东",
    summary: "用户产品 · 权益中心 17 款权益上线，点击占比 3.7%",
  },
] as const;

const REFERENCE_INTERNSHIP_SKILLS = ["需求分析", "用户研究", "数据分析", "后台产品", "运营机制"] as const;
const REFERENCE_INTERNSHIP_TITLE = "京东健康 / 百度 / 京东 · 产品实习生";
const REFERENCE_INTERNSHIP_PERIOD = "2020年12月 — 2022年04月";

function InternshipDetail({
  detail,
  index,
  theme,
}: {
  detail: PublicExperienceDetail;
  index: number;
  total: number;
  theme: SiteTheme;
}) {
  return (
    <MotionSection
      id={`experience-${detail.id}`}
      className="relative scroll-mt-14 bg-white px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-100" />

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", theme.section.accentBg, theme.section.accentText)}>
            {index + 1}
          </span>
          <span className={cn("text-xs font-medium tracking-[0.12em] uppercase", theme.section.accent)}>经历详情</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{REFERENCE_INTERNSHIP_TITLE}</h2>
            <p className="mt-2 text-sm text-slate-400">{REFERENCE_INTERNSHIP_PERIOD} · 三段产品实习</p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600">
              在京东健康、百度、京东参与后台产品、用户产品、数据建设与运营工具工作，形成对 B 端系统、用户路径、数据指标和商业化场景的基础产品认知。
            </p>
          </div>

          <div className="grid gap-3">
            {REFERENCE_INTERNSHIP_CARDS.map((row) => (
              <div key={row.company} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-700">{row.company}</p>
                <p className="mt-0.5 text-sm text-slate-500">{row.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {REFERENCE_INTERNSHIP_SKILLS.map((skill) => (
            <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </MotionSection>
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

  if (detail.id === "internship") {
    return <InternshipDetail detail={detail} index={index} total={total} theme={theme} />;
  }

  return (
    <MotionSection
      id={`experience-${detail.id}`}
      className={cn("relative scroll-mt-14 px-4 py-16 sm:px-6 lg:px-8", bg)}
    >
      {/* Accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-[3px]", theme.section.accentSolid)} />

      <div className="max-w-5xl mx-auto">
        {/* Header with number */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className={cn(
              "flex items-center justify-center rounded-full text-xs font-bold shrink-0",
              isLast
                ? cn("w-10 h-10 text-white text-sm shadow-md shadow-emerald-300/20", theme.section.accentSolid)
                : cn("w-8 h-8", theme.section.accentBg, theme.section.accentText),
            )}
          >
            {index + 1}
          </span>
          <div>
            <span className={cn("text-xs font-medium tracking-[0.12em] uppercase", theme.section.accent)}>经历详情</span>
            {isLast && (
              <span className={cn("ml-3 rounded-full text-white text-[10px] font-medium px-2.5 py-0.5", theme.section.accentSolid)}>
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold text-slate-500">关联能力</p>
            <div className="flex flex-wrap gap-1.5">
              {detail.skills.map((skill, i) => (
                <span
                  key={skill}
                  className={cn("text-[11px] rounded-full px-2.5 py-1", tagStyle(index, total, i === 0, theme))}
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

// ─── v5 Core Projects ──────────────────────────────────────────

const INDUSTRY_LABELS: Record<string, string> = { internet: "互联网", automotive: "汽车", finance: "金融" };
const TYPE_LABELS: Record<string, string> = { business: "业务产品", technical: "技术平台" };

const REFERENCE_PROJECTS = [
  {
    num: "01",
    eyebrow: "核心单品负责人",
    title: "Groot-Arch 架构设计工具",
    description:
      "面向复杂装备研发的系统工程平台，覆盖需求、功能、系统、通信、诊断、软件六大模块，体现我对高复杂度业务流程的平台化抽象能力。",
    bullets: [
      "统一需求、架构、通信、诊断与软件设计数据模型",
      "对标 DOORS、EA、PREEvision、SystemWeaver 等工具生态",
      "支撑文档驱动向模型驱动转型",
      "参与工信部汽车工具链摸底调研",
    ],
    visual: "architecture",
    imageSrc: "/project-visuals/groot-arch.png",
  },
  {
    num: "02",
    eyebrow: "产品负责人 · E/E 专家 Agent",
    title: "汽车 E/E 全域专家 Agent 协作系统",
    description:
      "面向汽车 E/E 全域工程，基于工程知识库、原生工具编排与全域数据维护，构建覆盖架构、通信、诊断、软件多角色协同的专家 Agent 体系。",
    bullets: [
      "设计架构、网络通信、诊断、软件四类专家 Agent 的业务范围与协作边界",
      "通过统一工程对象、产品线上下文、变更影响链和设计依据维护支撑跨角色协同",
      "面向变更影响分析、车型变型管理、方案复用、一致性校验与工程追溯等高价值任务",
      "覆盖 10+ 客户 / 项目与 100+ 研发用户，关键流程效率提升 20%+",
    ],
    visual: "agent",
    imageSrc: "/project-visuals/agent-ee-expert-system.png",
  },
  {
    num: "03",
    eyebrow: "独立项目负责人 · Agent 产品设计",
    title: "Career-Card · 面试空间智能叙事系统",
    description:
      "面向求职与面试表达场景，独立设计 AI Agent 产品，将简历经历转化为结构化、可校验、可展示的职业叙事空间。",
    bullets: [
      "简历解析 → 证据抽取 → 故事主线 → 表达生成",
      "事实校验、人工确认、可展示的职业材料交付",
      "证据约束，避免虚构经历、指标和项目结论",
      "支持项目讲述、表达微调和面试场景展示",
    ],
    visual: "career",
    imageSrc: "/project-visuals/career-card-story.png",
  },
] as const;

type ReferenceProject = (typeof REFERENCE_PROJECTS)[number];

const ARCH_DESIGN_ITEMS = [
  ["需求管理", "IBM DOORS / Polarion"],
  ["功能设计", "Sparx EA / PREEvision"],
  ["系统设计", "PREEvision / SystemWeaver"],
  ["通信设计", "CANdb++ / SOME-IP"],
  ["诊断设计", "CANdelaStudio / UDS"],
] as const;

const ARCH_VERIFY_ITEMS = [
  ["仿真验证", "HIL / SIL / 服务仿真"],
  ["验收测试", "CANoe / Indigo"],
  ["系统测试", "CANoe / dSPACE"],
  ["集成测试", "TSMaster"],
  ["部件测试", "CANoe.DiVa"],
] as const;

const ARCH_PIPELINE_ITEMS = ["需求", "功能", "系统", "通信", "诊断", "软件"] as const;

function ArchitectureStack({ title, subtitle, items, tone }: { title: string; subtitle: string; items: readonly (readonly [string, string])[]; tone: "design" | "verify" }) {
  return (
    <div>
      <div className="mb-3 text-center">
        <p className={cn("text-[11px] font-bold", tone === "design" ? "text-emerald-700" : "text-indigo-600")}>{title}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>
      </div>
      <div className="space-y-2">
        {items.map(([name, meta], index) => {
          const highlighted = tone === "design" ? index >= 3 : index === 0;
          return (
            <div
              key={name}
              className={cn(
                "rounded-xl border px-3 py-2 shadow-sm",
                highlighted
                  ? tone === "design"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-100 bg-slate-50 text-slate-500",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold">{name}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed opacity-75">{meta}</p>
                </div>
                {tone === "design" && highlighted && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">国产 ✓</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentProjectVisual({ expanded = false }: { expanded?: boolean }) {
  const agents = [
    ["架构专家", "全车方案评估"],
    ["通信专家", "接口一致性"],
    ["诊断专家", "测试闭环"],
    ["软件专家", "版本与追溯"],
    ["协作中枢", "产品线/变更链"],
  ] as const;
  const metrics = [
    ["10+", "客户 / 项目验证"],
    ["100+", "研发用户覆盖"],
    ["20%+", "流程提效"],
    ["50%+", "关键环节提效"],
  ] as const;

  return (
    <div className={cn("relative z-20 w-full rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-xl shadow-slate-900/10", expanded ? "p-5 sm:p-7" : "p-4")}>
      <div className="border-b border-slate-100 pb-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Automotive E/E Expert Agent System</p>
        <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">汽车 E/E 全域专家 Agent 协作系统</h4>
        <p className="mt-1 text-[11px] font-medium text-emerald-700">专家 Agent 协作 · 工程对象建模 · 原生工具编排</p>
      </div>

      <div className={cn("mt-5 grid gap-3", expanded ? "sm:grid-cols-5" : "grid-cols-2 xl:grid-cols-5")}>
        {agents.map(([name, meta], index) => (
          <div key={name} className={cn("rounded-2xl border px-3 py-3 text-center shadow-sm", index === 2 ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50")}>
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-700 shadow-sm">
              {index + 1}
            </span>
            <p className="mt-2 text-xs font-bold text-slate-800">{name}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{meta}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
        <div className={cn("grid gap-3", expanded ? "sm:grid-cols-[0.95fr_1.05fr]" : "xl:grid-cols-[0.95fr_1.05fr]")}>
          <div className="rounded-xl border border-emerald-100 bg-white p-4">
            <p className="text-xs font-bold text-emerald-700">工程资产底座</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
              {["需求文档", "架构模型", "通信接口", "历史方案"].map((item) => (
                <span key={item} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold text-slate-800">产品化机制</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500">
              {["对象建模", "专家路由", "工具编排", "工程评审", "质量回流"].map((item, index) => (
                <span key={item} className={cn("rounded-full px-2 py-1", index === 3 ? "bg-amber-50 text-amber-700" : "bg-slate-50")}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("mt-4 grid gap-2", expanded ? "sm:grid-cols-4" : "grid-cols-2 xl:grid-cols-4")}>
        {metrics.map(([value, label]) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center">
            <p className="text-lg font-bold text-emerald-700">{value}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CareerCardProjectVisual({ expanded = false }: { expanded?: boolean }) {
  const stages = [
    ["简历解析", "结构化抽取"],
    ["证据抽取", "项目 / 指标"],
    ["证据约束", "事实校验"],
    ["叙事蓝图", "8 页故事"],
    ["投屏空间", "交互展示"],
  ] as const;

  return (
    <div className={cn("relative z-20 w-full rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-xl shadow-slate-900/10", expanded ? "p-5 sm:p-7" : "p-4")}>
      <div className="border-b border-slate-100 pb-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Career-Card Agent System</p>
        <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">面试空间智能叙事系统</h4>
        <p className="mt-1 text-[11px] font-medium text-emerald-700">AI 简历解析 · 证据约束 · 可投屏职业叙事</p>
      </div>

      <div className={cn("mt-5 grid gap-4", expanded ? "lg:grid-cols-[0.8fr_1.2fr_0.9fr]" : "xl:grid-cols-[0.8fr_1.2fr_0.9fr]")}>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-800">输入资产</p>
          <div className="mt-3 space-y-2 text-[10px] text-slate-500">
            {["简历 PDF / DOCX", "项目经历", "成果指标"].map((item) => (
              <div key={item} className="rounded-lg bg-white px-3 py-2 shadow-sm">{item}</div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-center">
          <p className="text-xs font-bold text-emerald-700">AI Agent 中枢</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stages.map(([name, meta], index) => (
              <div key={name} className={cn("rounded-xl border bg-white px-3 py-2 shadow-sm", index === 2 ? "border-amber-200" : "border-slate-100")}>
                <p className="text-[11px] font-bold text-slate-800">{name}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{meta}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-800">输出空间</p>
          <div className="mt-3 rounded-xl bg-slate-900 p-3 text-white">
            <p className="text-[10px] font-bold text-emerald-300">INTERVIEW DECK</p>
            <div className="mt-2 h-3 w-24 rounded bg-white/90" />
            <div className="mt-2 h-2 w-16 rounded bg-white/30" />
            <div className="mt-4 grid gap-1.5">
              {["Hero", "Tension", "Agent Leap", "Impact"].map((item) => (
                <span key={item} className="rounded bg-white/10 px-2 py-1 text-[10px] text-slate-200">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-center">
        <p className="text-[11px] font-semibold text-emerald-700">Human-in-the-Loop</p>
        <p className="mt-1 text-[10px] text-emerald-700/70">事实证据、人工确认、岗位定制与面试场景展示形成闭环</p>
      </div>
    </div>
  );
}

function ReferenceProjectVisual({ project, expanded = false }: { project: ReferenceProject; expanded?: boolean }) {
  const imageSrc: string | undefined = project.imageSrc;

  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={project.title}
        width={1672}
        height={941}
        sizes={expanded ? "94vw" : "(min-width: 1024px) 520px, 100vw"}
        draggable={false}
        className={cn(
          "relative z-20 block w-full select-none rounded-2xl border border-slate-100 bg-white object-contain shadow-xl transition duration-450",
          expanded ? "max-h-[calc(92vh-108px)]" : "group-hover/project:scale-[1.012] group-hover/project:contrast-[1.02] group-hover/project:saturate-[1.04]",
        )}
      />
    );
  }

  if (project.visual === "agent") return <AgentProjectVisual expanded={expanded} />;
  if (project.visual === "career") return <CareerCardProjectVisual expanded={expanded} />;

  return (
    <div
      className={cn(
        "relative z-20 w-full rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-xl shadow-slate-900/10",
        expanded ? "p-5 sm:p-7" : "p-4",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Groot-Arch Architecture Platform</p>
          <h4 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">架构协同数据底座</h4>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          文档驱动 → 模型驱动
        </span>
      </div>

      <div className={cn("mt-5 grid gap-4", expanded ? "lg:grid-cols-[1fr_0.76fr_1fr]" : "xl:grid-cols-[1fr_0.76fr_1fr]")}>
        <ArchitectureStack title="设计域：工具割裂" subtitle="需求 / 功能 / 系统 / 通信 / 诊断" items={ARCH_DESIGN_ITEMS} tone="design" />

        <div className="flex flex-col justify-center">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-4 py-5 text-center shadow-sm">
            <p className="text-xs font-bold text-amber-700">Groot-Arch 架构协同平台</p>
            <p className="mt-1 text-[10px] leading-relaxed text-amber-700/75">统一模型 / 数据源头 / 协同闭环</p>
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {ARCH_PIPELINE_ITEMS.map((item) => (
                <span key={item} className="rounded-lg bg-white px-2 py-1 text-[10px] font-medium text-slate-500 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="mx-auto h-10 w-px bg-gradient-to-b from-amber-200 to-emerald-200" />
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-3 text-center">
            <p className="text-[11px] font-semibold text-emerald-700">AI / RAG 可调用资产</p>
            <p className="mt-1 text-[10px] text-emerald-700/70">项目文档、架构模型、设计规范沉淀为结构化知识</p>
          </div>
        </div>

        <ArchitectureStack title="验证域：链路后置" subtitle="仿真 / 验收 / 系统 / 集成 / 部件" items={ARCH_VERIFY_ITEMS} tone="verify" />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div className="grid gap-2 text-center text-[10px] font-medium text-slate-500 sm:grid-cols-5">
          {["需求追溯", "架构建模", "服务设计", "仿真验证", "持续交付"].map((item, i) => (
            <div key={item} className="flex items-center justify-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-emerald-500" : "bg-slate-300")} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferenceProjects({ theme }: { theme: SiteTheme }) {
  const [activeProject, setActiveProject] = useState<ReferenceProject | null>(null);

  useEffect(() => {
    if (!activeProject) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveProject(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeProject]);

  return (
    <section id="section-projects" className="bg-white scroll-mt-14 px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-50">
      <div className="max-w-5xl mx-auto">
        <p className={cn("text-xs font-medium tracking-[0.15em] uppercase mb-2", theme.section.accent)}>代表项目与核心成果</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">代表项目与核心成果</h2>
        <p className="mt-3 text-sm text-slate-500 max-w-2xl">
          以下项目集中呈现我在复杂业务抽象、平台产品设计、企业级 AI Agent 落地与商业化转化方面的代表性实践。
        </p>

        {REFERENCE_PROJECTS.map((project) => (
          <MotionSection key={project.num} className="mt-12 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white overflow-hidden transition-colors hover:border-emerald-200">
            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 text-white", theme.section.accentSolid)}>
                    {project.num}
                  </span>
                  <span className={cn("text-[11px] font-medium uppercase tracking-wider", theme.section.accent)}>{project.eyebrow}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-2">{project.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-lg">{project.description}</p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {project.bullets.map((item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", theme.section.accentLight)} />
                      <span className="text-xs text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveProject(project)}
                className="group/project relative isolate flex min-h-[420px] cursor-zoom-in items-center justify-center overflow-hidden border-l border-slate-100 bg-[linear-gradient(145deg,#ffffff_0%,#f8fffc_100%)] p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-4"
                aria-label={`点击查看「${project.title}」大图`}
              >
                <span className="pointer-events-none absolute inset-2 z-10 rounded-[22px] bg-gradient-to-br from-emerald-200/35 via-transparent to-emerald-700/10 opacity-70 transition-opacity duration-300 group-hover/project:opacity-100" />
                <span className="pointer-events-none absolute inset-x-6 bottom-5 z-0 h-9 rounded-full bg-emerald-800/20 blur-2xl" />
                <span className="pointer-events-none absolute right-4 top-4 z-30 inline-flex translate-y-[-4px] items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-emerald-700 opacity-0 shadow-lg shadow-slate-900/5 backdrop-blur transition duration-250 group-hover/project:translate-y-0 group-hover/project:opacity-100 sm:opacity-0">
                  <Maximize2 className="h-3.5 w-3.5" />
                  点击查看项目大图
                </span>
                <div className="relative z-20 w-full transition duration-450 group-hover/project:scale-[1.012]">
                  <ReferenceProjectVisual project={project} />
                </div>
              </button>
            </div>
          </MotionSection>
        ))}
      </div>

      {activeProject && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-7"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-lightbox-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveProject(null);
          }}
        >
          <div className="flex max-h-[92vh] w-[min(94vw,1380px)] flex-col overflow-hidden rounded-[26px] border border-white/40 bg-white/95 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50/80 px-4 py-3 sm:px-5">
              <p id="project-lightbox-title" className="truncate text-sm font-bold text-slate-900">
                {activeProject.title}
              </p>
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-800 hover:bg-emerald-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                关闭
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,.08),transparent_36%)] p-3 sm:p-5">
              <ReferenceProjectVisual project={activeProject} expanded />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CoreProjects({
  data,
  theme,
}: {
  data: ResumeData;
  theme: SiteTheme;
}) {
  if (isReferenceDesignerProfile(data)) return <ReferenceProjects theme={theme} />;

  const modules = (data.architecture ?? []).filter((m) => !m.parentId);
  if (modules.length === 0) return null;

  function relatedHighlights(relatedIds: string[]): string[] {
    const items: string[] = [];
    for (const tid of relatedIds) {
      const node = data.timeline.find((t) => t.id === tid);
      if (node) {
        for (const h of node.highlights) {
          if (items.length >= 4) break;
          items.push(h);
        }
      }
      if (items.length >= 4) break;
    }
    return items;
  }

  function relatedSkills(relatedIds: string[]): string[] {
    const names = new Set<string>();
    for (const tid of relatedIds) {
      const node = data.timeline.find((t) => t.id === tid);
      if (node) node.skills.forEach((s) => names.add(s));
    }
    return [...names].slice(0, 7);
  }

  function moduleSubtitle(mod: (typeof modules)[0]): string {
    const industry = INDUSTRY_LABELS[mod.industry] ?? "";
    const type = TYPE_LABELS[mod.type] ?? "";
    if (industry && type) return `${industry} · ${type}`;
    return type || industry || "核心产品";
  }

  return (
    <section id="section-projects" className="bg-white scroll-mt-14 px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-50">
      <div className="max-w-5xl mx-auto">
        <p className={cn("text-xs font-medium tracking-[0.15em] uppercase mb-2", theme.section.accent)}>核心项目</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
          从 0 到 1 落地的产品体系
        </h2>
        <p className="mt-3 text-sm text-slate-500 max-w-2xl">
          覆盖{modules.map((m) => m.title).join("、")}等方向，承担从产品定位、架构设计到交付的完整职责。
        </p>

        {modules.map((mod, idx) => {
          const highlights = relatedHighlights(mod.relatedTimelineIds);
          const skills = relatedSkills(mod.relatedTimelineIds);
          const num = String(idx + 1).padStart(2, "0");
          const children = (mod.children ?? []).slice(0, 6);

          return (
            <MotionSection key={mod.id} className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
              <div className="grid lg:grid-cols-[1fr_360px]">
                {/* Left: content */}
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn("flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0", theme.section.accentSolid, "text-white")}>
                      {num}
                    </span>
                    <span className={cn("text-[11px] font-medium uppercase tracking-wider", theme.section.accent)}>
                      {moduleSubtitle(mod)}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-2">{mod.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-lg">{mod.description}</p>

                  {/* Bullet points from timeline highlights */}
                  {highlights.length > 0 && (
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {highlights.map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", theme.section.accentLight)} />
                          <span className="text-xs text-slate-600">{h}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {skills.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {skills.map((skill, i) => (
                        <span
                          key={skill}
                          className={cn(
                            "text-[11px] rounded-full px-2.5 py-1",
                            i === 0
                              ? cn(theme.section.accentBg, theme.section.accentText, "font-medium")
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: visual — sub-module breakdown */}
                <div className={cn(
                  "relative flex items-center justify-center p-4 border-l border-slate-100 overflow-hidden",
                  "bg-gradient-to-br",
                  theme.hero.glowA.replace(/\[0\.\d+\]/, "[0.06]"),
                  "via-transparent to-transparent",
                )}>
                  <div className="relative z-10 w-full max-w-[280px]">
                    <div className="text-center mb-6">
                      <span className={cn("text-5xl font-bold tracking-tight", theme.section.accentLight)}>{num}</span>
                      <p className={cn("mt-1 text-xs font-semibold", theme.section.accent)}>{moduleSubtitle(mod)}</p>
                    </div>

                    {children.length > 0 && (
                      <div className="space-y-2">
                        {children.map((child, ci) => (
                          <div
                            key={child.id}
                            className={cn(
                              "rounded-xl px-4 py-2.5 text-xs font-medium border transition-all",
                              ci === 0
                                ? cn(theme.section.accentBg, theme.section.accentBorder, theme.section.accentText)
                                : "bg-white/70 border-slate-100 text-slate-500",
                            )}
                          >
                            {child.title}
                          </div>
                        ))}
                      </div>
                    )}

                    {mod.relatedTimelineIds.length > 0 && (
                      <p className="mt-4 text-center text-[11px] text-slate-400">
                        {mod.relatedTimelineIds.length} 段经历与此项目关联
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </MotionSection>
          );
        })}
      </div>
    </section>
  );
}

// ─── v5 Capability Radar (Progress Bars) ───────────────────────

interface SkillBar {
  name: string;
  level: number;
  percent: number;
}

const BUSINESS_KEYWORDS = ["产品", "平台", "业务", "架构", "系统", "管理", "工具链", "AI", "数据", "研发", "团队"];

function skillPriority(skill: { name: string; level: number }): number {
  let score = skill.level * 10;
  for (const kw of BUSINESS_KEYWORDS) {
    if (skill.name.includes(kw)) score += 15;
  }
  return score;
}

function buildSkillBars(data: ResumeData): { top: SkillBar[]; overflow: SkillBar[] } {
  const skills = (data.skills ?? [])
    .filter((s) => s.category !== "root" && s.level > 0)
    .map((s) => ({
      name: s.name,
      level: s.level,
      percent: s.level === 5 ? 95 : s.level === 4 ? 85 : s.level === 3 ? 75 : s.level === 2 ? 55 : 35,
    }))
    .sort((a, b) => skillPriority(b) - skillPriority(a));

  const top = skills.slice(0, 6);
  const overflow = skills.slice(6);
  return { top, overflow };
}

function ProgressBar({ name, percent, theme, delay }: { name: string; percent: number; theme: SiteTheme; delay: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-600">{name}</span>
        <span className={cn("text-xs font-medium", theme.section.accent)}>
          {percent}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", theme.section.accentSolid)}
          initial={{ width: 0 }}
          whileInView={{ width: `${percent}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

const REFERENCE_SKILL_COLUMNS = [
  {
    title: "产品能力",
    bars: [
      { name: "平台产品架构", percent: 95 },
      { name: "复杂业务抽象", percent: 92 },
      { name: "工具链产品设计", percent: 90 },
      { name: "专家 Agent 协作", percent: 80 },
      { name: "团队管理（10人）", percent: 80 },
    ],
  },
  {
    title: "领域知识 & 商业能力",
    bars: [
      { name: "汽车电子电气架构", percent: 85 },
      { name: "通信协议（SOME/IP, DDS）", percent: 82 },
      { name: "ToB 商业闭环", percent: 82 },
      { name: "云平台基建", percent: 80 },
      { name: "诊断系统（DoIP, UDS）", percent: 80 },
    ],
  },
] as const;

function CapabilitySummary({
  data,
  primarySkills,
  theme,
}: {
  data: ResumeData;
  primarySkills: string[];
  theme: SiteTheme;
}) {
  const referenceMode = isReferenceDesignerProfile(data);
  const { top, overflow } = buildSkillBars(data);
  const hasBars = top.length > 0;

  return (
    <MotionSection id="capability-summary" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <p className={cn("text-xs font-medium tracking-[0.15em] uppercase mb-2", theme.section.accent)}>能力结构</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">从经历里沉淀出的工作方式</h2>
        <p className="mt-3 text-sm text-slate-500 max-w-lg">
          这些能力的评估基于实际交付的项目类型、独立承担的角色范围和在团队中的定位。
        </p>

        {referenceMode ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {REFERENCE_SKILL_COLUMNS.map((column, columnIndex) => (
              <div key={column.title} className={cn("rounded-2xl border p-6", theme.section.cardBorder, theme.skills.bg)}>
                <p className="text-sm font-semibold text-slate-800 mb-6">{column.title}</p>
                <div className="space-y-5">
                  {column.bars.map((bar, i) => (
                    <ProgressBar
                      key={bar.name}
                      name={bar.name}
                      percent={bar.percent}
                      theme={theme}
                      delay={(columnIndex * column.bars.length + i) * 0.08}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : hasBars ? (
          <>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              <div className={cn("rounded-2xl border p-6", theme.section.cardBorder, theme.skills.bg)}>
                <p className="text-sm font-semibold text-slate-800 mb-6">核心能力</p>
                <div className="space-y-5">
                  {top.filter((_, i) => i % 2 === 0).map((bar, i) => (
                    <ProgressBar key={bar.name} name={bar.name} percent={bar.percent} theme={theme} delay={i * 0.08} />
                  ))}
                </div>
              </div>
              <div className={cn("rounded-2xl border p-6", theme.section.cardBorder, theme.skills.bg)}>
                <p className="text-sm font-semibold text-slate-800 mb-6">核心能力</p>
                <div className="space-y-5">
                  {top.filter((_, i) => i % 2 === 1).map((bar, i) => (
                    <ProgressBar key={bar.name} name={bar.name} percent={bar.percent} theme={theme} delay={(top.length / 2 + i) * 0.08} />
                  ))}
                </div>
              </div>
            </div>

            {overflow.length > 0 && (
              <details className="mt-6 group">
                <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
                  展开更多技能（{overflow.length} 项）
                </summary>
                <div className="mt-4 grid gap-8 lg:grid-cols-2">
                  <div className={cn("rounded-2xl border p-6", theme.section.cardBorder, theme.skills.bg)}>
                    <div className="space-y-5">
                      {overflow.filter((_, i) => i % 2 === 0).map((bar, i) => (
                        <ProgressBar key={bar.name} name={bar.name} percent={bar.percent} theme={theme} delay={i * 0.06} />
                      ))}
                    </div>
                  </div>
                  {overflow.filter((_, i) => i % 2 === 1).length > 0 && (
                    <div className={cn("rounded-2xl border p-6", theme.section.cardBorder, theme.skills.bg)}>
                      <div className="space-y-5">
                        {overflow.filter((_, i) => i % 2 === 1).map((bar, i) => (
                          <ProgressBar key={bar.name} name={bar.name} percent={bar.percent} theme={theme} delay={(overflow.length / 2 + i) * 0.06} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )}
          </>
        ) : (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {primarySkills.map((skill) => (
              <span key={skill} className="text-[11px] rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{skill}</span>
            ))}
          </div>
        )}

        {data.education.length > 0 && (
          <div className={cn("mt-8 rounded-2xl border px-6 py-5 flex flex-wrap items-center gap-3", theme.section.cardBorder, theme.skills.bg)}>
            <GraduationCap className={cn("h-5 w-5 shrink-0", theme.section.accent)} />
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
  theme,
  referenceMode,
}: {
  data: ResumeData;
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  theme: SiteTheme;
  referenceMode: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
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
        "fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-transform",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
      style={{ transitionDuration: "350ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <span className="shrink-0 text-sm font-semibold text-slate-800">{overview.name}</span>
        <div className="hidden items-center gap-5 text-xs text-slate-500 sm:flex">
          {journey.slice(0, 4).map((item, idx) => (
            <a key={item.id} href={item.href} className={cn("transition-colors", theme.section.groupHoverAccent)}>
              {referenceMode
                ? ["实习", "经纬恒润", "国科础石·PM", "国科础石·负责人"][idx] ?? item.title
                : item.title.length > 8 ? item.title.slice(0, 8) + "…" : item.title}
            </a>
          ))}
          {(referenceMode || data.architecture.length > 0) && (
            <a href="#section-projects" className={cn("transition-colors", theme.section.groupHoverAccent)}>项目</a>
          )}
        </div>
        {data.profile.email && (
          <a
            href={`mailto:${data.profile.email}`}
            className={cn("shrink-0 text-xs rounded-full text-white px-3 py-1.5 font-medium transition-colors", theme.section.accentSolid, theme.section.accentSolidHover)}
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
  } = viewModel;

  const resolvedThemeId = siteThemeId || (data.siteThemeId as SiteThemeId) || "emerald-designer";
  const theme = getTheme(resolvedThemeId);
  const referenceMode = isReferenceDesignerProfile(data);

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
      <MiniNav data={data} overview={overview} journey={journey} theme={theme} referenceMode={referenceMode} />
      <DesignerHero data={data} overview={overview} journey={journey} primarySkills={primarySkills} theme={theme} />
      <GrowthRail items={journey} theme={theme} referenceMode={referenceMode} />

      <div id="experience-details">
        {details.map((detail, i) => (
          <ExperienceDetail key={detail.id} detail={detail} index={i} total={details.length} theme={theme} />
        ))}
      </div>

      <CoreProjects data={data} theme={theme} />

      <CapabilitySummary
        data={data}
        primarySkills={primarySkills}
        theme={theme}
      />

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

      {showFooter && (
        <footer className="border-t border-slate-100 bg-neutral-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            {data.profile.name} ·{" "}
            {data.profile.email && (
              <a href={`mailto:${data.profile.email}`} className={cn("transition-colors", theme.section.groupHoverAccent)}>
                {data.profile.email}
              </a>
            )}
            {data.profile.phone && <> · {data.profile.phone}</>}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            由{" "}
            <Link href="/" className={cn("font-semibold transition-colors", theme.section.accent, theme.section.groupHoverAccent)}>
              Career Card
            </Link>{" "}
            提供技术支持
          </p>
        </footer>
      )}
    </div>
  );
}
