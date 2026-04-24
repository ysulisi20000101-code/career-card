"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Globe,
  Calendar,
  Building2,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { formatDate, calculateDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import SkillMapView from "@/components/skillmap/skill-map-view";
import ArchitectureView from "@/components/architecture/architecture-view";
import { loadPublishedResume } from "@/lib/share/storage";
import { resolveSharedResume } from "@/lib/share/strategy";
import { getOrderedTimeline } from "@/lib/timeline/order";
import type { ResumeData } from "@/types";

type SectionId = "timeline" | "skills" | "architecture";

const sections: { id: SectionId; label: string }[] = [
  { id: "timeline", label: "职业经历" },
  { id: "skills", label: "技能图谱" },
  { id: "architecture", label: "架构视图" },
];

export function ShareView() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [activeSection, setActiveSection] = useState<SectionId>("timeline");
  const [hydration, setHydration] = useState<{
    hydrated: boolean;
    data: ResumeData | null;
  }>({ hydrated: false, data: null });

  useEffect(() => {
    // Try hash payload first (cross-device share), then local storage fallback.
    const resolvedData = resolveSharedResume({
      hash: window.location.hash,
      slug,
      loadFromStorage: loadPublishedResume,
    });
    // Client-only hydration from window/localStorage is inherently a
    // one-shot bridge between the external world and React state, so the
    // set-state-in-effect warning does not apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydration({ hydrated: true, data: resolvedData });
  }, [slug]);

  const { hydrated, data } = hydration;

  const orderedTimeline = useMemo(
    () => getOrderedTimeline(data?.timeline ?? []),
    [data],
  );
  const activeTimelineId = useMemo(
    () => orderedTimeline[0]?.id ?? null,
    [orderedTimeline],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        加载中…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-5xl">🗂️</div>
        <h1 className="text-xl font-semibold">未找到该名片</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          链接可能未发布或已失效。请确认你访问的是发布者本人设备生成的链接，
          或使用包含 #d=… 数据片段的完整链接进行扫码访问。
        </p>
      </div>
    );
  }

  const { profile, education } = data;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100/50 via-violet-100/30 to-transparent blur-3xl" />
      </div>
      <header className="relative z-10 border-b border-zinc-100 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left"
          >
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white shadow-lg shadow-indigo-500/30">
                {profile.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
              <p className="mt-1 text-lg text-zinc-500">{profile.title}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500 sm:justify-start">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    个人网站
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              {profile.summary && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
                  {profile.summary}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl gap-1 px-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`relative -mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        {activeSection === "timeline" && (
          <div className="space-y-10">
            <section>
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-900">
                <Building2 className="h-5 w-5 text-indigo-500" />
                工作经历
              </h2>
              <div className="space-y-3">
                {orderedTimeline.map((node) => (
                  <article
                    key={node.id}
                    className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-200/40 transition-all hover:shadow-md hover:shadow-indigo-200/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20">
                        {(node.company || "?").slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-semibold text-zinc-900">
                              {node.company}
                            </h3>
                            <p className="text-sm text-zinc-500">{node.position}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(node.startDate)} – {formatDate(node.endDate)}
                            </span>
                            <Badge
                              variant="secondary"
                              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-medium text-zinc-600"
                            >
                              {calculateDuration(node.startDate, node.endDate)}
                            </Badge>
                          </div>
                        </div>
                        {node.description && (
                          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                            {node.description}
                          </p>
                        )}
                        {node.highlights.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {node.highlights.map((h, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-[13px] text-zinc-600"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                        {node.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {node.skills.map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {education.length > 0 && (
              <section>
                <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  <GraduationCap className="h-5 w-5 text-indigo-500" />
                  教育背景
                </h2>
                <div className="space-y-3">
                  {education.map((edu) => (
                    <div
                      key={edu.id}
                      className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 text-sm shadow-sm shadow-zinc-200/40"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">{edu.school}</p>
                        <p className="text-zinc-500">
                          {edu.degree} · {edu.major}
                        </p>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeSection === "skills" && (
          <div
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm shadow-zinc-200/40"
            style={{ minHeight: 500 }}
          >
            <SkillMapView data={data} activeTimelineId={activeTimelineId} />
          </div>
        )}

        {activeSection === "architecture" && (
          <div
            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm shadow-zinc-200/40"
            style={{ minHeight: 500 }}
          >
            <ArchitectureView data={data} activeTimelineId={activeTimelineId} />
          </div>
        )}
      </main>

      <footer className="border-t py-8 text-center text-xs text-zinc-400">
        Powered by{" "}
        <Link href="/" className="text-indigo-600 hover:underline">
          职场名片
        </Link>{" "}
        · 让每一份简历都值得被看见
      </footer>
    </div>
  );
}
