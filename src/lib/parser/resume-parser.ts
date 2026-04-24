import type {
  ResumeData,
  TimelineNode,
  Education,
  SkillNode,
  ArchitectureModule,
  ParseStats,
  ParseConfidence,
} from "@/types";
import { generateId } from "@/lib/utils";
import { createDefaultRoleUnderstanding } from "@/lib/role-understanding/default";

/**
 * Lightweight rule-based resume parser.
 *
 * This is intentionally not "perfect" — it's a deterministic baseline that
 * produces *real, file-derived* ResumeData from extracted text, so the
 * upload step is no longer a fixed mock. Every field that cannot be detected
 * is left empty / default rather than fabricated.
 */

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(?:\+?86[-\s]?)?1[3-9]\d{9}|\d{3,4}[-\s]?\d{7,8}/;
const URL_RE = /https?:\/\/[^\s,，;；]+/;

const SECTION_HEADERS: Record<keyof Sections, string[]> = {
  profile: ["个人信息", "基本信息", "profile", "personal"],
  summary: ["个人简介", "自我评价", "summary", "about"],
  work: ["工作经历", "工作经验", "实习经历", "experience", "work experience"],
  project: ["项目经历", "项目经验", "projects"],
  education: ["教育背景", "教育经历", "education"],
  skills: ["技能", "专业技能", "技术栈", "skills", "技能特长"],
};

interface Sections {
  profile: string[];
  summary: string[];
  work: string[];
  project: string[];
  education: string[];
  skills: string[];
}

function emptySections(): Sections {
  return {
    profile: [],
    summary: [],
    work: [],
    project: [],
    education: [],
    skills: [],
  };
}

type SectionKey = keyof Sections;

function detectHeader(line: string): SectionKey | null {
  const normalized = line.replace(/[\s:：·•—\-]/g, "").toLowerCase();
  if (!normalized) return null;
  for (const [key, hints] of Object.entries(SECTION_HEADERS) as [
    SectionKey,
    string[],
  ][]) {
    for (const hint of hints) {
      const h = hint.replace(/\s+/g, "").toLowerCase();
      // Treat short header-only lines (<=12 chars) as section markers.
      if (normalized === h || (normalized.includes(h) && normalized.length <= 12)) {
        return key;
      }
    }
  }
  return null;
}

function splitToSections(text: string): Sections {
  const sections = emptySections();
  const lines = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let current: SectionKey | "head" = "head";
  const head: string[] = [];

  for (const line of lines) {
    const header = detectHeader(line);
    if (header) {
      current = header;
      continue;
    }
    if (current === "head") {
      head.push(line);
    } else {
      sections[current].push(line);
    }
  }

  // Treat the head block as profile context (often top of resume).
  sections.profile = head.concat(sections.profile);
  return sections;
}

function pickName(lines: string[]): string {
  for (const line of lines.slice(0, 10)) {
    const cleaned = line.replace(/[|｜]/g, " ").trim();
    // Chinese names are typically 2–4 chars; English names 2–3 tokens.
    if (/^[\u4e00-\u9fa5]{2,4}$/.test(cleaned)) return cleaned;
    const m = cleaned.match(/^姓\s*名[:：]?\s*(.+)$/);
    if (m) return m[1].trim();
  }
  for (const line of lines.slice(0, 5)) {
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length > 0 && tokens[0].length <= 16) return tokens[0];
  }
  return "";
}

function pickFirst(re: RegExp, lines: string[]): string {
  for (const line of lines) {
    const m = line.match(re);
    if (m) return m[0];
  }
  return "";
}

const DATE_RANGE_RE =
  /((?:19|20)\d{2})[\s./年-]+(\d{1,2})?[\s./月-]*\s*[-~–至到]\s*((?:19|20)\d{2}|至今|present|now)?[\s./年-]*(\d{1,2})?/i;

function normalizeMonth(year: string, month?: string): string {
  if (!year) return "";
  const m = month ? String(parseInt(month, 10)).padStart(2, "0") : "01";
  return `${year}-${m}`;
}

function extractDateRange(line: string): { startDate: string; endDate: string } | null {
  const m = line.match(DATE_RANGE_RE);
  if (!m) return null;
  const [, sy, sm, eyRaw, em] = m;
  const startDate = normalizeMonth(sy, sm);
  let endDate = "";
  if (!eyRaw || /至今|present|now/i.test(eyRaw)) {
    endDate = "至今";
  } else {
    endDate = normalizeMonth(eyRaw, em);
  }
  return { startDate, endDate };
}

function buildTimeline(workLines: string[]): TimelineNode[] {
  if (workLines.length === 0) return [];

  // Group lines into "blocks" separated by lines that look like a date range.
  type Block = { headerLine: string; lines: string[] };
  const blocks: Block[] = [];
  let cur: Block | null = null;

  for (const line of workLines) {
    if (extractDateRange(line)) {
      if (cur) blocks.push(cur);
      cur = { headerLine: line, lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else {
      cur = { headerLine: line, lines: [] };
    }
  }
  if (cur) blocks.push(cur);

  return blocks.map((block, idx) => {
    const range = extractDateRange(block.headerLine) ?? {
      startDate: "",
      endDate: "",
    };

    // Try to extract company/position from the header line by removing the date.
    const cleanedHeader = block.headerLine
      .replace(DATE_RANGE_RE, "")
      .replace(/[|｜·,，]/g, " ")
      .trim();

    const tokens = cleanedHeader.split(/\s{2,}|\s\|\s/).filter(Boolean);
    const company = tokens[0] ?? "未识别公司";
    const position = tokens[1] ?? "";

    const description = block.lines.slice(0, 3).join(" ").slice(0, 240);
    const highlights = block.lines
      .filter((l) => /^[-•·●▪◆]/.test(l) || l.length < 80)
      .slice(0, 4)
      .map((l) => l.replace(/^[-•·●▪◆]\s*/, ""));

    const skills = Array.from(
      new Set(
        block.lines
          .flatMap((l) => l.split(/[，,/、|]/))
          .map((s) => s.trim())
          .filter((s) => s.length >= 2 && s.length <= 16 && !/^\d/.test(s)),
      ),
    ).slice(0, 6);

    const node: TimelineNode = {
      id: generateId(),
      company,
      position,
      startDate: range.startDate,
      endDate: range.endDate || "至今",
      description: description || cleanedHeader,
      highlights,
      projects: [],
      skills,
      order: idx,
    };
    return node;
  });
}

function buildEducation(eduLines: string[]): Education[] {
  if (eduLines.length === 0) return [];
  type Block = { headerLine: string; lines: string[] };
  const blocks: Block[] = [];
  let cur: Block | null = null;
  for (const line of eduLines) {
    if (extractDateRange(line)) {
      if (cur) blocks.push(cur);
      cur = { headerLine: line, lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    } else {
      cur = { headerLine: line, lines: [] };
    }
  }
  if (cur) blocks.push(cur);

  return blocks.map((block) => {
    const range = extractDateRange(block.headerLine) ?? {
      startDate: "",
      endDate: "",
    };
    const cleanedHeader = block.headerLine
      .replace(DATE_RANGE_RE, "")
      .replace(/[|｜·,，]/g, " ")
      .trim();
    const tokens = cleanedHeader.split(/\s{2,}|\s\|\s/).filter(Boolean);
    return {
      id: generateId(),
      school: tokens[0] ?? cleanedHeader.slice(0, 30),
      degree: tokens[1] ?? "",
      major: tokens[2] ?? block.lines[0]?.slice(0, 24) ?? "",
      startDate: range.startDate,
      endDate: range.endDate,
    };
  });
}

function buildSkills(skillLines: string[]): SkillNode[] {
  const tokens = Array.from(
    new Set(
      skillLines
        .flatMap((l) => l.split(/[，,/、|;；]/))
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 24),
    ),
  ).slice(0, 24);

  if (tokens.length === 0) return [];

  const rootId = "skill-root";
  const skills: SkillNode[] = [
    { id: rootId, name: "技能体系", category: "root", level: 5, parentId: null },
  ];

  tokens.forEach((name) => {
    skills.push({
      id: generateId(),
      name,
      category: "技能",
      level: 4,
      parentId: rootId,
    });
  });

  return skills;
}

function buildArchitectureFromTimeline(
  timeline: TimelineNode[],
): ArchitectureModule[] {
  if (timeline.length === 0) return [];
  const root: ArchitectureModule = {
    id: "arch-root",
    title: "经历架构",
    description: "基于工作经历自动生成",
    type: "business",
    industry: "internet",
    position: { x: 350, y: 0 },
    parentId: null,
    relatedTimelineIds: timeline.map((t) => t.id),
  };
  const children: ArchitectureModule[] = timeline.map((t, i) => ({
    id: generateId(),
    title: t.company,
    description: t.position || t.description.slice(0, 60),
    type: "business",
    industry: "internet",
    position: { x: i * 240, y: 200 },
    parentId: root.id,
    relatedTimelineIds: [t.id],
  }));
  return [root, ...children];
}

export interface ParseResult {
  data: ResumeData;
  stats: ParseStats;
  confidence: ParseConfidence;
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(1, numerator / denominator));
}

function buildParseConfidence(data: ResumeData, stats: ParseStats): ParseConfidence {
  const profileFilled = [
    data.profile.name,
    data.profile.email,
    data.profile.title ?? "",
    data.profile.summary ?? "",
  ].filter((value) => value.trim().length > 0).length;
  const profile = ratio(profileFilled, 4);

  const timelineDetailed = data.timeline.filter(
    (node) => node.company.trim() && node.position.trim() && node.description.trim(),
  ).length;
  const timeline = data.timeline.length === 0 ? 0 : ratio(timelineDetailed, data.timeline.length);

  const educationDetailed = data.education.filter(
    (edu) => edu.school.trim() && edu.degree.trim(),
  ).length;
  const education =
    data.education.length === 0 ? 0 : ratio(educationDetailed, data.education.length);

  const nonRootSkills = data.skills.filter((s) => s.parentId !== null).length;
  const skills = nonRootSkills === 0 ? 0 : Math.min(1, nonRootSkills / 8);

  const overall = 0.35 * profile + 0.35 * timeline + 0.15 * education + 0.15 * skills;
  const needsConfirmation: string[] = [];
  if (profile < 0.7) needsConfirmation.push("个人信息不完整");
  if (timeline < 0.75 || stats.detectedTimelineCount === 0) needsConfirmation.push("工作经历需重点核对");
  if (education < 0.6 && stats.detectedEducationCount > 0) needsConfirmation.push("教育信息建议补全");
  if (skills < 0.5) needsConfirmation.push("技能信息偏少");

  return {
    profile: Math.round(profile * 100),
    timeline: Math.round(timeline * 100),
    education: Math.round(education * 100),
    skills: Math.round(skills * 100),
    overall: Math.round(overall * 100),
    needsConfirmation,
  };
}

export function parseResumeText(rawText: string, fileName: string): ParseResult {
  const text = rawText.replace(/\u00a0/g, " ").trim();
  const sections = splitToSections(text);

  const profileLines = sections.profile;
  const name =
    pickName(profileLines) ||
    fileName.replace(/\.pdf$/i, "").slice(0, 16) ||
    "未命名";
  const email = pickFirst(EMAIL_RE, [text]);
  const phone = pickFirst(PHONE_RE, [text]);
  const website = pickFirst(URL_RE, [text]);

  const timeline = buildTimeline(sections.work);
  const education = buildEducation(sections.education);
  const skills = buildSkills(sections.skills);
  const architecture = buildArchitectureFromTimeline(timeline);

  const summaryText = sections.summary.join(" ").slice(0, 280);

  const data: ResumeData = {
    profile: {
      id: generateId(),
      name,
      email,
      phone: phone || undefined,
      title: timeline[0]?.position || "",
      summary: summaryText,
      website: website || undefined,
      location: undefined,
    },
    timeline,
    skills,
    architecture,
    education,
    roleUnderstanding: createDefaultRoleUnderstanding(timeline[0]?.position || ""),
  };

  const stats: ParseStats = {
    textLength: text.length,
    detectedTimelineCount: timeline.length,
    detectedEducationCount: education.length,
    detectedSkillCount: skills.length,
  };

  return {
    data,
    stats,
    confidence: buildParseConfidence(data, stats),
  };
}
