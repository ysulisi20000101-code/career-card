"use client";

import { ArrowUpRight, CheckCircle2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import type { CareerSiteDraft, CareerSiteStylePreset } from "@/lib/agent/site-generator/types";
import { cn } from "@/lib/utils";

const presetLabels: Record<CareerSiteStylePreset, string> = {
  executive: "Executive",
  "product-led": "Product-led",
  "technical-builder": "Technical builder",
  minimal: "Minimal",
  creative: "Creative",
};

const presetClasses: Record<CareerSiteStylePreset, string> = {
  executive: "from-zinc-950 via-zinc-900 to-teal-950 text-white",
  "product-led": "from-slate-950 via-zinc-950 to-blue-950 text-white",
  "technical-builder": "from-zinc-950 via-slate-950 to-cyan-950 text-white",
  minimal: "from-white via-zinc-50 to-white text-zinc-950",
  creative: "from-zinc-950 via-stone-950 to-rose-950 text-white",
};

export function GeneratedSitePreview({ draft }: { draft: CareerSiteDraft }) {
  const dark = draft.style.preset !== "minimal";
  const proofSection = draft.sections.find((section) => section.id === "proof");
  const contactSection = draft.sections.find((section) => section.id === "contact");

  return (
    <article className="min-h-full bg-zinc-100 p-3 sm:p-5">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <section className={cn("relative px-5 py-7 sm:px-8 sm:py-10", presetClasses[draft.style.preset])}>
          <div className={cn("mb-8 flex flex-wrap items-center gap-2 text-xs", dark ? "text-white/70" : "text-zinc-500")}>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1", dark ? "border-white/12 bg-white/[0.08]" : "border-zinc-200 bg-white")}>
              <Sparkles className="h-3.5 w-3.5" />
              {draft.hero.eyebrow}
            </span>
            <span className={cn("rounded-full border px-3 py-1", dark ? "border-white/12 bg-white/[0.08]" : "border-zinc-200 bg-white")}>
              {presetLabels[draft.style.preset]}
            </span>
            <span className={cn("rounded-full border px-3 py-1", dark ? "border-white/12 bg-white/[0.08]" : "border-zinc-200 bg-white")}>
              {Math.round(draft.review.confidence * 100)}% ready
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className={cn("text-sm font-semibold", dark ? "text-cyan-200" : "text-blue-700")}>{draft.positioning.targetRole}</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">{draft.hero.title}</h1>
              <p className={cn("mt-5 max-w-2xl text-base leading-7", dark ? "text-white/72" : "text-zinc-600")}>{draft.hero.subtitle}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {draft.positioning.coreStrengths.slice(0, 6).map((strength) => (
                  <span
                    key={strength}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      dark ? "border-white/12 bg-white/[0.08] text-white/75" : "border-zinc-200 bg-white text-zinc-600",
                    )}
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </div>

            <div className={cn("rounded-lg border p-4", dark ? "border-white/12 bg-white/[0.08]" : "border-zinc-200 bg-white")}>
              <p className={cn("text-xs font-semibold uppercase tracking-wide", dark ? "text-white/45" : "text-zinc-400")}>Narrative</p>
              <h2 className="mt-2 text-xl font-semibold">{draft.narrative.theme}</h2>
              <p className={cn("mt-3 text-sm leading-6", dark ? "text-white/65" : "text-zinc-600")}>{draft.narrative.storyArc}</p>
            </div>
          </div>
        </section>

        <section className="grid border-b border-zinc-200 bg-white md:grid-cols-3">
          {(proofSection?.bullets ?? draft.narrative.proofPoints).slice(0, 3).map((proof, index) => (
            <div key={`${proof}-${index}`} className="border-b border-zinc-100 p-5 md:border-b-0 md:border-r last:md:border-r-0">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-sm leading-6 text-zinc-700">{proof}</p>
            </div>
          ))}
        </section>

        <section className="px-5 py-7 sm:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Selected experience</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">Career moments the site will lead with</h2>
            </div>
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500">
              {draft.experienceBlocks.length} generated blocks
            </span>
          </div>

          <div className="space-y-4">
            {draft.experienceBlocks.map((block) => (
              <section key={block.id} className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-950">{block.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {block.organization} · {block.period}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{block.summary}</p>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-zinc-700">
                  {block.bullets.slice(0, 3).map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>

        <section className="grid gap-4 border-t border-zinc-200 bg-zinc-50 px-5 py-6 sm:px-8 md:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Style direction</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">{presetLabels[draft.style.preset]}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {draft.style.tone}. {draft.style.layoutStyle}. {draft.style.colorTheme}.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Publish guard
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {draft.review.publishBlockers.length > 0
                ? `${draft.review.publishBlockers.length} blocker needs review before publishing.`
                : "No publish blockers detected in the generated draft."}
            </p>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-5 sm:px-8">
          <div>
            <p className="text-sm font-semibold text-zinc-950">{contactSection?.title ?? "Contact"}</p>
            <p className="mt-1 text-xs text-zinc-500">{contactSection?.body}</p>
          </div>
          {contactSection?.bullets[0] && (
            <a href={`mailto:${contactSection.bullets[0]}`} className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white">
              <Mail className="h-4 w-4" />
              Contact
            </a>
          )}
        </footer>
      </div>
    </article>
  );
}
