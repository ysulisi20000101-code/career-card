"use client";

import { ArrowRight, BriefcaseBusiness, CheckCircle2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import type { CareerSiteDraft, CareerSiteStylePreset } from "@/lib/agent/site-generator/types";
import { cn } from "@/lib/utils";

const presetLabels: Record<CareerSiteStylePreset, string> = {
  executive: "高管档案",
  "product-led": "产品叙事",
  "technical-builder": "技术建设者",
  minimal: "极简作品集",
  creative: "故事型作品集",
};

const heroClasses: Record<CareerSiteStylePreset, string> = {
  executive: "bg-[#12110f] text-white",
  "product-led": "bg-[#0f172a] text-white",
  "technical-builder": "bg-[#101418] text-white",
  minimal: "bg-white text-zinc-950",
  creative: "bg-[#1b1517] text-white",
};

const accentClasses: Record<CareerSiteStylePreset, string> = {
  executive: "text-teal-300",
  "product-led": "text-sky-300",
  "technical-builder": "text-cyan-300",
  minimal: "text-zinc-600",
  creative: "text-rose-300",
};

function isDark(preset: CareerSiteStylePreset) {
  return preset !== "minimal";
}

function readyText(draft: CareerSiteDraft) {
  if (draft.review.publishBlockers.length > 0) return `${draft.review.publishBlockers.length} 项阻断`;
  if (draft.review.missingFacts.length > 0) return `${draft.review.missingFacts.length} 项待确认`;
  return "可继续精修";
}

export function GeneratedSitePreview({ draft }: { draft: CareerSiteDraft }) {
  const dark = isDark(draft.style.preset);
  const proofSection = draft.sections.find((section) => section.id === "proof");
  const storySection = draft.sections.find((section) => section.id === "story");
  const skillSection = draft.sections.find((section) => section.id === "skills");
  const contactSection = draft.sections.find((section) => section.id === "contact");
  const proofItems = (proofSection?.bullets.length ? proofSection.bullets : draft.narrative.proofPoints).slice(0, 3);

  return (
    <article className="min-h-full bg-[#f4f2ed] text-zinc-950">
      <section className={cn("px-5 py-8 sm:px-8 lg:px-10 lg:py-12", heroClasses[draft.style.preset])}>
        <div className="mx-auto max-w-6xl">
          <div className={cn("mb-10 flex flex-wrap items-center gap-2 text-xs", dark ? "text-white/65" : "text-zinc-500")}>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1", dark ? "border-white/12 bg-white/[0.08]" : "border-zinc-200 bg-zinc-50")}>
              <Sparkles className="h-3.5 w-3.5" />
              {draft.hero.eyebrow}
            </span>
            <span className={cn("rounded-full border px-3 py-1", dark ? "border-white/12 bg-white/[0.08]" : "border-zinc-200 bg-zinc-50")}>
              {presetLabels[draft.style.preset]}
            </span>
            <span className={cn("rounded-full border px-3 py-1", dark ? "border-white/12 bg-white/[0.08]" : "border-zinc-200 bg-zinc-50")}>
              {readyText(draft)}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:items-end">
            <div>
              <p className={cn("text-sm font-semibold", accentClasses[draft.style.preset])}>{draft.positioning.targetRole}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-normal sm:text-6xl">
                {draft.hero.title}
              </h1>
              <p className={cn("mt-6 max-w-3xl text-lg leading-8", dark ? "text-white/72" : "text-zinc-600")}>
                {draft.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {draft.positioning.coreStrengths.slice(0, 7).map((strength) => (
                  <span
                    key={strength}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      dark ? "border-white/12 bg-white/[0.08] text-white/76" : "border-zinc-200 bg-zinc-50 text-zinc-600",
                    )}
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </div>

            <aside className={cn("border-l pl-5", dark ? "border-white/12" : "border-zinc-200")}>
              <p className={cn("text-xs font-semibold uppercase tracking-wide", dark ? "text-white/42" : "text-zinc-400")}>
                Storyline
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">{draft.narrative.theme}</h2>
              <p className={cn("mt-4 text-sm leading-7", dark ? "text-white/65" : "text-zinc-600")}>
                {draft.narrative.storyArc}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white px-5 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
          {proofItems.map((proof, index) => (
            <div key={`${proof}-${index}`} className="border-l border-zinc-200 pl-4">
              <CheckCircle2 className="mb-3 h-4 w-4 text-emerald-600" />
              <p className="text-sm leading-6 text-zinc-700">{proof}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-9 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Narrative logic</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
                {storySection?.title ?? "把履历变成可阅读的职业故事"}
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600">
                {storySection?.body ?? draft.positioning.oneLinePitch}
              </p>
              {draft.review.missingFacts.length > 0 && (
                <div className="mt-5 border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  发布前建议补充：{draft.review.missingFacts.slice(0, 3).join("、")}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {draft.experienceBlocks.map((block, index) => (
                <section key={block.id} className="border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-400">0{index + 1} · {block.period}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-normal text-zinc-950">{block.title}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{block.organization}</p>
                    </div>
                    <BriefcaseBusiness className="h-5 w-5 text-zinc-400" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-zinc-600">{block.summary}</p>
                  <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-700">
                    {block.bullets.slice(0, 4).map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-950 px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_1fr] md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Capability map</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">{skillSection?.title ?? "能力地图"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {skillSection?.body ?? "技能区围绕目标岗位组织，让访客看到可迁移能力。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(skillSection?.bullets ?? draft.positioning.coreStrengths).slice(0, 12).map((skill) => (
              <span key={skill} className="border border-white/12 bg-white/[0.08] px-3 py-1.5 text-xs text-white/75">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[1fr_360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Style direction</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">{presetLabels[draft.style.preset]}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
              {draft.style.tone}。{draft.style.layoutStyle}。色彩方向：{draft.style.colorTheme}。
            </p>
          </div>
          <div className="border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              发布检查
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              {draft.review.publishBlockers.length > 0
                ? `仍有 ${draft.review.publishBlockers.length} 个阻断项，需要先补齐事实。`
                : "没有发现发布阻断项，可以继续通过对话精修叙事和风格。"}
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-zinc-950">{contactSection?.title ?? "让合适的人能联系到你"}</p>
            <p className="mt-1 text-sm text-zinc-500">{contactSection?.body}</p>
          </div>
          {contactSection?.bullets[0] && (
            <a href={`mailto:${contactSection.bullets[0]}`} className="inline-flex items-center gap-2 bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
              <Mail className="h-4 w-4" />
              联系我
            </a>
          )}
        </div>
      </footer>
    </article>
  );
}
