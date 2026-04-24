"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { mockResumeData } from "@/lib/mock-data";
import { formatDate, calculateDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import SkillMapView from "@/components/skillmap/skill-map-view";
import ArchitectureView from "@/components/architecture/architecture-view";

type SectionId = "timeline" | "skills" | "architecture";

const sections: { id: SectionId; label: string }[] = [
  { id: "timeline", label: "职业经历" },
  { id: "skills", label: "技能图谱" },
  { id: "architecture", label: "架构视图" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function PublicProfilePage() {
  const [activeSection, setActiveSection] = useState<SectionId>("timeline");

  const data = mockResumeData;
  const { profile, timeline, education } = data;
  const activeTimelineId = useMemo(() => timeline[0]?.id ?? null, [timeline]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-3xl font-bold text-white shadow-lg sm:mb-0 sm:mr-6">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {profile.name}
              </h1>
              <p className="mt-1 text-lg text-zinc-500">
                {profile.title}
              </p>
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

      <nav className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl gap-1 px-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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

      <main className="mx-auto max-w-4xl px-6 py-10">
        {activeSection === "timeline" && (
          <div className="space-y-10">
            <section>
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-5 w-5 text-indigo-600" />
                工作经历
              </h2>
              <div className="space-y-1">
                {timeline.map((node, i) => (
                  <motion.div
                    key={node.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-base font-semibold">
                              {node.company}
                            </h3>
                            <p className="text-sm text-zinc-500">
                              {node.position}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(node.startDate)} –{" "}
                            {formatDate(node.endDate)}
                            <Badge
                              variant="secondary"
                              className="ml-2 text-[10px]"
                            >
                              {calculateDuration(node.startDate, node.endDate)}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                          {node.description}
                        </p>
                        {node.highlights.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {node.highlights.map((h, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-2 text-sm text-zinc-600"
                              >
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-600" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                        {node.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {node.skills.map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="text-xs"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
                教育背景
              </h2>
              <div className="space-y-3">
                {education.map((edu, i) => (
                  <motion.div
                    key={edu.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                  >
                    <Card>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{edu.school}</p>
                          <p className="text-sm text-zinc-500">
                            {edu.degree} · {edu.major}
                          </p>
                        </div>
                        <div className="text-xs text-zinc-500">
                          {formatDate(edu.startDate)} –{" "}
                          {formatDate(edu.endDate)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeSection === "skills" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
            style={{ minHeight: 500 }}
          >
            <SkillMapView data={data} activeTimelineId={activeTimelineId} />
          </motion.div>
        )}

        {activeSection === "architecture" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border bg-white p-4 shadow-sm"
            style={{ minHeight: 500 }}
          >
            <ArchitectureView data={data} activeTimelineId={activeTimelineId} />
          </motion.div>
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
