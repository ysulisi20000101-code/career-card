import type { ResumeData, TimelineNode } from "@/types";
import type { PresentationDraft, PresentationSlide, PresentationOverlay } from "./types";
import { applyInterviewStoryBlueprint } from "./interview-story";
import { getResumeRevision } from "@/lib/public-narrative/from-draft";
import { getOrderedTimeline } from "@/lib/timeline/order";

function safeRandomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

/** Return timeline in chronological order (oldest first) for narrative building. */
function asChronological(timeline: TimelineNode[]): TimelineNode[] {
  return [...timeline].reverse();
}

/**
 * Rule-based PresentationDraft generator from ResumeData.
 *
 * Works with the fields that resume parsing ACTUALLY populates:
 *   company, position, startDate, endDate, description, highlights, skills, careerKind, promotionStages
 *
 * Also uses story and evidence fields when available (from interview prep flow),
 * but never depends on them -- every slide has a high-quality fallback path.
 */
export function generatePresentationDraft(data: ResumeData): PresentationDraft {
  const now = new Date().toISOString();
  const slides: PresentationSlide[] = [];
  const overlays: PresentationOverlay[] = [];

  const name = data.profile.name || "候选人";
  const title = data.roleUnderstanding?.targetRoleTitle || data.profile.title || "专业人才";
  const oneLine = data.roleUnderstanding?.oneLineInterpretation || data.profile.summary || "";
  const timeline = getOrderedTimeline(data.timeline ?? []);
  const topExperiences = pickTopExperiences(timeline, 3);

  // ─── Slide 1: Hero ───────────────────────────────────────────────
  slides.push(buildHeroSlide(data, name, title, oneLine));

  // ─── Slide 2: Foundation ─────────────────────────────────────────
  const earlyNodes = timeline.slice(-Math.min(3, timeline.length));
  slides.push(buildFoundationSlide(earlyNodes, oneLine));

  // ─── Slide 3: Tension ────────────────────────────────────────────
  const tensionSlide = buildTensionSlide(data, title);
  slides.push(tensionSlide.slide);
  if (tensionSlide.overlay) overlays.push(tensionSlide.overlay);

  // ─── Slide 4: Platform Build ─────────────────────────────────────
  if (topExperiences[0]) {
    const { slide, overlay } = buildPlatformBuildSlide(topExperiences[0]);
    slides.push(slide);
    overlays.push(overlay);
  }

  // ─── Slide 5: Agent Leap ─────────────────────────────────────────
  if (topExperiences[1]) {
    const { slide, overlay } = buildAgentLeapSlide(topExperiences[1]);
    slides.push(slide);
    overlays.push(overlay);
  } else if (topExperiences[0]?.promotionStages && topExperiences[0].promotionStages.length > 1) {
    slides.push(buildPromotionLeapSlide(topExperiences[0]));
  } else if (timeline.length > 1) {
    // Use career progression as leap narrative
    slides.push(buildProgressionSlide(timeline));
  }

  // ─── Slide 6: Full Stack ─────────────────────────────────────────
  slides.push(buildFullstackSlide(timeline.slice(0, 5)));

  // ─── Slide 7: Impact ─────────────────────────────────────────────
  slides.push(buildImpactSlide(data, topExperiences));

  // ─── Slide 8: Resolution ─────────────────────────────────────────
  slides.push(buildResolutionSlide(data, name, title, oneLine, timeline, topExperiences));

  // ─── Experience-mapping overlays (from roleUnderstanding) ─────────
  for (const mapping of data.roleUnderstanding?.experienceMappings?.slice(0, 2) ?? []) {
    if (mapping.outcomeEvidence || mapping.myExperience) {
      overlays.push({
        id: `ov-mapping-${mapping.id}`,
        title: mapping.requirement || "能力验证",
        kind: "experience-mapping",
        body: [
          mapping.requirement ? `要求：${mapping.requirement}` : "",
          mapping.myExperience ? `我的经验：${mapping.myExperience}` : "",
          mapping.outcomeEvidence ? `成果证据：${mapping.outcomeEvidence}` : "",
        ].filter(Boolean).join("\n"),
        sourceRefs: [{ type: "roleUnderstanding" }],
      });
    }
  }

  // ─── Standard reference overlays (always included) ────────────────
  overlays.push({
    id: "ov-agent-workflow",
    title: "受控式 Agent 工作流",
    kind: "agent-workflow",
    body: "",
    sourceRefs: [],
  });
  overlays.push({
    id: "ov-rag-detail",
    title: "RAG 知识库 · 全链路数据流",
    kind: "rag-detail",
    body: "",
    sourceRefs: [],
  });
  overlays.push({
    id: "ov-conflict-types",
    title: "一致性校验 Agent · 7 大类冲突场景",
    kind: "conflict-types",
    body: "",
    sourceRefs: [],
  });
  overlays.push({
    id: "ov-arch-detail",
    title: "Groot-Arch 一体化架构 · 三层体系",
    kind: "arch-detail",
    body: "",
    sourceRefs: [],
  });
  overlays.push({
    id: "ov-platform",
    title: "平台基础设施 · 分层架构",
    kind: "platform",
    body: "",
    sourceRefs: [],
  });

  const draft: PresentationDraft = {
    id: safeRandomId(),
    schemaVersion: 1,
    sourceResumeRevision: getResumeRevision(data),
    targetRole: title,
    template: "agent-product-arc",
    slides,
    overlays,
    themeId: "light-story",
    createdAt: now,
    updatedAt: now,
  };
  return applyInterviewStoryBlueprint(draft, data);
}

// ─── Slide Builders ────────────────────────────────────────────────

function buildHeroSlide(data: ResumeData, name: string, title: string, oneLine: string): PresentationSlide {
  // Strong title: use oneLineInterpretation if available, else synthesize
  let heroTitle: string;
  if (oneLine && oneLine.length > 5) {
    heroTitle = `${name}：${oneLine}`;
  } else if (data.profile.title) {
    heroTitle = `${name} · ${data.profile.title}`;
  } else {
    heroTitle = name;
  }

  // Subtitle: target role + education
  const parts: string[] = [];
  const target = data.roleUnderstanding?.targetRoleTitle;
  const company = data.roleUnderstanding?.companyContext;
  if (target && company) parts.push(`${target} · ${company}`);
  else if (target) parts.push(target);
  const edu = data.education?.[0];
  if (edu?.school) parts.push(edu.school);
  const subtitle = parts.join(" · ") || "Career Portfolio";

  // Body: summary or synthesized from top experience
  const body = data.profile.summary || oneLine || synthesizeHeroBody(data);

  // Stats: extract from highlights (look for numbers)
  const stats = buildHeroStats(data);

  return {
    id: "hero",
    kind: "hero",
    title: heroTitle,
    subtitle,
    body,
    bullets: stats,
    visualizations: [{ type: "orbit", data: { core: name, satellites: extractSkillTags(data).slice(0, 6) } }],
    speakerNotes: `开场引导：${stats.join("；")}。目标角色：${title}。`,
    sourceRefs: [{ type: "profile" }],
  };
}

function synthesizeHeroBody(data: ResumeData): string {
  const timeline = data.timeline ?? [];
  if (timeline.length === 0) return "";
  const companies = timeline.map((n) => n.company).filter(Boolean);
  const uniqueCompanies = [...new Set(companies)];
  const years = estimateYears(timeline);
  return `${years} 年从业经验，历任${uniqueCompanies.slice(0, 3).join("、")}等${uniqueCompanies.length > 3 ? "多家企业" : "企业"}，具备完整的产品全链路能力。`;
}

function buildFoundationSlide(nodes: TimelineNode[], oneLine: string): PresentationSlide {
  // Title: narrative arc from career progression (use chronological order)
  const chronoNodes = asChronological(nodes);
  const companies = chronoNodes.map((n) => n.company).filter(Boolean);
  let title: string;
  if (chronoNodes.length >= 2 && companies.length >= 2) {
    title = `从${companies[0]}到${companies[companies.length - 1]}，积累核心能力`;
  } else if (chronoNodes.length === 1) {
    title = `${chronoNodes[0]!.company}：职业生涯的起点`;
  } else {
    title = "从一线业务切入，建立方法论";
  }

  // Subtitle: company timeline (chronological order)
  const subtitle = companies.join(" · ") || "职业起点";

  // Body: storyScene if available, else synthesize from highlights
  const body = chronoNodes[0]?.storyScene || oneLine || synthesizeFoundationBody(chronoNodes);

  // Bullets: each job's key achievement (first highlight, or synthesized)
  const bullets = nodes.map((n) => {
    // Prefer story fields if available
    if (n.storyOutcome) return `${n.company} · ${n.position}：${n.storyOutcome}`;
    if (n.storyChallenge) return `${n.company} · ${n.position}：${n.storyChallenge}`;
    // Use highlights
    const highlight = n.highlights?.[0];
    if (highlight) return `${n.company} · ${n.position}：${highlight}`;
    return `${n.company} · ${n.position}`;
  });

  return {
    id: "foundation",
    kind: "foundation",
    title,
    subtitle,
    body,
    bullets,
    speakerNotes: `早期经历共 ${nodes.length} 段，建立可信度基础。`,
    sourceRefs: nodes.map((n) => ({ type: "timeline" as const, id: n.id })),
  };
}

function synthesizeFoundationBody(nodes: TimelineNode[]): string {
  if (nodes.length === 0) return "";
  const first = nodes[0]!;
  const highlights = first.highlights?.slice(0, 2).join("，") || "";
  if (highlights) return `在${first.company}期间，${highlights}。`;
  return `在${first.company}担任${first.position}，积累了行业核心经验。`;
}

function buildTensionSlide(data: ResumeData, title: string): { slide: PresentationSlide; overlay?: PresentationOverlay } {
  const problems = data.roleUnderstanding?.priorityProblems ?? [];
  const realProblems = problems.filter((p) => p.problem && p.problem.trim().length > 0);

  // If we have real problem data, use it
  if (realProblems.length > 0) {
    const problem = realProblems[0]!;
    const bullets = realProblems.slice(0, 4).map((p) => {
      let text = p.problem;
      if (p.impact) text += `——${p.impact}`;
      if (p.evidence) text += `（${p.evidence}）`;
      return text;
    });

    const overlay: PresentationOverlay | undefined = realProblems.some((p) => p.impact || p.evidence)
      ? {
          id: "ov-tension-deep",
          title: "问题深度分析",
          kind: "tension-analysis",
          body: realProblems.map((p) => {
            const parts = [`问题：${p.problem}`];
            if (p.impact) parts.push(`影响：${p.impact}`);
            if (p.evidence) parts.push(`证据：${p.evidence}`);
            return parts.join("\n");
          }).join("\n\n"),
          sourceRefs: [{ type: "roleUnderstanding" }],
        }
      : undefined;

    return {
      slide: {
        id: "tension",
        kind: "tension",
        title: problem.problem,
        subtitle: "The Gap",
        body: realProblems.slice(0, 3).map((p) => {
          if (p.impact) return `${p.problem}——${p.impact}`;
          return p.problem;
        }).join("。") + "。",
        bullets,
        visualizations: [{ type: "v-model", data: { showGaps: true } }],
        overlayIds: overlay ? [overlay.id] : undefined,
        speakerNotes: `核心矛盾：${problem.problem}`,
        sourceRefs: [{ type: "roleUnderstanding" }],
      },
      overlay,
    };
  }

  // No role understanding data — synthesize tension from career data
  const timeline = data.timeline ?? [];
  const careerGaps = synthesizeTensionFromCareer(timeline, title);

  return {
    slide: {
      id: "tension",
      kind: "tension",
      title: careerGaps.title,
      subtitle: "The Gap",
      body: careerGaps.body,
      bullets: careerGaps.bullets,
      visualizations: [{ type: "v-model", data: { showGaps: true } }],
      speakerNotes: `从职业经历推导的核心挑战。`,
      sourceRefs: [{ type: "timeline" }],
    },
  };
}

function synthesizeTensionFromCareer(timeline: TimelineNode[], title: string): { title: string; body: string; bullets: string[] } {
  // Analyze the career to find the implicit "gap" narrative
  const internships = timeline.filter((n) => n.careerKind === "internship");
  const fulltimes = timeline.filter((n) => n.careerKind === "fulltime");
  const companies = [...new Set(timeline.map((n) => n.company))];

  // Build tension from career progression
  if (internships.length > 0 && fulltimes.length > 0) {
    return {
      title: `从实习到正式，${title}需要的能力跃迁`,
      body: `${internships.length} 段实习经历建立了基础认知，但${title}需要的系统性能力——从执行到规划、从单点到全局——需要在正式岗位中完成质变。`,
      bullets: [
        `实习阶段：${internships.map((n) => n.company).join("、")}——建立行业认知`,
        `正式阶段：需要从执行者转变为规划者`,
        `能力缺口：系统性思维、跨团队协调、商业判断`,
        `目标：成为${title}方向的复合型人才`,
      ],
    };
  }

  if (timeline.length >= 3) {
    return {
      title: `${companies.length} 段经历背后，是${title}领域的结构性机会`,
      body: `在${companies.slice(0, 3).join("、")}的实践中，看到了行业效率提升的巨大空间。现有方案存在明显的改进机会。`,
      bullets: [
        `行业现状：传统方法效率有待提升`,
        `数据孤岛：各环节信息未充分打通`,
        `智能化不足：重复性工作占比高`,
        `用户体验：操作流程有优化空间`,
      ],
    };
  }

  return {
    title: `在${title}方向，持续深耕创造价值`,
    body: `通过${timeline.length} 段核心经历的积累，形成了对行业的深度理解和系统性方法论。`,
    bullets: [
      `行业理解：来自一线实践的深度认知`,
      `方法论：从实践中提炼的可复制框架`,
      `执行力：持续交付高质量成果`,
      `成长性：不断拓展能力边界`,
    ],
  };
}

function buildPlatformBuildSlide(exp: TimelineNode): { slide: PresentationSlide; overlay: PresentationOverlay } {
  // Title: prefer storyTitle, else synthesize
  const title = exp.storyTitle || `${exp.company}：${exp.position}的核心突破`;

  // Body: prefer story fields, else use description
  const body = exp.storyOutcome || exp.storyChallenge || exp.description || "";

  // Bullets: use evidence chain if available, else use highlights intelligently
  const bullets = buildSmartBullets(exp, 6);

  // Overlay: detailed experience breakdown
  const overlay = buildExperienceOverlay(exp);

  // Phase tag and summary
  const phaseTag = exp.position || undefined;
  const summaryLine = exp.highlights?.length
    ? `交付 ${exp.highlights.length} 个核心成果，${exp.storyOutcome ? "完成关键突破" : "奠定晋升基础"}`
    : undefined;

  // Highlight callouts from best story/evidence fields
  const highlightCallouts = buildHighlightCallouts(exp);

  return {
    slide: {
      id: "platform-build",
      kind: "platform_build",
      title,
      subtitle: `${exp.company} · ${exp.position || ""}`,
      body,
      bullets,
      overlayIds: [overlay.id],
      phaseTag,
      summaryLine,
      highlightCallouts,
      speakerNotes: `核心案例。${exp.highlights?.length || 0} 个关键成果。`,
      sourceRefs: [{ type: "timeline", id: exp.id }],
    },
    overlay,
  };
}

function buildAgentLeapSlide(exp: TimelineNode): { slide: PresentationSlide; overlay: PresentationOverlay } {
  const title = exp.storyTitle || `${exp.company}：能力维度的扩展`;

  const body = exp.storyChallenge || exp.storyOutcome || exp.description || "";

  // Bullets: highlight the "leap" — what changed
  const bullets = buildSmartBullets(exp, 5);

  const overlay = buildExperienceOverlay(exp);

  // Phase tag and summary
  const phaseTag = exp.position || undefined;
  const summaryLine = extractKeywords(exp);

  // Highlight callouts
  const highlightCallouts = buildHighlightCallouts(exp);

  return {
    slide: {
      id: "agent-leap",
      kind: "agent_leap",
      title,
      subtitle: `${exp.company} · ${exp.position || ""}`,
      body,
      bullets,
      overlayIds: [overlay.id],
      phaseTag,
      summaryLine,
      highlightCallouts,
      speakerNotes: `第二段关键经历，展示能力扩展。`,
      sourceRefs: [{ type: "timeline", id: exp.id }],
    },
    overlay,
  };
}

function buildPromotionLeapSlide(exp: TimelineNode): PresentationSlide {
  const stages = exp.promotionStages!;
  const first = stages[0]!;
  const last = stages[stages.length - 1]!;

  return {
    id: "agent-leap",
    kind: "agent_leap",
    title: `${exp.company}：从${first.title}到${last.title}`,
    subtitle: `${stages.length} 个阶段的成长弧线`,
    body: exp.storyReflection || exp.storyOutcome || last.outcome || last.responsibility || "",
    bullets: stages.map((s) => {
      const outcome = s.outcome || s.responsibility;
      return `${s.title}（${s.period}）：${outcome}`;
    }),
    sourceRefs: [{ type: "timeline", id: exp.id }],
  };
}

function buildProgressionSlide(timeline: TimelineNode[]): PresentationSlide {
  const latest = timeline[0]!;
  const earliest = timeline[timeline.length - 1]!;

  return {
    id: "progression",
    kind: "agent_leap",
    title: `从${earliest.position}到${latest.position}`,
    subtitle: `${timeline.length} 段经历的能力跃迁`,
    body: `从${earliest.company}的${earliest.position}起步，到${latest.company}的${latest.position}，每一段经历都在拓展能力边界。`,
    bullets: timeline.slice(0, 5).map((n) => {
      const highlight = n.highlights?.[0] || n.description?.slice(0, 50);
      return `${n.company} · ${n.position}：${highlight || "核心职责"}`;
    }),
    sourceRefs: timeline.map((n) => ({ type: "timeline" as const, id: n.id })),
  };
}

function buildFullstackSlide(nodes: TimelineNode[]): PresentationSlide {
  const bullets = nodes.map((n) => {
    // Use the best available content
    const outcome = n.storyOutcome || n.evidenceResult || n.highlights?.[0];
    if (outcome) return `${n.company} · ${n.position}：${outcome}`;
    return `${n.company} · ${n.position}：${n.description?.slice(0, 50) || "核心职责"}`;
  });

  // Extract unique skills/tools mentioned across experiences
  const allSkills = new Set<string>();
  for (const n of nodes) {
    if (n.skills) n.skills.forEach((s) => allSkills.add(s));
  }
  const skillList = [...allSkills];

  // Build feature pills from skills or synthesized
  const featurePills = skillList.length >= 2
    ? chunkInto(skillList, 2).slice(0, 3).map((group) => ({
        label: group.join(" · "),
        variant: "violet" as const,
      }))
    : undefined;

  // Extract industries/domains from company names
  const companies = nodes.map((n) => n.company).filter(Boolean);
  const domainTags = [...new Set(companies)].slice(0, 5);

  const chrono = asChronological(nodes);
  return {
    id: "fullstack",
    kind: "lifecycle",
    title: "覆盖完整的业务生命周期",
    subtitle: "The Full Stack",
    body: `从${chrono[0]?.company || "起点"}到${chrono[chrono.length - 1]?.company || "当前"}，覆盖了业务全链路的关键环节。`,
    bullets,
    visualizations: [{ type: "pipeline", data: { stages: nodes.map((n) => n.company || n.position || "") } }],
    featurePills,
    domainTags: domainTags.length > 0 ? domainTags : undefined,
    speakerNotes: `展示全链路覆盖，共 ${nodes.length} 个关键阶段。`,
    sourceRefs: nodes.map((n) => ({ type: "timeline" as const, id: n.id })),
  };
}

function buildImpactSlide(data: ResumeData, topExperiences: TimelineNode[]): PresentationSlide {
  // Extract quantified results from highlights
  const metrics = extractMetrics(topExperiences);

  // Title: use best metric or synthesize
  let title: string;
  if (metrics.length > 0) {
    title = metrics[0]!;
  } else {
    const years = estimateYears(data.timeline ?? []);
    const parts: string[] = [];
    if (data.timeline && data.timeline.length >= 3) parts.push(`${data.timeline.length} 段核心经历`);
    if (years >= 2) parts.push(`${years} 年深耕`);
    parts.push("持续产出");
    title = parts.join(" · ");
  }

  // Body: best outcomes
  const outcomes = topExperiences
    .filter((e) => e.highlights?.length || e.storyOutcome)
    .map((e) => {
      if (e.storyOutcome) return `${e.company}：${e.storyOutcome}`;
      return `${e.company}：${e.highlights![0]}`;
    });
  const body = outcomes.length > 0
    ? outcomes.slice(0, 3).join("。") + "。"
    : "在多个项目中持续产出可量化的业务价值。";

  // Bullets: quantified achievements
  const bullets: string[] = [];
  for (const exp of topExperiences) {
    const metric = findBestHighlight(exp);
    if (metric) bullets.push(`${exp.company}：${metric}`);
  }
  if (bullets.length === 0) {
    for (const exp of topExperiences) {
      if (exp.highlights?.[0]) bullets.push(`${exp.company}：${exp.highlights[0]}`);
    }
  }
  if (bullets.length === 0) bullets.push("持续交付高质量产品方案");

  // Impact cards from top experiences with story data
  const cardVariants = ["gold", "teal", "violet"] as const;
  const cards = topExperiences.slice(0, 3).map((exp, i) => ({
    title: exp.storyTitle || `${exp.company} · ${exp.position}`,
    body: exp.storyOutcome || exp.evidenceResult || exp.highlights?.[0] || exp.description?.slice(0, 80) || "",
    variant: cardVariants[i % cardVariants.length],
  }));

  return {
    id: "impact",
    kind: "impact",
    title,
    subtitle: "Impact",
    body,
    bullets,
    cards,
    speakerNotes: `量化成果展示。${metrics.length > 0 ? `关键数据：${metrics.join("；")}` : ""}`,
    sourceRefs: topExperiences.map((e) => ({ type: "timeline" as const, id: e.id })),
  };
}

function buildResolutionSlide(
  data: ResumeData,
  name: string,
  title: string,
  oneLine: string,
  timeline: TimelineNode[],
  topExperiences: TimelineNode[],
): PresentationSlide {
  // Use storyReflection if available
  const reflections = topExperiences.map((e) => e.storyReflection).filter(Boolean);
  const body = reflections.length > 0
    ? reflections[0]!
    : oneLine || synthesizeResolutionBody(data, name, title, timeline);

  // Title: career arc (timeline is reverse-chronological, so [0]=latest, [last]=earliest)
  const latest = timeline[0];
  const earliest = timeline[timeline.length - 1];
  let arcTitle: string;
  if (earliest && latest && earliest.company !== latest.company) {
    arcTitle = `从${earliest.company}到${latest.company}：${name}的职业弧线`;
  } else {
    arcTitle = `${name} 的职业弧线：从${earliest?.position || "起点"}到${title}`;
  }

  // Bullets: career pillars from experienceMappings or synthesized
  const bullets = buildResolutionBullets(data, timeline, title);

  // Forward-looking statement
  const plan = data.roleUnderstanding?.ninetyDayPlan;
  const closingParts: string[] = [body];
  if (plan?.day0To30) {
    closingParts.push(`90 天计划：${plan.day0To30} → ${plan.day31To60} → ${plan.day61To90}`);
  }

  // Closing quote: synthesize from career summary
  const companies = [...new Set(timeline.map((n) => n.company))];
  const years = estimateYears(timeline);
  const closingQuote = reflections[0]
    || `${name}在${years} 年的职业生涯中，横跨${companies.join("、")}，完成了从${earliest?.position || "起点"}到${title}的系统性跃迁。`;

  // Narrative thread: build from experience arc
  const narrativeThread = buildNarrativeThread(timeline, topExperiences, title, data);

  return {
    id: "resolution",
    kind: "resolution",
    title: arcTitle,
    subtitle: "The Arc",
    body: closingParts.join("\n\n"),
    bullets,
    visualizations: [{ type: "v-model", data: { allCovered: true } }],
    closingQuote,
    narrativeThread,
    speakerNotes: `收束全文。核心弧线：${arcTitle}。`,
    sourceRefs: [{ type: "profile" }, { type: "roleUnderstanding" }],
  };
}

function synthesizeResolutionBody(_data: ResumeData, name: string, title: string, timeline: TimelineNode[]): string {
  const years = estimateYears(timeline);
  const companies = [...new Set(timeline.map((n) => n.company))];
  return `${name}在${years} 年的职业生涯中，横跨${companies.length} 家企业，在${title}方向形成了完整的方法论和实战验证。`;
}

function buildResolutionBullets(data: ResumeData, timeline: TimelineNode[], title: string): string[] {
  // Use experienceMappings if available
  const mappings = data.roleUnderstanding?.experienceMappings ?? [];
  const realMappings = mappings.filter((m) => m.outcomeEvidence || m.myExperience);
  if (realMappings.length > 0) {
    return realMappings.slice(0, 4).map((m) => {
      if (m.outcomeEvidence) return `${m.requirement}：${m.outcomeEvidence}`;
      return `${m.requirement}：${m.myExperience}`;
    });
  }

  // Synthesize from career data
  const years = estimateYears(timeline);
  const companies = [...new Set(timeline.map((n) => n.company))];
  return [
    `方法论：从${timeline[0]?.company || "一线"}实践中提炼的可复制框架`,
    `验证：${timeline.length} 段经历 · ${years} 年深耕 · ${companies.length} 家企业`,
    `定位：${title}`,
    `目标：${data.roleUnderstanding?.priorityProblems?.[0]?.problem || "持续创造价值"}`,
  ];
}

// ─── Smart Content Extraction ──────────────────────────────────────

/**
 * Build bullets that prioritize quantified/highlighted content.
 * Prefers evidence* > story* > highlights with numbers > first highlights.
 */
function buildSmartBullets(exp: TimelineNode, max: number): string[] {
  const bullets: string[] = [];

  // 1. Evidence chain (strongest)
  if (exp.evidenceProblem) bullets.push(`问题：${exp.evidenceProblem}`);
  if (exp.evidenceAction) bullets.push(`方案：${exp.evidenceAction}`);
  if (exp.evidenceResult) bullets.push(`成果：${exp.evidenceResult}`);
  if (exp.evidenceProof) bullets.push(`验证：${exp.evidenceProof}`);

  // 2. Fill remaining with highlights, preferring those with numbers
  if (bullets.length < max && exp.highlights) {
    const withNumbers = exp.highlights.filter((h) => /\d/.test(h));
    const withoutNumbers = exp.highlights.filter((h) => !/\d/.test(h));
    for (const h of [...withNumbers, ...withoutNumbers]) {
      if (bullets.length >= max) break;
      if (!bullets.some((b) => b.includes(h))) bullets.push(h);
    }
  }

  return bullets;
}

/**
 * Find the highlight with the most impressive metric.
 */
function findBestHighlight(exp: TimelineNode): string | null {
  if (exp.evidenceResult) return exp.evidenceResult;
  if (!exp.highlights || exp.highlights.length === 0) return null;

  // Score highlights by metric quality
  let best = exp.highlights[0]!;
  let bestScore = 0;
  for (const h of exp.highlights) {
    let score = 0;
    if (/\d+%/.test(h)) score += 5; // percentage
    if (/\d+[万亿]/.test(h)) score += 4; // large numbers
    if (/\d+x|\d+倍/.test(h)) score += 4; // multipliers
    if (/\d+/.test(h)) score += 2; // any number
    if (h.length > 10 && h.length < 80) score += 1; // reasonable length
    if (score > bestScore) {
      bestScore = score;
      best = h;
    }
  }
  return best;
}

/**
 * Extract quantified metrics from experiences.
 */
function extractMetrics(experiences: TimelineNode[]): string[] {
  const metrics: string[] = [];
  for (const exp of experiences) {
    if (exp.evidenceResult) {
      metrics.push(exp.evidenceResult);
      continue;
    }
    if (exp.highlights) {
      for (const h of exp.highlights) {
        if (/\d+%|\d+[万亿]|\d+x|\d+倍/.test(h)) {
          metrics.push(h);
          break;
        }
      }
    }
  }
  return metrics;
}

/**
 * Build experience overlay from best available data.
 */
function buildExperienceOverlay(exp: TimelineNode): PresentationOverlay {
  const parts: string[] = [];
  if (exp.storyScene) parts.push(`背景：${exp.storyScene}`);
  if (exp.storyChallenge) parts.push(`挑战：${exp.storyChallenge}`);
  if (exp.storyAction) parts.push(`行动：${exp.storyAction}`);
  if (exp.storyOutcome) parts.push(`结果：${exp.storyOutcome}`);
  if (exp.evidenceResult) parts.push(`数据：${exp.evidenceResult}`);
  if (exp.evidenceProof) parts.push(`验证：${exp.evidenceProof}`);
  if (exp.storyReflection) parts.push(`反思：${exp.storyReflection}`);

  // If no story fields, build from highlights
  if (parts.length === 0 && exp.highlights) {
    parts.push(exp.description || "");
    for (const h of exp.highlights.slice(0, 5)) {
      parts.push(`• ${h}`);
    }
  }

  return {
    id: `ov-${exp.id}-detail`,
    title: exp.storyTitle || `${exp.company} · ${exp.position}`,
    kind: "project-detail",
    body: parts.join("\n") || exp.description || "",
    sourceRefs: [{ type: "timeline", id: exp.id }],
  };
}

// ─── Stats & Helpers ───────────────────────────────────────────────

function buildHeroStats(data: ResumeData): string[] {
  const stats: string[] = [];
  const timeline = data.timeline ?? [];

  // Count with quantified highlights
  const withMetrics = timeline.filter((n) => n.highlights?.some((h) => /\d/.test(h)));
  if (withMetrics.length > 0) {
    stats.push(`${withMetrics.length} 段量化成果经历`);
  } else if (timeline.length > 0) {
    stats.push(`${timeline.length} 段核心经历`);
  }

  // Extract specific metrics from highlights
  for (const exp of timeline) {
    if (stats.length >= 4) break;
    const metric = findBestHighlight(exp);
    if (metric && !stats.some((s) => s.includes(metric.slice(0, 10)))) {
      stats.push(metric.length > 25 ? metric.slice(0, 25) + "…" : metric);
    }
  }

  // Skills count
  const skills = data.skills ?? [];
  if (skills.length > 0 && stats.length < 4) stats.push(`${skills.length} 项专业技能`);

  // Education
  const edu = data.education?.[0];
  if (edu?.school && stats.length < 4) stats.push(edu.school);

  // Target role
  if (data.roleUnderstanding?.targetRoleTitle && stats.length < 4) {
    stats.push(`目标：${data.roleUnderstanding.targetRoleTitle}`);
  }

  return stats.filter(Boolean);
}

function pickTopExperiences(timeline: TimelineNode[], count: number): TimelineNode[] {
  return [...timeline]
    .sort((a, b) => scoreExperience(b) - scoreExperience(a))
    .slice(0, count);
}

function scoreExperience(node: TimelineNode): number {
  let score = 0;
  // Story fields (from interview prep)
  if (node.storyTitle) score += 2;
  if (node.storyOutcome) score += 3;
  if (node.storyChallenge) score += 2;
  if (node.storyAction) score += 2;
  if (node.storyReflection) score += 1;
  // Evidence fields
  if (node.evidenceResult) score += 3;
  if (node.evidenceProof) score += 2;
  if (node.evidenceStrength === "strong") score += 2;
  // Promotion stages
  if (node.promotionStages && node.promotionStages.length > 1) score += 2;
  // Highlights quality
  if (node.highlights) {
    score += node.highlights.length;
    // Bonus for quantified highlights
    for (const h of node.highlights) {
      if (/\d+%|\d+[万亿]|\d+x/.test(h)) score += 2;
    }
  }
  return score;
}

function extractSkillTags(data: ResumeData): string[] {
  const skills = data.skills ?? [];
  return skills
    .filter((s) => s.level >= 3)
    .sort((a, b) => b.level - a.level)
    .map((s) => s.name)
    .slice(0, 8);
}

function estimateYears(timeline: TimelineNode[]): number {
  if (timeline.length === 0) return 0;
  const dates = timeline
    .flatMap((n) => {
      const start = n.startDate ? new Date(n.startDate).getTime() : 0;
      const end = n.endDate ? new Date(n.endDate).getTime() : Date.now();
      return [start, end];
    })
    .filter((d) => d > 0);
  if (dates.length < 2) return 1;
  return Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / (365.25 * 24 * 60 * 60 * 1000)));
}

/**
 * Build highlight callout boxes from an experience's best story/evidence fields.
 */
function buildHighlightCallouts(exp: TimelineNode): { title: string; body: string; variant: "gold" | "teal" | "violet" }[] {
  const callouts: { title: string; body: string; variant: "gold" | "teal" | "violet" }[] = [];

  if (exp.evidenceProblem || exp.storyChallenge) {
    callouts.push({
      title: "核心挑战",
      body: exp.evidenceProblem || exp.storyChallenge || "",
      variant: "gold",
    });
  }
  if (exp.evidenceAction || exp.storyAction) {
    callouts.push({
      title: "关键行动",
      body: exp.evidenceAction || exp.storyAction || "",
      variant: "teal",
    });
  }
  if (exp.evidenceResult || exp.storyOutcome) {
    callouts.push({
      title: "成果与验证",
      body: exp.evidenceResult || exp.storyOutcome || "",
      variant: "violet",
    });
  }

  // Ensure at least one callout if we have highlights
  if (callouts.length === 0 && exp.highlights && exp.highlights.length > 0) {
    callouts.push({
      title: "核心成果",
      body: exp.highlights.slice(0, 3).join("。") + "。",
      variant: "gold",
    });
  }

  return callouts.slice(0, 2);
}

/**
 * Extract keyword tags from an experience for the summary line.
 */
function extractKeywords(exp: TimelineNode): string {
  const keywords: string[] = [];

  // From skills
  if (exp.skills && exp.skills.length > 0) {
    keywords.push(...exp.skills.slice(0, 3));
  }

  // Extract from highlights (look for key terms)
  if (exp.highlights) {
    for (const h of exp.highlights) {
      if (keywords.length >= 4) break;
      // Look for quoted terms or specific keywords
      const quoted = h.match(/「([^」]+)」|"([^"]+)"|'([^']+)'/g);
      if (quoted) {
        for (const q of quoted) {
          const clean = q.replace(/[「」"']/g, "");
          if (!keywords.includes(clean) && clean.length <= 10) keywords.push(clean);
        }
      }
    }
  }

  // From position (extract key role terms)
  if (exp.position) {
    const roleTerms = exp.position.split(/[·、/]/).map((s) => s.trim()).filter(Boolean);
    for (const t of roleTerms) {
      if (keywords.length >= 4) break;
      if (!keywords.includes(t) && t.length <= 8) keywords.push(t);
    }
  }

  return keywords.length > 0 ? keywords.slice(0, 4).join(" · ") : exp.position || "";
}

/**
 * Build narrative thread for resolution slide from career arc.
 */
function buildNarrativeThread(
  timeline: TimelineNode[],
  topExperiences: TimelineNode[],
  title: string,
  data: ResumeData,
): string {
  const parts: string[] = [];
  const chrono = asChronological(timeline);

  // Starting point (oldest first)
  const earliest = chrono[0];
  if (earliest) {
    parts.push(`${earliest.company}${earliest.position ? ` · ${earliest.position}` : ""}建立行业认知`);
  }

  // Key transitions
  const companies = [...new Set(chrono.map((n) => n.company))];
  if (companies.length >= 2) {
    parts.push(`横跨${companies.length} 家企业积累方法论`);
  }

  // Top experience highlights
  for (const exp of topExperiences.slice(0, 2)) {
    if (exp.storyOutcome) {
      parts.push(`${exp.company}完成${exp.storyOutcome.slice(0, 30)}`);
    } else if (exp.highlights?.[0]) {
      parts.push(`${exp.company}：${exp.highlights[0].slice(0, 30)}`);
    }
  }

  // Target
  const target = data.roleUnderstanding?.targetRoleTitle || title;
  parts.push(`目标：${target}`);

  return parts.join(" → ");
}

function chunkInto<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Build a flattened summary of ResumeData for LLM prompt consumption.
 * Returns ~2-4KB of structured text — not raw JSON.
 */
export function buildResumeDataSummary(data: ResumeData): string {
  const parts: string[] = [];

  parts.push(`姓名: ${data.profile.name || "未填写"}`);
  if (data.profile.title) parts.push(`当前职位: ${data.profile.title}`);
  if (data.profile.summary) parts.push(`个人简介: ${data.profile.summary.slice(0, 200)}`);

  const targetRole = data.roleUnderstanding?.targetRoleTitle;
  if (targetRole) {
    parts.push(`目标岗位: ${targetRole}`);
    if (data.roleUnderstanding?.oneLineInterpretation) {
      parts.push(`岗位解读: ${data.roleUnderstanding.oneLineInterpretation}`);
    }
  }

  // Timeline with key highlights
  const timeline = data.timeline ?? [];
  if (timeline.length > 0) {
    parts.push(`\n工作经历 (${timeline.length} 段):`);
    for (const node of timeline) {
      const date = [node.startDate, node.endDate].filter(Boolean).join(" — ") || "时间未填";
      const role = [node.company, node.position].filter(Boolean).join(" · ") || "未知";
      parts.push(`  ${date} | ${role}`);
      if (node.description) parts.push(`    描述: ${node.description.slice(0, 150)}`);
      if (node.highlights && node.highlights.length > 0) {
        for (const h of node.highlights.slice(0, 3)) parts.push(`    成果: ${h.slice(0, 120)}`);
      }
      if (node.storyTitle) parts.push(`    故事标题: ${node.storyTitle}`);
      if (node.storyOutcome) parts.push(`    故事结果: ${node.storyOutcome.slice(0, 150)}`);
    }
  }

  // Skills
  const skills = data.skills ?? [];
  if (skills.length > 0) {
    const top = skills.filter((s) => s.level >= 3).sort((a, b) => b.level - a.level).slice(0, 8);
    parts.push(`\n核心技能: ${top.map((s) => s.name).join("、")}`);
  }

  // Education
  const edu = data.education?.[0];
  if (edu?.school) parts.push(`教育: ${edu.school}${edu.degree ? ` · ${edu.degree}` : ""}`);

  // Priority problems
  const problems = data.roleUnderstanding?.priorityProblems ?? [];
  if (problems.length > 0) {
    parts.push(`\n核心问题 (${problems.length} 个):`);
    for (const p of problems.slice(0, 3)) {
      parts.push(`  - ${p.problem}${p.impact ? ` (影响: ${p.impact})` : ""}`);
    }
  }

  // Experience mappings
  const mappings = data.roleUnderstanding?.experienceMappings ?? [];
  if (mappings.length > 0) {
    parts.push(`\n经历映射 (${mappings.length} 条):`);
    for (const m of mappings.slice(0, 4)) {
      parts.push(`  - ${m.requirement}: ${m.myExperience?.slice(0, 100) ?? ""}`);
    }
  }

  return parts.join("\n");
}
