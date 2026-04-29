import type { ResumeData, SkillNode, TimelineNode } from "@/types";
import { getPublishChecks } from "@/lib/share/publish-checks";
import { getOrderedTimeline } from "@/lib/timeline/order";
import type {
  CareerSiteDraft,
  CareerSiteExperienceBlock,
  CareerSiteSection,
  CareerSiteStyle,
  CareerSiteStylePreset,
  GenerateCareerSiteDraftInput,
} from "./types";

type QualitySignal = {
  missingFacts: string[];
  riskyClaims: string[];
  publishBlockers: string[];
  confidence: number;
};

function clean(value: string | undefined | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function compact(value: string | undefined | null, fallback: string, max = 180): string {
  const normalized = clean(value) || fallback;
  return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized;
}

function unique(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function periodFor(node: TimelineNode): string {
  const start = clean(node.startDate);
  const end = clean(node.endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "时间待补充";
}

function scoreSkill(skill: SkillNode): number {
  const importance = skill.importance === "core" ? 4 : skill.importance === "important" ? 2 : 0;
  const status = skill.status === "owned" ? 2 : skill.status === "inferred" ? 1 : 0;
  return skill.level + importance + status;
}

function textCorpus(data: ResumeData, instruction?: string): string {
  return [
    instruction,
    data.profile.title,
    data.profile.summary,
    data.roleUnderstanding?.targetRoleTitle,
    data.roleUnderstanding?.oneLineInterpretation,
    ...data.timeline.flatMap((node) => [
      node.company,
      node.position,
      node.description,
      node.storyTitle,
      node.storyOutcome,
      node.evidenceResult,
      ...node.highlights,
      ...node.skills,
    ]),
    ...data.skills.map((skill) => skill.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function detectStylePreset(data: ResumeData, instruction?: string): CareerSiteStylePreset {
  const corpus = textCorpus(data, instruction);
  if (/ai|agent|rag|llm|智能体|大模型|技术|架构|研发|工程/.test(corpus)) return "technical-builder";
  if (/产品|增长|平台|saas|b端|pm|product/.test(corpus)) return "product-led";
  if (/负责人|总监|管理|leader|director|vp|founder|ceo/.test(corpus)) return "executive";
  if (/设计|创意|品牌|内容|creative|design/.test(corpus)) return "creative";
  return "minimal";
}

function styleForPreset(preset: CareerSiteStylePreset): CareerSiteStyle {
  const styles: Record<CareerSiteStylePreset, CareerSiteStyle> = {
    executive: {
      preset,
      tone: "克制、可信、面向决策者",
      density: "balanced",
      colorTheme: "墨黑、暖白、深青",
      layoutStyle: "高管档案式叙事，先给判断，再给证据",
      typography: "沉稳标题字重，紧凑正文",
    },
    "product-led": {
      preset,
      tone: "结构清晰、结果导向、有产品判断",
      density: "balanced",
      colorTheme: "石墨黑、白色、信号蓝",
      layoutStyle: "产品案例式叙事，突出问题、选择和结果",
      typography: "现代无衬线，清晰层级",
    },
    "technical-builder": {
      preset,
      tone: "精确、系统化、证据优先",
      density: "detailed",
      colorTheme: "炭黑、雾白、电光青",
      layoutStyle: "技术建设者叙事，突出系统、链路和可交付结果",
      typography: "紧凑无衬线，搭配技术感标注",
    },
    minimal: {
      preset,
      tone: "直接、干净、易读",
      density: "focused",
      colorTheme: "黑、白、中性灰",
      layoutStyle: "单列作品集，减少装饰，突出内容",
      typography: "安静的无衬线字体",
    },
    creative: {
      preset,
      tone: "有人味、故事感、表达鲜明",
      density: "balanced",
      colorTheme: "墨黑、白色、珊瑚红",
      layoutStyle: "杂志式职业故事，突出关键转折",
      typography: "更有识别度的标题和清爽正文",
    },
  };
  return styles[preset];
}

function targetRoleFor(data: ResumeData): string {
  return compact(
    data.roleUnderstanding?.targetRoleTitle || data.profile.title || data.timeline[0]?.position,
    "目标岗位待确认",
    48,
  );
}

function strengthNames(data: ResumeData, limit = 8): string[] {
  const fromProfile = data.skillProfile?.detectedSkillNames ?? [];
  const fromSkillNodes = data.skills
    .filter((skill) => skill.status !== "missing")
    .sort((a, b) => scoreSkill(b) - scoreSkill(a))
    .map((skill) => skill.name);
  const fromTimeline = data.timeline.flatMap((node) => node.skills);
  const fallback = data.timeline.flatMap((node) => [node.position, node.company]);
  return unique([...fromProfile, ...fromSkillNodes, ...fromTimeline, ...fallback]).slice(0, limit);
}

function evidenceFor(node: TimelineNode): string[] {
  return unique([
    node.evidenceResult,
    node.storyOutcome,
    ...node.highlights.filter((item) => /\d|%|提升|增长|上线|覆盖|完成|负责|主导|获得|降低|优化/i.test(item)),
    node.description,
  ]).slice(0, 4);
}

function proofPointsFor(data: ResumeData, orderedTimeline: TimelineNode[]): string[] {
  const roleMappings = data.roleUnderstanding?.experienceMappings.map((item) => item.outcomeEvidence) ?? [];
  return unique([
    data.roleUnderstanding?.oneLineInterpretation,
    ...roleMappings,
    ...orderedTimeline.flatMap(evidenceFor),
  ]).slice(0, 5);
}

function inferPositioningLine(data: ResumeData, targetRole: string, strengths: string[]): string {
  if (clean(data.roleUnderstanding?.oneLineInterpretation)) {
    return compact(data.roleUnderstanding.oneLineInterpretation, "", 160);
  }
  if (clean(data.profile.summary)) return compact(data.profile.summary, "", 160);
  const strongest = strengths.slice(0, 3).join("、");
  if (strongest) return `围绕${targetRole}，用${strongest}把复杂问题转化为可落地的结果。`;
  return `这份网站需要继续补齐目标岗位和代表性成果，才能形成清晰的${targetRole}叙事。`;
}

function storyTitleFor(node: TimelineNode): string {
  if (clean(node.storyTitle)) return compact(node.storyTitle, "", 72);
  if (clean(node.company) && clean(node.position)) return `${node.company} · ${node.position}`;
  return clean(node.position) || clean(node.company) || "关键经历";
}

function storySummaryFor(node: TimelineNode): string {
  if (clean(node.storyScene) || clean(node.storyChallenge) || clean(node.storyAction) || clean(node.storyOutcome)) {
    return compact(
      unique([node.storyScene, node.storyChallenge, node.storyAction, node.storyOutcome]).join(" "),
      "",
      240,
    );
  }
  return compact(node.description, "这段经历还需要补充背景、行动和结果，才能成为可发布的职业故事。", 220);
}

function storyBulletsFor(node: TimelineNode): string[] {
  const structured = unique([
    node.storyChallenge ? `问题：${node.storyChallenge}` : undefined,
    node.storyAction ? `行动：${node.storyAction}` : undefined,
    node.storyOutcome ? `结果：${node.storyOutcome}` : undefined,
    node.storyReflection ? `沉淀：${node.storyReflection}` : undefined,
  ]);
  return (structured.length > 0 ? structured : unique([node.description, ...node.highlights])).slice(0, 4);
}

function experienceBlocksFor(orderedTimeline: TimelineNode[]): CareerSiteExperienceBlock[] {
  return orderedTimeline.slice(0, 4).map((node) => ({
    id: `experience-${node.id}`,
    title: storyTitleFor(node),
    organization: clean(node.company) || "组织待补充",
    period: periodFor(node),
    summary: storySummaryFor(node),
    bullets: storyBulletsFor(node),
    sourceTimelineId: node.id,
  }));
}

function sectionsFor(data: ResumeData, orderedTimeline: TimelineNode[], strengths: string[], proofPoints: string[]): CareerSiteSection[] {
  const first = orderedTimeline[0];
  const sections: CareerSiteSection[] = [
    {
      id: "positioning",
      kind: "positioning",
      eyebrow: "职业定位",
      title: "让访客在 10 秒内知道你是谁",
      body: inferPositioningLine(data, targetRoleFor(data), strengths),
      bullets: strengths.slice(0, 4),
      sourceTimelineIds: [],
      confidence: strengths.length >= 3 ? 0.84 : 0.58,
    },
    {
      id: "proof",
      kind: "proof",
      eyebrow: "可信证据",
      title: "先展示事实，再表达能力",
      body:
        proofPoints.length > 0
          ? "这些亮点都来自简历中的公司、项目、经历或结果描述，不新增未经确认的数字。"
          : "当前简历缺少足够强的结果证据，建议先补充 1-2 个可验证成果。",
      bullets: proofPoints.length > 0 ? proofPoints : ["补充一个真实结果、指标、上线产出或负责范围。"],
      sourceTimelineIds: orderedTimeline.slice(0, 3).map((node) => node.id),
      confidence: proofPoints.length >= 2 ? 0.88 : 0.5,
    },
  ];

  if (first) {
    sections.push({
      id: "story",
      kind: "story",
      eyebrow: "职业叙事",
      title: "把经历组织成一条能被理解的线",
      body: compact(
        first.storyReflection || first.storyOutcome || first.description,
        "从最近、最相关的一段经历切入，把问题、行动、结果和目标岗位连接起来。",
        260,
      ),
      bullets: storyBulletsFor(first),
      sourceTimelineIds: [first.id],
      confidence: first.storyOutcome || first.evidenceResult ? 0.82 : 0.6,
    });
  }

  sections.push({
    id: "experience",
    kind: "experience",
    eyebrow: "代表经历",
    title: "把履历变成可阅读的职业故事",
    body: "每段经历都优先呈现背景、行动和结果，而不是把职责平铺成列表。",
    bullets: orderedTimeline.slice(0, 4).map((node) => storyTitleFor(node)),
    sourceTimelineIds: orderedTimeline.slice(0, 4).map((node) => node.id),
    confidence: orderedTimeline.length > 0 ? 0.84 : 0.35,
  });

  if (strengths.length > 0) {
    sections.push({
      id: "skills",
      kind: "skills",
      eyebrow: "能力地图",
      title: "不是关键词堆叠，而是可迁移能力",
      body: "技能区会围绕目标岗位重新组织，让访客看到你能反复解决什么类型的问题。",
      bullets: strengths,
      sourceTimelineIds: [],
      confidence: strengths.length >= 4 ? 0.82 : 0.62,
    });
  }

  if (data.education.length > 0) {
    sections.push({
      id: "education",
      kind: "education",
      eyebrow: "教育背景",
      title: "基础背景",
      body: data.education.map((item) => unique([item.school, item.degree, item.major]).join(" / ")).join("；"),
      bullets: data.education.map((item) => unique([item.startDate, item.endDate]).join(" - ")),
      sourceTimelineIds: [],
      confidence: 0.76,
    });
  }

  sections.push({
    id: "contact",
    kind: "contact",
    eyebrow: "下一步",
    title: "让合适的人能联系到你",
    body: data.profile.email ? `建议把 ${data.profile.email} 作为主要联系入口。` : "发布前建议补充邮箱或首选联系方式。",
    bullets: unique([data.profile.email, data.profile.phone, data.profile.website, data.profile.linkedin]),
    sourceTimelineIds: [],
    confidence: data.profile.email ? 0.92 : 0.42,
  });

  return sections;
}

function riskyClaimsFrom(sections: CareerSiteSection[]): string[] {
  return sections
    .flatMap((section) => [section.body, ...section.bullets])
    .filter((item) => /第一|唯一|顶级|最佳|千万|亿|100%/i.test(item))
    .slice(0, 5);
}

function qualityFor(data: ResumeData, sections: CareerSiteSection[]): QualitySignal {
  const checks = getPublishChecks(data);
  const publishBlockers = checks.filter((check) => check.severity === "blocker").map((check) => check.label);
  const missingFacts = checks.filter((check) => check.severity === "warning").map((check) => check.label);
  if (!clean(data.roleUnderstanding?.targetRoleTitle) && !clean(data.profile.title)) {
    missingFacts.push("目标岗位");
  }
  if (!clean(data.profile.summary) && !clean(data.roleUnderstanding?.oneLineInterpretation)) {
    missingFacts.push("一句话职业定位");
  }
  if (!data.timeline.some((node) => evidenceFor(node).length > 0)) {
    missingFacts.push("可验证成果");
  }

  const riskyClaims = riskyClaimsFrom(sections);
  const confidenceBase = sections.reduce((sum, section) => sum + section.confidence, 0) / Math.max(1, sections.length);
  const confidence = Math.max(
    0.28,
    Math.min(0.96, confidenceBase - publishBlockers.length * 0.14 - missingFacts.length * 0.035 - riskyClaims.length * 0.04),
  );
  return { confidence, missingFacts: unique(missingFacts), riskyClaims, publishBlockers };
}

function statusFor(signal: QualitySignal): CareerSiteDraft["status"] {
  const criticalMissing = signal.missingFacts.some((item) =>
    ["目标岗位", "一句话职业定位", "可验证成果"].includes(item),
  );
  if (signal.publishBlockers.length > 0 || criticalMissing || signal.confidence < 0.7) return "needs_review";
  return "ready";
}

function questionHint(signal: QualitySignal): string {
  const top = signal.missingFacts.slice(0, 3);
  if (top.length === 0) return "当前草稿已经可以进入风格和叙事精修。";
  return `建议先补充：${top.join("、")}。`;
}

export function generateCareerSiteDraft(data: ResumeData, input: GenerateCareerSiteDraftInput = {}): CareerSiteDraft {
  const now = input.now ?? new Date();
  const orderedTimeline = getOrderedTimeline(data.timeline);
  const targetRole = targetRoleFor(data);
  const strengths = strengthNames(data);
  const proofPoints = proofPointsFor(data, orderedTimeline);
  const sections = sectionsFor(data, orderedTimeline, strengths, proofPoints);
  const review = qualityFor(data, sections);
  const style = styleForPreset(detectStylePreset(data, input.instruction));
  const name = compact(data.profile.name, "候选人", 32);
  const firstExperience = orderedTimeline[0];
  const positioningLine = inferPositioningLine(data, targetRole, strengths);
  const storyTheme = compact(
    firstExperience?.storyTitle || data.roleUnderstanding?.oneLineInterpretation || data.profile.summary,
    `${targetRole} 的职业叙事`,
    88,
  );

  return {
    id: `draft-${data.profile.id || name.replace(/\s+/g, "-").toLowerCase()}`,
    sourceResumeId: data.profile.id || "local-resume",
    provider: input.provider ?? "rules",
    status: statusFor(review),
    positioning: {
      targetRole,
      headline: `${name}｜${targetRole}`,
      oneLinePitch: positioningLine,
      audience: "招聘负责人、面试官、合作方，以及需要快速判断职业匹配度的人。",
      coreStrengths: strengths,
    },
    narrative: {
      theme: storyTheme,
      storyArc: firstExperience
        ? compact(
            firstExperience.storyReflection || firstExperience.storyOutcome || firstExperience.description,
            "从最近、最相关的一段经历切入，把问题、行动、结果和目标岗位连接起来。",
            260,
          )
        : "这份网站还缺少至少一段工作、项目或实习经历，Agent 会先追问关键事实。",
      featuredExperienceIds: orderedTimeline.slice(0, 3).map((node) => node.id),
      proofPoints,
    },
    hero: {
      eyebrow: review.publishBlockers.length > 0 ? "需要补充关键事实" : "个人职业网站初稿",
      title: `${name}，${targetRole}`,
      subtitle: positioningLine,
      primaryCta: review.publishBlockers.length > 0 ? "先补充信息" : "发布网站",
      secondaryCta: "继续对话修改",
    },
    sections,
    experienceBlocks: experienceBlocksFor(orderedTimeline),
    style,
    review,
    versionHistory: [
      {
        id: "v1",
        summary: `基于简历生成首版网站草稿。${questionHint(review)}`,
        createdAt: now.toISOString(),
      },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
