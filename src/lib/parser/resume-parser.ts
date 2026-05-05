import type {
  ArchitectureModule,
  Education,
  ParseConfidence,
  ParseStats,
  PromotionStage,
  ResumeData,
  TimelineNode,
} from "@/types";
import { generateId } from "@/lib/utils";
import { createDefaultRoleUnderstanding } from "@/lib/role-understanding/default";
import { buildSkillNodesFromProfile, buildSkillProfile } from "@/lib/skills/profile";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(?:\+?86[-\s]?)?1[3-9](?:[-\s]?\d){9}|\d{3,4}[-\s]?\d{7,8}/;
const URL_RE = /https?:\/\/[^\s,，。)）]+/;
const DATE_RANGE_RE =
  /((?:19|20)\d{2})\s*(?:[./年]\s*)?(\d{1,2})?\s*(?:月)?\s*(?:[-—–~至到－]+\s*)(((?:19|20)\d{2})\s*(?:[./年]\s*)?(\d{1,2})?\s*(?:月)?|至今|现在|present|now)?/i;

interface Sections {
  profile: string[];
  summary: string[];
  work: string[];
  project: string[];
  education: string[];
  skills: string[];
}

export interface ParseResult {
  data: ResumeData;
  stats: ParseStats;
  confidence: ParseConfidence;
}

const SECTION_HEADERS: Record<keyof Sections, string[]> = {
  profile: ["个人信息", "基本信息", "联系方式", "求职意向", "profile", "personal"],
  summary: ["个人简介", "个人优势", "自我评价", "自我介绍", "summary", "about"],
  work: ["工作经历", "工作经验", "任职经历", "实习经历", "实习经验", "experience", "work experience"],
  project: ["核心项目经历", "项目经历", "项目经验", "项目实践", "产品项目", "projects"],
  education: ["教育背景", "教育经历", "教育信息", "education"],
  skills: ["技能证书", "技能", "专业技能", "职业技能", "产品技能", "工具技能", "skills"],
};

function emptySections(): Sections {
  return { profile: [], summary: [], work: [], project: [], education: [], skills: [] };
}

function repairChineseSpacing(value: string): string {
  let text = value;
  for (let i = 0; i < 4; i += 1) {
    text = text.replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2");
  }
  return text
    .replace(/\s+([，。；：、！？）】])/g, "$1")
    .replace(/([（【])\s+/g, "$1")
    .replace(/\s*([｜|])\s*/g, "$1")
    .replace(/[“”]\s*[“”]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * PDF text extraction often produces very few line breaks.
 * Insert newlines before section headers and experience boundaries.
 */
function reflowSections(text: string): string {
  const headers = [
    "\u6838\u5fc3\u9879\u76ee\u7ecf\u5386", "\u9879\u76ee\u7ecf\u5386", "\u9879\u76ee\u7ecf\u9a8c", "\u9879\u76ee\u5b9e\u8df5", "\u4ea7\u54c1\u9879\u76ee",
    "\u5de5\u4f5c\u7ecf\u5386", "\u5de5\u4f5c\u7ecf\u9a8c", "\u4efb\u804c\u7ecf\u5386",
    "\u5b9e\u4e60\u7ecf\u5386", "\u5b9e\u4e60\u7ecf\u9a8c",
    "\u6559\u80b2\u80cc\u666f", "\u6559\u80b2\u7ecf\u5386", "\u6559\u80b2\u4fe1\u606f",
    "\u4e2a\u4eba\u7b80\u4ecb", "\u4e2a\u4eba\u4f18\u52bf", "\u81ea\u6211\u8bc4\u4ef7", "\u81ea\u6211\u4ecb\u7ecd",
    "\u6280\u80fd\u8bc1\u4e66", "\u4e13\u4e1a\u6280\u80fd", "\u804c\u4e1a\u6280\u80fd", "\u4ea7\u54c1\u6280\u80fd", "\u5de5\u5177\u6280\u80fd",
    "\u4e2a\u4eba\u4fe1\u606f", "\u57fa\u672c\u4fe1\u606f", "\u8054\u7cfb\u65b9\u5f0f", "\u6c42\u804c\u610f\u5411",
  ];
  let result = text;
  for (const h of headers) {
    const escaped = h.replace(/[.*+?${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("([^\\n])(" + escaped + ")\\s*", "g");
    result = result.replace(re, "$1\n$2\n");
  }
  // Break at experience boundaries: Chinese company\uff5crole followed by YYYY.MM\u2014
  result = result.replace(
    /([\u4e00-\u9fff\w]{2,}[\uff5c|][^\n]{2,80}?)(\d{4}\.\d{2}\s*[\u2014\-\u81f3]\s*(?:\u81f3\u4eca|\d{4}))/g,
    "\n$1$2"
  );
  return result;
}

function cleanText(rawText: string): string {
  return reflowSections(rawText
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n"))
    .split(/\n+/)
    .map(repairChineseSpacing)
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeHeader(line: string): string {
  return line.replace(/[\s:：\-—–]/g, "").toLowerCase();
}

function detectHeader(line: string): keyof Sections | null {
  const normalized = normalizeHeader(line);
  for (const [key, hints] of Object.entries(SECTION_HEADERS) as [keyof Sections, string[]][]) {
    if (hints.some((hint) => { const nHint = normalizeHeader(hint); return normalized === nHint || normalized.startsWith(nHint); })) return key;
  }
  return null;
}

function splitToSections(lines: string[]): Sections {
  const sections = emptySections();
  let current: keyof Sections | "head" = "head";
  const head: string[] = [];

  for (const line of lines) {
    const header = detectHeader(line);
    if (header) {
      current = header;
      continue;
    }
    if (current === "head") head.push(line);
    else sections[current].push(line);
  }

  sections.profile = [...head, ...sections.profile];
  return sections;
}

function pickName(lines: string[], fileName: string): string {
  for (const line of lines.slice(0, 15)) {
    const cleaned = line.replace(/[|｜]/g, " ").trim();
    if (/^[\u4e00-\u9fa5]{2,4}$/.test(cleaned)) return cleaned;
    const leading = cleaned.match(/^([\u4e00-\u9fa5]{2,4})(?:\s|$)/);
    if (leading && cleaned.length <= 24 && !EMAIL_RE.test(cleaned) && !PHONE_RE.test(cleaned)) {
      return leading[1];
    }
    // Name glued to following token by repairChineseSpacing (e.g. "\u674e\u9526\u6d9b\u90ae\u7bb1\uff1a")
    const delimiterName = cleaned.match(/^([\u4e00-\u9fa5]{2,4})(?:\u90ae\u7bb1|\u7535\u8bdd|\u624b\u673a|\uff1a|:|\s|$)/);
    if (delimiterName) {
      return delimiterName[1];
    }
    const gluedTitle = cleaned.match(
      /^([\u4e00-\u9fa5]{2,4})(?:产品|运营|设计|前端|后端|数据|项目|工程|销售|市场|算法|测试|求职)/,
    );
    if (gluedTitle && cleaned.length <= 28 && !EMAIL_RE.test(cleaned) && !PHONE_RE.test(cleaned)) {
      return gluedTitle[1];
    }
  }
  // Fallback: look for a standalone Chinese name line (2-4 chars, no common non-name patterns)
  for (const line of lines.slice(0, 15)) {
    const cleaned = line.replace(/[|｜]/g, " ").trim();
    if (
      /^[一-龥]{2,4}$/.test(cleaned) &&
      !/[@http]|手机|邮箱|电话|地址/.test(line)
    ) {
      return cleaned;
    }
  }
  return fileName.replace(/\.(pdf|docx?)$/i, "").slice(0, 16) || "未命名候选人";
}

function normalizeMonth(year: string, month?: string): string {
  const parsedMonth = month ? String(parseInt(month, 10)).padStart(2, "0") : "01";
  return `${year}-${parsedMonth}`;
}

function extractDateRange(line: string): { startDate: string; endDate: string; raw: string } | null {
  const match = line.match(DATE_RANGE_RE);
  if (!match) return null;
  const [, startYear, startMonth, endRaw, endYear, endMonth] = match;
  const endDate =
    !endRaw || /至今|现在|present|now/i.test(endRaw) ? "至今" : normalizeMonth(endYear, endMonth);
  return { startDate: normalizeMonth(startYear, startMonth), endDate, raw: match[0] };
}

function removeDateRange(line: string): string {
  let header = line.replace(DATE_RANGE_RE, "").replace(/[|｜]+$/g, "").trim();
  if (header.length > 90) {
    const trunc = header.split(/[•·]|阶段[一二三四五六七八九十\d]/)[0];
    if (trunc.trim()) header = trunc.trim();
  }
  return header;
}

function formatPeriodFromRange(range: { startDate: string; endDate: string } | null): string {
  if (!range) return "";
  const pretty = (value: string) => value.replace("-", ".");
  return `${pretty(range.startDate)} - ${range.endDate === "至今" ? "至今" : pretty(range.endDate)}`;
}

function splitHeaderParts(header: string): { company: string; position: string } {
  const normalized = header.replace(/[|｜]+/g, "｜").trim();
  const parts = normalized
    .split("｜")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { company: parts[0], position: parts.slice(1).join("｜") };

  const roleMatch = normalized.match(
    /(产品负责人|AI\s*产品负责人|产品总监|产品经理|工具链产品经理|后台产品|用户产品|项目经理|运营|设计师|工程师|实习生|leader|Lead)/i,
  );
  if (!roleMatch) return { company: normalized || "未识别公司", position: "" };
  const index = normalized.indexOf(roleMatch[0]);
  return {
    company: normalized.slice(0, index).trim() || "未识别公司",
    position: normalized.slice(index).trim(),
  };
}

function isStageHeader(line: string): boolean {
  return /^阶段[一二三四五六七八九十\d]+[:：]/.test(line);
}

function isExperienceHeader(line: string): boolean {
  if (!extractDateRange(line) || isStageHeader(line)) return false;
  const header = removeDateRange(line);
  if (!header || header.length > 90) return false;
  if (/[｜|]/.test(header)) return true;
  return /(公司|大学|学院|产品|运营|设计|工程师|实习生|负责人|总监|经理|leader|Lead)/i.test(header);
}

function cleanBullet(line: string): string {
  return repairChineseSpacing(line.replace(/^[•\-\u2022·]\s*/, ""));
}

function isInternshipBlock(text: string): boolean {
  return /实习|intern|internship/i.test(text);
}

function inferLeadershipType(text: string): PromotionStage["leadershipType"] {
  if (/总监|实线|管理约?\s*\d+\s*人|管理\s*\d+\s*人|管理产品团队/.test(text)) return "solid";
  if (/leader|负责人|虚线|带队/.test(text)) return "dotted";
  return "none";
}

function extractTeamScale(text: string): string {
  return (
    text.match(/(?:管理|带领|带队|负责|团队)[^，。；;]{0,16}?(\d+\s*人)/)?.[1]?.replace(/\s+/g, "") ??
    text.match(/(\d+\s*人)(?:产品团队|团队)/)?.[1]?.replace(/\s+/g, "") ??
    ""
  );
}

function buildStageReflection(title: string, text: string, outcome?: string, responsibility?: string): string {
  if (outcome && outcome.trim()) return outcome;
  if (responsibility && responsibility.trim()) return responsibility;
  if (/总监|管理|团队/.test(`${title} ${text}`)) {
    return "这一阶段的重点从单点产品交付转向方向判断、团队分工和商业化落地。";
  }
  if (/负责人|Leader|leader/.test(`${title} ${text}`)) {
    return "这一阶段开始承担更完整的产品方向、跨团队协作和交付结果。";
  }
  return "这一阶段主要完成从业务理解到独立交付的能力沉淀。";
}

function splitLeaderAndDirectorStage(stage: PromotionStage): PromotionStage[] {
  const text = `${stage.title} ${stage.responsibility} ${stage.outcome}`;
  if (!/负责人/.test(text) || !/总监/.test(text)) return [stage];

  return [
    {
      ...stage,
      id: generateId(),
      title: "产品负责人 / 产品 Leader",
      leadershipType: "dotted",
      teamScale: "",
      responsibility:
        "承担平台体系建设、跨团队推进和产品方向判断，开始从独立负责转向产品负责人角色。",
      outcome:
        stage.responsibility ||
        "推动一体化智能工具平台建设，覆盖项目协作、知识库、架构设计、服务仿真、服务编排等能力。",
      reflection: "这一阶段的核心变化，是从单模块交付升级为对产品方向、协作机制和平台结果负责。",
    },
    {
      ...stage,
      id: generateId(),
      title: "产品总监",
      leadershipType: "solid",
      teamScale: stage.teamScale,
      responsibility: stage.responsibility,
      outcome: stage.outcome,
      reflection: "这一阶段的重点转向团队管理、产品体系规划、商业化落地和复杂客户交付结果。",
    },
  ];
}

function extractPromotionStages(lines: string[]): PromotionStage[] {
  type StageBlock = { header: string; lines: string[] };
  const blocks: StageBlock[] = [];
  let current: StageBlock | null = null;

  for (const line of lines) {
    if (isStageHeader(line)) {
      if (current) blocks.push(current);
      current = { header: line, lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) blocks.push(current);

  const stages = blocks.map((block) => {
    const range = extractDateRange(block.header);
    const title = removeDateRange(block.header).replace(/^阶段[一二三四五六七八九十\d]+[:：]\s*/, "").trim();
    const bullets = block.lines.map(cleanBullet).filter(Boolean);
    const text = [title, ...bullets].join(" ");
    const outcome =
      bullets.find((line) => /提升|增长|\d+|0-1|覆盖|服务|客户|签单|效率|平台|建设/.test(line)) ??
      bullets[1] ??
      "";

    return {
      id: generateId(),
      title: title || "阶段经历",
      period: formatPeriodFromRange(range),
      teamScale: extractTeamScale(text),
      leadershipType: inferLeadershipType(text),
      responsibility: bullets[0] ?? "",
      outcome,
      reflection: buildStageReflection(title, text, outcome, bullets[0]),
    };
  });

  return stages.flatMap(splitLeaderAndDirectorStage);
}

function deriveStoryMood(highlights: string[]): TimelineNode["storyMood"] {
  const text = highlights.join(" ");
  if (/突破|创新|从零/.test(text)) return "breakthrough";
  if (/增长|提升|优化/.test(text)) return "growth";
  if (/负责|管理|主导/.test(text)) return "impact";
  if (/设计|打磨|精进/.test(text)) return "craft";
  return "focus";
}

function buildTimeline(workLines: string[]): TimelineNode[] {
  if (workLines.length === 0) return [];
  type Block = { headerLine: string; lines: string[] };
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const line of workLines) {
    if (isExperienceHeader(line)) {
      if (current) blocks.push(current);
      current = { headerLine: line, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);

  return blocks.map((block, index) => {
    const range = extractDateRange(block.headerLine) ?? { startDate: "", endDate: "", raw: "" };
    const header = removeDateRange(block.headerLine);
    const { company, position } = splitHeaderParts(header);
    const bulletLines = block.lines.filter((line) => !isStageHeader(line)).map(cleanBullet).filter(Boolean);
    const highlights = bulletLines.slice(0, 7);
    const description = highlights.slice(0, 2).join(" ").slice(0, 320) || header;
    const skillText = [position, description, ...highlights].join(" ");
    const skills = extractSkillNames(skillText).slice(0, 10);
    const promotionStages = extractPromotionStages(block.lines);

    return {
      id: generateId(),
      company,
      position,
      startDate: range.startDate,
      endDate: range.endDate || "至今",
      description,
      highlights,
      projects: [],
      skills,
      order: index,
      careerKind: isInternshipBlock(`${company} ${position} ${description}`) ? "internship" : "fulltime",
      storyMood: deriveStoryMood(highlights),
      promotionStages: promotionStages.length > 0 ? promotionStages : undefined,
    };
  });
}

function buildEducation(eduLines: string[]): Education[] {
  const candidates = eduLines.filter((line) => /大学|学院|学校|本科|硕士|研究生|学士|专科/.test(line));
  return candidates.slice(0, 3).map((line) => {
    const range = extractDateRange(line) ?? { startDate: "", endDate: "", raw: "" };
    const header = removeDateRange(line).replace(/[|｜]+/g, "｜").trim();
    const parts = header.split("｜").map((part) => part.trim()).filter(Boolean);
    const degree = parts.find((part) => /本科|硕士|研究生|学士|专科|博士/.test(part)) ?? "";
    return {
      id: generateId(),
      school: parts[0] ?? header.slice(0, 24),
      degree,
      major: parts.find((part) => part !== parts[0] && part !== degree) ?? "",
      startDate: range.startDate,
      endDate: range.endDate,
    };
  });
}

function extractSkillNames(text: string): string[] {
  const known = [
    "AI Agent",
    "RAG",
    "UML/SysML",
    "MBSE",
    "ToB 售前",
    "招投标",
    "产品定价",
    "平台产品",
    "产品规划",
    "产品架构",
    "需求分析",
    "业务分析",
    "项目管理",
    "跨部门协作",
    "团队管理",
    "商业化",
    "知识库",
    "数据分析",
    "指标体系",
    "PRD",
    "Axure",
    "Figma",
    "XMind",
    "Visio",
    "SQL",
    "Excel",
    "React",
    "TypeScript",
    "JavaScript",
    "Python",
  ];
  return known.filter((skill) => new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text));
}

function buildArchitectureFromTimeline(timeline: TimelineNode[]): ArchitectureModule[] {
  if (timeline.length === 0) return [];
  const rootId = "arch-root";
  return [
    {
      id: rootId,
      title: "经历结构",
      description: "基于工作经历自动生成",
      type: "business",
      industry: "internet",
      position: { x: 350, y: 0 },
      parentId: null,
      relatedTimelineIds: timeline.map((node) => node.id),
    },
    ...timeline.map((node, index) => ({
      id: generateId(),
      title: node.company,
      description: node.position || node.description.slice(0, 60),
      type: "business" as const,
      industry: "internet" as const,
      position: { x: index * 240, y: 200 },
      parentId: rootId,
      relatedTimelineIds: [node.id],
    })),
  ];
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(1, numerator / denominator));
}

function buildParseConfidence(data: ResumeData, stats: ParseStats): ParseConfidence {
  const profileFilled = [data.profile.name, data.profile.email, data.profile.title, data.profile.summary]
    .filter((value) => Boolean(value?.trim())).length;
  const profile = ratio(profileFilled, 4);
  const timeline = data.timeline.length === 0 ? 0 : ratio(data.timeline.filter((node) => node.company && node.description).length, data.timeline.length);
  const education = data.education.length === 0 ? 0 : ratio(data.education.filter((edu) => edu.school).length, data.education.length);
  const skills = ratio(data.skillProfile?.coverage.owned ?? 0, Math.max(data.skillProfile?.coverage.total ?? 0, 1));
  const overall = 0.35 * profile + 0.35 * timeline + 0.15 * education + 0.15 * skills;
  const needsConfirmation: string[] = [];
  if (profile < 0.7) needsConfirmation.push("个人信息不完整");
  if (timeline < 0.75 || stats.detectedTimelineCount === 0) needsConfirmation.push("工作经历需要重点校对");
  if (skills < 0.35) needsConfirmation.push("技能识别结果建议校对");

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
  const text = cleanText(rawText);
  const lines = splitLines(text);
  const sections = splitToSections(lines);
  const profileLines = sections.profile.length > 0 ? sections.profile : lines.slice(0, 12);
  const name = pickName(profileLines, fileName);
  const email = text.match(EMAIL_RE)?.[0] ?? "";
  const phone = text.match(PHONE_RE)?.[0] ?? "";
  const website = text.match(URL_RE)?.[0] ?? "";
  const timelineSource = sections.work.length > 0 ? sections.work : sections.project.length > 0 ? sections.project : lines;
  const timeline = buildTimeline(timelineSource).filter((node) => node.startDate || node.description);
  const education = buildEducation(sections.education.length > 0 ? sections.education : lines);
  const summary = sections.summary.join(" ").slice(0, 320) || lines.slice(1, 5).join(" ").slice(0, 320);
  const profileTitle = timeline.find((node) => node.careerKind === "fulltime")?.position || timeline[0]?.position || "";
  const skillProfile = buildSkillProfile({
    text: `${text} ${sections.skills.join(" ")}`,
    timeline,
    profileTitle,
  });
  const skills = buildSkillNodesFromProfile(skillProfile);

  const data: ResumeData = {
    profile: {
      id: generateId(),
      name,
      email,
      phone: phone || undefined,
      title: profileTitle,
      summary,
      website: website || undefined,
    },
    publicSiteTemplate: "executive-dossier",
    timeline,
    skills,
    skillProfile,
    roleTemplateId: skillProfile.templateId,
    architecture: buildArchitectureFromTimeline(timeline),
    education,
    roleUnderstanding: createDefaultRoleUnderstanding(profileTitle),
  };

  const stats: ParseStats = {
    textLength: text.length,
    detectedTimelineCount: timeline.length,
    detectedEducationCount: education.length,
    detectedSkillCount: skillProfile.coverage.owned,
  };

  return { data, stats, confidence: buildParseConfidence(data, stats) };
}
