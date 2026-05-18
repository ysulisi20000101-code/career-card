import type { ResumeData, TimelineNode } from "@/types";
import type {
  DiagramSpec,
  DomainPreset,
  InterviewNarrativeProfile,
  InterviewStoryBlueprint,
  OverlaySpec,
  PresentationDraft,
  PresentationOverlay,
  PresentationSlide,
  VisualizationSpec,
} from "./types";

const THEME_TOKENS = {
  bg: "#f8f6f1",
  surface: "#ffffff",
  text: "#2f2d29",
  gold: "#a07018",
  teal: "#1a7d62",
  violet: "#6b5ea0",
  blue: "#3d7fb8",
  rose: "#b85d6a",
  green: "#4a8a5a",
  cyan: "#318a94",
};

const ENTERPRISE_AGENT_KEYWORDS = [
  "AI Agent",
  "Agent",
  "RAG",
  "Groot-Arch",
  "MBSE",
  "SysML",
  "UML",
  "SOME/IP",
  "ARXML",
  "ROS2",
  "DOORS",
  "PREEvision",
  "SystemWeaver",
  "CANdelaStudio",
  "CANdb++",
  "VDE",
  "汽车",
  "军工",
  "航天",
  "架构",
  "工具链",
  "知识库",
  "受控",
  "一致性",
  "仿真",
  "DevOps",
];

const ENTERPRISE_AGENT_PRESET: DomainPreset = {
  id: "enterprise-ai-agent-mbse",
  label: "企业级 AI Agent + 汽车电子架构/MBSE 工具链",
  matchKeywords: ENTERPRISE_AGENT_KEYWORDS,
  minKeywordHits: 7,
  buildBlueprint: buildEnterpriseAgentBlueprint,
};

const DOMAIN_PRESETS: DomainPreset[] = [ENTERPRISE_AGENT_PRESET];

function collectResumeCorpus(data: ResumeData): string {
  const parts: string[] = [
    data.profile.name,
    data.profile.title,
    data.profile.summary,
    data.roleUnderstanding?.targetRoleTitle,
    data.roleUnderstanding?.oneLineInterpretation,
    data.roleUnderstanding?.companyContext,
    ...(data.skills ?? []).map((s) => `${s.name} ${s.category}`),
    ...(data.education ?? []).flatMap((e) => [e.school, e.degree, e.major]),
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  for (const node of data.timeline ?? []) {
    parts.push(
      node.company,
      node.position,
      node.description,
      ...(node.highlights ?? []),
      ...(node.skills ?? []),
      node.storyTitle ?? "",
      node.storyScene ?? "",
      node.storyChallenge ?? "",
      node.storyAction ?? "",
      node.storyOutcome ?? "",
      node.storyReflection ?? "",
      node.evidenceProblem ?? "",
      node.evidenceAction ?? "",
      node.evidenceResult ?? "",
      node.evidenceProof ?? "",
      ...(node.promotionStages ?? []).flatMap((s) => [
        s.title,
        s.period,
        s.teamScale,
        s.responsibility,
        s.outcome,
        s.reflection,
      ]),
    );
  }

  for (const problem of data.roleUnderstanding?.priorityProblems ?? []) {
    parts.push(problem.problem, problem.impact, problem.evidence ?? "");
  }

  for (const mapping of data.roleUnderstanding?.experienceMappings ?? []) {
    parts.push(mapping.requirement, mapping.myExperience, mapping.outcomeEvidence);
  }

  return parts.join("\n");
}

function countKeywordHits(corpus: string, keywords: string[]): { hits: number; matched: string[] } {
  const matched = keywords.filter((keyword) => corpus.toLowerCase().includes(keyword.toLowerCase()));
  return { hits: matched.length, matched };
}

function choosePreset(corpus: string): { preset: DomainPreset | null; confidence: number; matched: string[] } {
  let best: { preset: DomainPreset | null; confidence: number; matched: string[] } = {
    preset: null,
    confidence: 0,
    matched: [],
  };

  for (const preset of DOMAIN_PRESETS) {
    const { hits, matched } = countKeywordHits(corpus, preset.matchKeywords);
    const confidence = Math.min(1, hits / Math.max(preset.minKeywordHits, 1));
    if (hits >= preset.minKeywordHits && confidence > best.confidence) {
      best = { preset, confidence, matched };
    }
  }

  return best;
}

function extractEvidencePhrases(corpus: string): string[] {
  const preferred = [
    "5 Agent",
    "5 个 Agent",
    "RAG",
    "Groot-Arch",
    "工信部",
    "SOME/IP",
    "ARXML",
    "ROS2",
    "UML",
    "SysML",
    "DOORS",
    "PREEvision",
    "SystemWeaver",
    "CANdelaStudio",
    "CANdb++",
    "VDE",
  ];
  const phrases = preferred.filter((phrase) => corpus.includes(phrase));

  const evidenceSentences = corpus
    .split(/[\n，,、。；;.!！?？]+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const metricEvidenceRe = /\d+\s*(?:%|\+)?|\d+\s*(?:人|个|家|项|类|年|倍)/;
  const semanticRe = /效率|提升|提效|节省|缩短|减少|团队|管理|协同|带领|客户|项目|售前|投标|交付|验证|用户|研发|Agent/i;
  for (const sentence of evidenceSentences) {
    if (metricEvidenceRe.test(sentence) && semanticRe.test(sentence) && !phrases.includes(sentence)) {
      phrases.push(sentence);
    }
  }
  return phrases.slice(0, 32);
}

function latestFulltime(data: ResumeData): TimelineNode | undefined {
  return (data.timeline ?? []).find((node) => node.careerKind !== "internship") ?? data.timeline?.[0];
}

function earliestExperiences(data: ResumeData): TimelineNode[] {
  return [...(data.timeline ?? [])]
    .reverse()
    .filter((node) => node.careerKind === "internship" || /实习|intern/i.test(node.position))
    .slice(0, 3);
}

function pickText(values: Array<string | undefined>, fallback: string): string {
  return values.find((value) => value && value.trim().length > 0)?.trim() ?? fallback;
}

function hasMetric(profile: InterviewNarrativeProfile, token: string): boolean {
  return (profile.metrics ?? []).some((metric) => metric.includes(token));
}

export interface ClassifiedInterviewMetrics {
  teamSize?: string;
  users?: string;
  customersProjects?: string;
  efficiency?: string;
  agents?: string;
}

function normalizeMetricLabel(metric: string, kind: keyof ClassifiedInterviewMetrics): string {
  const compact = metric.replace(/\s+/g, " ").trim();
  const number = compact.match(/(?:约|近|超过|超)?\s*\d+\s*(?:\+|%|人|个|家|项)?/)?.[0]?.replace(/\s+/g, " ").trim();
  if (!number) return compact;
  if (kind === "teamSize") return `${number.includes("人") ? number : `${number} 人`}产品团队`.replace(/人人/, "人");
  if (kind === "users") return `${number.includes("用户") ? number : `${number} 用户/研发协同覆盖`}`;
  if (kind === "customersProjects") {
    const normalized = number.includes("+") ? number : number.replace(/(?:个|家|项)?$/, "");
    return `${normalized} 个客户/项目`.replace("+ 个", "+ ");
  }
  if (kind === "agents") return `${number.includes("个") ? number : `${number} 个`} Agent 场景`.replace(/个 个/, "个");
  return compact;
}

export function classifyMetrics(profile: Pick<InterviewNarrativeProfile, "metrics">): ClassifiedInterviewMetrics {
  const metrics = profile.metrics ?? [];
  const findMetric = (predicate: (metric: string) => boolean) => metrics.find(predicate);
  const teamSize = findMetric((metric) =>
    /(?:团队|管理|协同|带领|产品团队)/.test(metric) && /(?:约|近|超过|超)?\s*\d+\s*(?:人|个)?/.test(metric),
  );
  const users = findMetric((metric) =>
    /(?:用户|研发)/.test(metric) && /(?:约|近|超过|超)?\s*\d+\s*\+?/.test(metric),
  );
  const customersProjects = findMetric((metric) =>
    /(?:客户|项目|售前|投标|交付|验证)/.test(metric) && /(?:约|近|超过|超)?\s*\d+\s*\+?/.test(metric) && !/(?:人|团队|用户|研发)/.test(metric),
  ) ?? findMetric((metric) =>
    /(?:客户|项目|售前|投标|交付|验证)/.test(metric) && /(?:约|近|超过|超)?\s*\d+\s*\+?/.test(metric),
  );
  const efficiencyMetrics = metrics
    .filter((metric) => /(?:效率|提升|提效|节省|缩短|减少)/.test(metric) && /\d+\s*%/.test(metric))
    .flatMap((metric) => metric.match(/\d+\s*%\+?/g) ?? []);
  const agents = findMetric((metric) => /(?:^|[^\d])5\s*(?:个\s*)?Agent|五\s*个?\s*Agent|5\s*个\s*Agent/.test(metric));

  return {
    teamSize: teamSize ? normalizeMetricLabel(teamSize, "teamSize") : undefined,
    users: users ? normalizeMetricLabel(users, "users") : undefined,
    customersProjects: customersProjects ? normalizeMetricLabel(customersProjects, "customersProjects") : undefined,
    efficiency: efficiencyMetrics.length > 0 ? [...new Set(efficiencyMetrics)].join(" / ") : undefined,
    agents: agents ? normalizeMetricLabel(agents, "agents") : undefined,
  };
}

const FOUNDATION_FORBIDDEN_RE = /汽车电子|工具链|Agent|MBSE|Groot-Arch|RAG|SysML|UML|PREEvision|DOORS|SystemWeaver|SOME\/IP|ARXML|ROS2/i;
const FOUNDATION_TAKEAWAYS = [
  "业务理解 / 用户问题 / 后台系统",
  "需求拆解 / 问答场景 / 结构化表达",
  "商业判断 / 用户产品 / 跨团队沟通",
];

function sanitizeFoundationTakeaway(text: string | undefined): string {
  const value = text?.trim();
  if (!value || FOUNDATION_FORBIDDEN_RE.test(value)) return "把业务问题转成产品判断";
  return value;
}

function internshipScopeTerms(data: ResumeData): string[] {
  return earliestExperiences(data)
    .flatMap((node) => [node.company, node.position])
    .filter((term): term is string => Boolean(term && term.trim().length > 1));
}

export function sanitizeInternshipScope(
  slideId: string,
  text: string | undefined,
  data?: ResumeData,
): string | undefined {
  if (!text || slideId === "foundation") return text;
  const terms = ["实习", "实习生", "互联网医院产品部", "后台产品实习生", "产品设计部", ...(data ? internshipScopeTerms(data) : [])]
    .filter(Boolean)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (terms.length === 0) return text;
  const re = new RegExp(terms.join("|"), "i");
  if (!re.test(text)) return text;
  const cleaned = text
    .split(/\n+/)
    .filter((line) => !re.test(line))
    .join("\n")
    .trim();
  return cleaned || undefined;
}

function enforceInternshipScope(slides: PresentationSlide[], data: ResumeData): void {
  for (const slide of slides) {
    if (slide.id === "foundation") continue;
    slide.title = sanitizeInternshipScope(slide.id, slide.title, data) ?? slide.title;
    slide.subtitle = sanitizeInternshipScope(slide.id, slide.subtitle, data);
    slide.body = sanitizeInternshipScope(slide.id, slide.body, data) ?? slide.body;
    slide.summaryLine = sanitizeInternshipScope(slide.id, slide.summaryLine, data);
    slide.closingQuote = sanitizeInternshipScope(slide.id, slide.closingQuote, data);
    slide.narrativeThread = sanitizeInternshipScope(slide.id, slide.narrativeThread, data);
    slide.speakerNotes = sanitizeInternshipScope(slide.id, slide.speakerNotes, data);
    slide.bullets = slide.bullets
      ?.map((bullet) => sanitizeInternshipScope(slide.id, bullet, data))
      .filter((bullet): bullet is string => Boolean(bullet));
    slide.highlightCallouts = slide.highlightCallouts?.map((callout) => ({
      ...callout,
      title: sanitizeInternshipScope(slide.id, callout.title, data) ?? callout.title,
      body: sanitizeInternshipScope(slide.id, callout.body, data) ?? callout.body,
    }));
    slide.cards = slide.cards?.map((card) => ({
      ...card,
      title: sanitizeInternshipScope(slide.id, card.title, data) ?? card.title,
      body: sanitizeInternshipScope(slide.id, card.body, data) ?? card.body,
    }));
  }
}

function skillNames(data: ResumeData): string[] {
  return (data.skills ?? [])
    .filter((skill) => skill.level >= 3)
    .sort((a, b) => b.level - a.level)
    .map((skill) => skill.name)
    .slice(0, 8);
}

export function buildInterviewNarrativeProfile(data: ResumeData): InterviewNarrativeProfile {
  const corpus = collectResumeCorpus(data);
  const selected = choosePreset(corpus);
  const targetRole = pickText(
    [data.roleUnderstanding?.targetRoleTitle, data.profile.title],
    "目标岗位",
  );
  const candidateName = data.profile.name || "候选人";
  const latest = latestFulltime(data);
  const metrics = extractEvidencePhrases(corpus);
  const classifiedMetrics = classifyMetrics({ metrics });
  const capabilities = [
    ...new Set([
      ...skillNames(data),
      ...(selected.matched.includes("Agent") ? ["受控 Agent 工作流"] : []),
      ...(selected.matched.includes("RAG") ? ["RAG 知识库"] : []),
      ...(selected.matched.includes("工具链") || selected.matched.includes("架构") ? ["平台化工具链"] : []),
      ...(data.roleUnderstanding?.experienceMappings ?? []).map((m) => m.requirement),
    ]),
  ].filter(Boolean).slice(0, 8);

  return {
    presetId: selected.preset?.id ?? "generic-interview-story",
    confidence: selected.confidence,
    candidateName,
    targetRole,
    positioning: pickText(
      [
        data.roleUnderstanding?.oneLineInterpretation,
        latest ? `${latest.position}，来自 ${latest.company} 的关键项目经验` : undefined,
        data.profile.summary,
      ],
      `${candidateName} 的产品主线`,
    ),
    domainContext: selected.matched.slice(0, 12),
    evidenceKeywords: selected.matched,
    metrics,
    classifiedMetrics,
    transferableCapabilities: capabilities,
    riskNotes: [
      "所有公司、项目、指标、工具名必须来自简历或用户确认输入。",
      "领域 preset 只在证据命中时启用，不能向通用简历泄漏专属行业内容。",
    ],
  };
}

export function buildInterviewStoryBlueprint(
  data: ResumeData,
  profile: InterviewNarrativeProfile = buildInterviewNarrativeProfile(data),
): InterviewStoryBlueprint {
  const preset = DOMAIN_PRESETS.find((item) => item.id === profile.presetId);
  return preset?.buildBlueprint(profile) ?? buildGenericBlueprint(profile);
}

function baseArc(): InterviewStoryBlueprint["slideArc"] {
  return [
    { id: "hero", beat: "定位", objective: "用一句话和一张架构图建立候选人的目标岗位定位。", visualizationType: "hero-architecture", overlayIds: ["ov-arch-detail"] },
    { id: "foundation", beat: "底座", objective: "把早期经历压缩成可迁移能力，而不是流水账。" },
    { id: "tension", beat: "矛盾", objective: "展示行业/业务系统的断点，作为后续跃迁的动因。", visualizationType: "v-model", overlayIds: ["ov-conflict-types"] },
    { id: "platform-build", beat: "平台", objective: "解释为什么必须先做结构化平台和数据底座。", visualizationType: "platform-quadrants", overlayIds: ["ov-platform"] },
    { id: "agent-leap", beat: "跃迁", objective: "把 Agent 从聊天框拉回可控工作流、工具调用和知识库。", visualizationType: "agent-workflow", overlayIds: ["ov-agent-workflow", "ov-rag-detail", "ov-conflict-types"] },
    { id: "fullstack", beat: "全链路", objective: "把单点项目扩展成完整产品系统。", visualizationType: "pipeline" },
    { id: "impact", beat: "结果", objective: "用指标、客户、用户或交付结果证明价值。", visualizationType: "impact-metrics" },
    { id: "resolution", beat: "闭环", objective: "回扣第 3 页的系统矛盾，形成个人品牌陈述。", visualizationType: "v-model" },
  ];
}

function buildGenericBlueprint(profile: InterviewNarrativeProfile): InterviewStoryBlueprint {
  return {
    version: 1,
    presetId: "generic-interview-story",
    title: `${profile.candidateName} · 产品叙事蓝图`,
    slideArc: baseArc(),
    themeTokens: THEME_TOKENS,
    diagrams: {
      hero: { type: "hero-architecture", data: genericHeroArchitecture(profile) },
      tension: { type: "v-model", data: genericVModel(false) },
      lifecycle: { type: "pipeline", data: genericPipeline(profile) },
      resolution: { type: "v-model", data: genericVModel(true) },
    },
    overlays: [],
  };
}

function buildEnterpriseAgentBlueprint(profile: InterviewNarrativeProfile): InterviewStoryBlueprint {
  return {
    version: 1,
    presetId: ENTERPRISE_AGENT_PRESET.id,
    title: `${profile.candidateName} · Agent 产品叙事蓝图`,
    slideArc: baseArc(),
    themeTokens: THEME_TOKENS,
    diagrams: {
      hero: { type: "hero-architecture", data: enterpriseHeroArchitecture() },
      tension: { type: "v-model", data: enterpriseVModel("monopoly") },
      lifecycle: { type: "pipeline", data: enterprisePipeline() },
      resolution: { type: "v-model", data: enterpriseVModel("complete") },
      agentLeap: { type: "agent-workflow", data: enterpriseAgentWorkflow(profile) },
      impact: { type: "impact-metrics", data: enterpriseImpactMetrics(profile) },
    },
    overlays: enterpriseOverlays(),
  };
}

function genericHeroArchitecture(profile: InterviewNarrativeProfile): Record<string, unknown> {
  const capabilities = profile.transferableCapabilities.length > 0
    ? profile.transferableCapabilities
    : ["问题定义", "产品设计", "协同推进", "数据验证", "商业落地"];
  return {
    agents: capabilities.slice(0, 5).map((name, index) => ({
      name,
      subtitle: ["定位", "设计", "推进", "验证", "复盘"][index] ?? "能力",
      color: ["#6b5ea0", "#3d7fb8", "#1a7d62", "#a07018", "#b85d6a"][index] ?? "#6b5ea0",
    })),
    ragLabel: "证据库 / 经验复用层",
    ragSubtitle: "简历事实、项目证据、目标岗位统一沉淀",
    ragBlocks: ["经历证据", "能力标签", "指标沉淀", "表达复用"],
    toolchainLabel: "产品方法链路",
    toolchainSubtitle: "问题识别 -> 方案设计 -> 交付验证 -> 商业复盘",
    toolchainBlocks: ["问题", "方案", "协同", "验证", "结果"].map((name, index) => ({
      name,
      subtitle: ["定义", "设计", "推进", "评估", "沉淀"][index],
      color: ["#a07018", "#b85d6a", "#318a94", "#4a8a5a", "#6b5ea0"][index],
    })),
  };
}

function genericVModel(complete: boolean): Record<string, unknown> {
  const designNodes = [
    { name: "问题定义", tool: complete ? "统一目标 / 证据闭环" : "多方口径分散" },
    { name: "方案设计", tool: complete ? "结构化方案 / 优先级明确" : "需求与方案割裂" },
    { name: "协同推进", tool: complete ? "跨团队节奏统一" : "协作链路断点" },
    { name: "交付验证", tool: complete ? "指标驱动验收" : "结果反馈滞后" },
  ];
  const testNodes = [
    { name: "用户反馈", tool: complete ? "持续回流" : "零散收集", color: complete ? "#6b5ea0" : undefined },
    { name: "业务指标", tool: complete ? "持续观测" : "事后统计", color: complete ? "#1a7d62" : undefined },
    { name: "复盘沉淀", tool: complete ? "可复用方法库" : "依赖个人经验", color: complete ? "#318a94" : undefined },
  ];
  return {
    variant: complete ? "complete" : "monopoly",
    designNodes,
    testNodes,
    platformName: complete ? "结构化产品方法平台" : "待补齐的协同底座",
    platformSubtitle: complete ? "证据 / 方法 / 指标统一沉淀" : "目标、方案、数据仍未完全打通",
    caption: complete ? "After：把经验转成可复用系统。" : "Before：真实问题不是单点能力，而是系统链路断点。",
  };
}

function genericPipeline(profile: InterviewNarrativeProfile): Record<string, unknown> {
  const items = profile.transferableCapabilities.slice(0, 5);
  const names = items.length >= 5 ? items : ["识别问题", "设计方案", "推动协同", "验证结果", "沉淀方法"];
  return {
    stages: names.slice(0, 5).map((name, index) => ({
      name,
      subtitle: ["输入", "方案", "执行", "验证", "复用"][index],
      bullets: ["关键动作", "证据输出"],
      agentNote: "表达证据",
      color: ["#a07018", "#b85d6a", "#318a94", "#4a8a5a", "#6b5ea0"][index],
    })),
    agentLayerLabel: "结构化叙事",
    ragLabel: "Resume Evidence",
    ragSubtitle: "只使用简历和确认事实",
  };
}

function enterpriseHeroArchitecture(): Record<string, unknown> {
  return {
    agents: [
      { name: "文档生成", subtitle: "FDS/SSTS 初稿", color: "#6b5ea0" },
      { name: "模型生成", subtitle: "UML/SysML 草稿", color: "#3d7fb8" },
      { name: "一致性校验", subtitle: "冲突场景检测", color: "#1a7d62" },
      { name: "方案推荐", subtitle: "历史案例匹配", color: "#a07018" },
      { name: "知识检索", subtitle: "RAG 跨项目搜索", color: "#b85d6a" },
    ],
    ragLabel: "RAG 知识库 / 数据底座",
    ragSubtitle: "私有化部署，沉淀项目文档、架构模型、设计规范与历史方案",
    ragBlocks: ["文档预处理", "向量嵌入", "语义检索", "知识复用"],
    toolchainLabel: "一体化工具链 / 数据源头",
    toolchainSubtitle: "各阶段产出结构化数据，沉淀至知识库",
    toolchainBlocks: [
      { name: "Groot-Arch", subtitle: "架构设计", color: "#a07018" },
      { name: "服务编排", subtitle: "组合服务", color: "#b85d6a" },
      { name: "服务仿真", subtitle: "验证测试", color: "#318a94" },
      { name: "DevOps", subtitle: "持续交付", color: "#4a8a5a" },
      { name: "观测运维", subtitle: "监控诊断", color: "#6b5ea0" },
    ],
  };
}

function enterpriseVModel(variant: "monopoly" | "complete"): Record<string, unknown> {
  const complete = variant === "complete";
  return {
    variant,
    designNodes: complete
      ? [
          { name: "需求管理", tool: "Groot-Arch / Web 协同 / AI 文档生成", domestic: true },
          { name: "功能设计", tool: "Groot-Arch / Web 协同 / AI 模型生成", domestic: true },
          { name: "系统设计", tool: "Groot-Arch / Web 协同 / AI 方案推荐", domestic: true },
          { name: "软件设计", tool: "Groot-Arch / Web 协同 / AI 一致性校验", domestic: true },
          { name: "通信设计", tool: "VDE Cloud / SOME-IP / AI 辅助配置", domestic: true },
          { name: "诊断设计", tool: "诊断参数系统 / AI 辅助配置", domestic: true },
        ]
      : [
          { name: "需求管理", tool: "IBM DOORS / Siemens Polarion" },
          { name: "功能设计", tool: "Sparx EA / PREEvision" },
          { name: "系统设计", tool: "PREEvision / SystemWeaver" },
          { name: "软件设计", tool: "EA / PREEvision" },
          { name: "通信设计", tool: "CANdb++ 桌面单机", domestic: true },
          { name: "诊断设计", tool: "CANdelaStudio 桌面单机", domestic: true },
        ],
    testNodes: complete
      ? [
          { name: "仿真验证", tool: "服务仿真 / Agent 赋能规划", color: "#318a94" },
          { name: "验收测试", tool: "Agent 赋能进行中", color: "#6b5ea0" },
          { name: "系统测试", tool: "Agent 赋能进行中", color: "#6b5ea0" },
          { name: "集成测试", tool: "Agent 赋能进行中", color: "#6b5ea0" },
          { name: "部件测试", tool: "Agent 赋能进行中", color: "#6b5ea0" },
        ]
      : [
          { name: "仿真验证", tool: "HIL / SIL / 服务仿真", color: "#318a94" },
          { name: "验收测试", tool: "CANoe / Indigo" },
          { name: "系统测试", tool: "CANoe / dSPACE" },
          { name: "集成测试", tool: "CANoe / TSMaster" },
          { name: "部件测试", tool: "CANoe.DiVa" },
        ],
    platformName: complete ? "Groot-Arch 架构协同平台" : "架构协同平台缺口",
    platformSubtitle: complete
      ? "云原生 / Agent / RAG 知识库 / 统一数据模型"
      : "海外桌面工具主导 / 单机割裂 / 缺少统一数据模型",
    designLabel: complete ? "设计域：平台化覆盖 + AI Agent 增强" : "设计域：工具割裂",
    testLabel: complete ? "测试域：Agent 赋能进行中" : "测试域：验证链路后置",
    caption: complete
      ? "After：从工具替代走向平台、知识库和 Agent 协同。"
      : "Before：真正的矛盾不是缺工具，而是架构数据没有统一沉淀。",
  };
}

function enterprisePipeline(): Record<string, unknown> {
  return {
    stages: [
      { name: "Groot-Arch", subtitle: "架构设计", bullets: ["需求/功能/系统/软件", "统一模型源头"], agentNote: "文档/模型生成", color: "#a07018" },
      { name: "服务编排", subtitle: "服务组合", bullets: ["接口与依赖", "流程编排"], agentNote: "方案推荐", color: "#b85d6a" },
      { name: "服务仿真", subtitle: "验证闭环", bullets: ["SIL/HIL 场景", "一致性校验"], agentNote: "冲突检测", color: "#318a94" },
      { name: "DevOps", subtitle: "持续交付", bullets: ["流水线", "版本治理"], agentNote: "发布辅助", color: "#4a8a5a" },
      { name: "观测运维", subtitle: "运行反馈", bullets: ["监控诊断", "经验沉淀"], agentNote: "知识复用", color: "#6b5ea0" },
    ],
    agentLayerLabel: "AI Agent 层：任务规划 / 工具调用 / 多步执行 / 人工确认",
    ragLabel: "RAG 知识库",
    ragSubtitle: "项目文档、架构模型、设计规范、历史方案",
    embodiedLabel: "端侧 / 具身 / 设备监控",
    embodiedSubtitle: "从设计态延伸到运行态",
  };
}

function enterpriseAgentWorkflow(profile: InterviewNarrativeProfile): Record<string, unknown> {
  return {
    agents: [
      { name: "文档生成 Agent", scene: "FDS/SSTS 初稿自动生成", metric: hasMetric(profile, "50") ? "效率提升 50%+" : "文档效率提升", color: "#6b5ea0", icon: "doc" },
      { name: "模型生成 Agent", scene: "UML/SysML 草稿生成", metric: "模型生成提效", color: "#3d7fb8", icon: "model" },
      { name: "一致性校验 Agent", scene: "跨文档/模型自动校验", metric: "冲突场景检测", color: "#1a7d62", icon: "check" },
      { name: "方案推荐 Agent", scene: "历史项目方案匹配", metric: "经验可检索复用", color: "#a07018", icon: "search" },
      { name: "知识检索 Agent", scene: "跨项目知识统一检索", metric: "RAG 私有化部署", color: "#b85d6a", icon: "settings" },
    ],
    workflowLabel: "受控 Agent 工作流",
    workflowSteps: ["任务规划", "工具调用", "多步执行", "状态管理", "人工确认", "结果归档"],
    conflictLabel: "7 类冲突场景",
    conflictTypes: ["功能触发", "执行时序", "网络通信", "供电功耗", "功能安全", "多域协同", "定义完整性"],
    ragBlocks: [
      { title: "数据层", items: "项目文档 / 架构模型\n设计规范 / 历史方案" },
      { title: "处理层", items: "文档解析 / 语义切分\n向量嵌入 / 增量更新" },
      { title: "检索层", items: "向量语义检索\n证据召回与排序", highlighted: true },
      { title: "应用层", items: "Agent 调用\n合规校验 / 知识问答" },
    ],
    ragFooter: "私有化部署 / 军工航天合规 / 跨项目知识复用",
    strategyInsight: "不做 ChatGPT 套壳。Agent 有效性取决于知识库质量，知识库质量取决于平台数据结构化程度。",
  };
}

function enterpriseImpactMetrics(profile: InterviewNarrativeProfile): Record<string, unknown> {
  const metrics = profile.classifiedMetrics ?? classifyMetrics(profile);
  const customerProof = metrics.customersProjects ?? "10+ 客户/项目";
  const userProof = metrics.users ?? "100+ 研发用户";
  const efficiencyProof = metrics.efficiency ?? "50%+ / 20%+";
  const hasThreeDomains = ["汽车", "军工", "具身"].filter((token) =>
    profile.evidenceKeywords.some((keyword) => keyword.includes(token)) || profile.domainContext.some((keyword) => keyword.includes(token)),
  ).length >= 2;
  return {
    cards: [
      { title: "客户与项目", body: `${customerProof}\n服务 ${userProof}\n覆盖主机厂从需求科到软件科\n产品定价 · 售前方案 · 签单转化`, variant: "gold" },
      { title: "效率提升", body: `${efficiencyProof}\n文档生成 + 通信设计环节\n全流程各环节效率改善\nAgent 驱动而非人工堆砌`, variant: "violet" },
      { title: "行业覆盖", body: `${hasThreeDomains ? "3+" : "多行业"}\n汽车 · 军工 · 具身智能\n参与工信部汽车行业工具链摸底调研\n军工服务化转型支撑`, variant: "teal" },
    ],
  };
}

function enterpriseOverlays(): OverlaySpec[] {
  return [
    {
      id: "ov-agent-workflow",
      kind: "agent-workflow",
      title: "受控 Agent 工作流",
      sections: [
        { title: "不是聊天框", body: "以任务规划、工具调用、多步执行、状态管理、人工确认、结果归档构成闭环。", tone: "violet" },
        { title: "为什么可控", body: "每一步都保留证据、工具输入输出和人工确认点，适合企业级流程。", tone: "teal" },
      ],
      diagram: { type: "agent-workflow", data: enterpriseAgentWorkflow({} as InterviewNarrativeProfile) },
    },
    {
      id: "ov-rag-detail",
      kind: "rag-detail",
      title: "RAG 知识库 / 全链路数据流",
      sections: [
        { title: "输入", body: "项目文档、架构模型、设计规范、历史方案。", tone: "blue" },
        { title: "输出", body: "为 Agent 提供可追溯、可复用、可校验的知识依据。", tone: "violet" },
      ],
    },
    {
      id: "ov-conflict-types",
      kind: "conflict-types",
      title: "一致性校验 Agent / 冲突场景",
      sections: [
        { title: "冲突类型", body: "功能触发、执行时序、网络通信、供电功耗、功能安全、多域协同、定义完整性。", tone: "teal" },
      ],
    },
    {
      id: "ov-arch-detail",
      kind: "arch-detail",
      title: "Groot-Arch 一体化架构 / 三层体系",
      sections: [
        { title: "底层", body: "一体化工具链产生结构化架构数据。", tone: "gold" },
        { title: "中层", body: "RAG 知识库沉淀跨项目知识。", tone: "blue" },
        { title: "上层", body: "AI Agent 通过受控工作流调用工具和知识。", tone: "violet" },
      ],
    },
    {
      id: "ov-platform",
      kind: "platform",
      title: "平台基础设施 / 分层架构",
      sections: [
        { title: "产品判断", body: "先做平台和统一数据模型，再做 Agent，才能避免只得到一个 LLM 搜索框。", tone: "gold" },
      ],
    },
  ];
}

function viz(spec: DiagramSpec): VisualizationSpec {
  return { type: spec.type, data: spec.data };
}

function upsertOverlay(overlays: PresentationOverlay[], spec: OverlaySpec): void {
  const existing = overlays.find((overlay) => overlay.id === spec.id);
  const body = spec.sections?.map((section) => `${section.title}：${section.body}`).join("\n\n") ?? "";
  if (existing) {
    existing.title = spec.title;
    existing.kind = spec.kind;
    existing.body = existing.body || body;
    existing.spec = spec;
    return;
  }
  overlays.push({
    id: spec.id,
    title: spec.title,
    kind: spec.kind,
    body,
    spec,
    sourceRefs: [],
  });
}

function updateSlide(
  slides: PresentationSlide[],
  id: string,
  changes: Partial<PresentationSlide>,
): void {
  const slide = slides.find((item) => item.id === id);
  if (!slide) return;
  Object.assign(slide, changes);
}

function clearInheritedStoryFields(slides: PresentationSlide[]): void {
  for (const slide of slides) {
    delete slide.phaseTag;
    delete slide.summaryLine;
    delete slide.domainTags;
    delete slide.featurePills;
    delete slide.narrativeBeats;
    delete slide.overlayComposition;
  }
}

function periodLabel(node: TimelineNode): string {
  const start = node.startDate?.replace("-", ".") ?? "";
  const end = node.endDate?.replace("-", ".") ?? "";
  return [start, end].filter(Boolean).join("—");
}

function applyEnterpriseAgentStory(
  draft: PresentationDraft,
  data: ResumeData,
  profile: InterviewNarrativeProfile,
  blueprint: InterviewStoryBlueprint,
): PresentationDraft {
  const slides = draft.slides;
  const overlays = draft.overlays;
  for (const overlay of blueprint.overlays) upsertOverlay(overlays, overlay);

  const latest = latestFulltime(data);
  const internships = earliestExperiences(data);
  const earlyCapabilityLine = "需求拆解 / 业务理解 / 用户问题 / 后台系统 / 商业判断 / 跨团队沟通";
  const metrics = profile.classifiedMetrics ?? classifyMetrics(profile);
  const agentMetric = metrics.agents ?? (hasMetric(profile, "5") ? "5 个 Agent 场景" : "受控工作流");
  const teamMetric = metrics.teamSize ?? "";
  const customerMetric = metrics.customersProjects ?? "";
  const userMetric = metrics.users ?? "";
  const efficiencyText = metrics.efficiency ?? "";
  const currentCompanyRole = [latest?.company, profile.targetRole].filter(Boolean).join(" · ");

  updateSlide(slides, "hero", {
    title: profile.candidateName,
    subtitle: currentCompanyRole || "企业级 Agent 产品负责人",
    body: [
      "负责汽车电子架构设计工具链的产品规划、AI Agent 体系建设与商业化落地。",
      [teamMetric ? `管理${teamMetric.replace("产品团队", "产品团队")}` : "", "覆盖汽车、军工、具身智能三个行业方向"].filter(Boolean).join("，"),
    ].filter(Boolean).join("\n"),
    bullets: [
      `${agentMetric} — 文档生成 · 模型生成 · 一致性校验 · 方案推荐 · 知识检索`,
      "RAG 知识库体系 — 私有化部署，5 个 Agent 共享的数据底座",
      "核心工具链 — Groot-Arch 架构设计平台、服务编排、服务仿真、DevOps、观测运维",
      efficiencyText ? `文档生成效率提升 ${efficiencyText.includes("/") ? efficiencyText.split("/")[0]?.trim() : efficiencyText}，全流程各环节效率提升 ${efficiencyText.includes("/") ? efficiencyText.split("/").slice(1).join("/").trim() : "20%+"}` : null,
      [userMetric ? `服务 ${userMetric.replace("用户/研发协同覆盖", "研发用户")}` : null, customerMetric ? `覆盖 ${customerMetric}` : null].filter(Boolean).join("，"),
    ].filter((line): line is string => !!line),
    visualizations: [viz(blueprint.diagrams.hero!)],
    overlayIds: ["ov-arch-detail"],
    phaseTag: "目标定位",
    summaryLine: "工信部汽车工具链摸底调研",
    narrativeBeats: ["定位", "系统", "Agent", "商业化"],
    layoutIntensity: "reference",
  });

  updateSlide(slides, "foundation", {
    title: "三年前，我在互联网大厂完成了产品经理的基础训练",
    subtitle: "Foundation · 2020—2022",
    body: "在进入正式产品工作之前，我在京东和百度做了三轮产品实习：B 端后台、数据基建、用户增长。这段经历定义了我的产品方法论：先理解业务本质，再定义产品形态，用数据验证决策。",
    bullets: internships.length > 0
      ? internships.slice(0, 3).map((node, index) => {
          const takeaway = sanitizeFoundationTakeaway(FOUNDATION_TAKEAWAYS[index] ?? FOUNDATION_TAKEAWAYS[0]);
          const examples = [
            "测评中台从 0 到 1 建设｜医生管理后台迭代｜搜索召回逻辑优化",
            "B 端机构答主系统搭建｜BI 数据报表体系与用户画像｜数据驱动业务决策体系",
            "智能营销屏产品迭代｜权益中心建设与商业化探索｜用户增长与商业闭环",
          ];
          return `${node.company} · ${node.position} · ${periodLabel(node)}：${examples[index] ?? "业务流程拆解｜后台系统设计｜跨团队沟通"}｜▶ 学会：${takeaway}`;
        })
      : [
          "业务理解 · 产品训练：从真实场景里识别关键角色、核心诉求和决策链路｜▶ 学会：需求拆解 / 业务理解",
          "后台系统 · 产品训练：把流程、权限、状态和异常处理成可落地的产品结构｜▶ 学会：后台系统 / 跨团队沟通",
          "商业判断 · 产品训练：把用户价值、运营动作和结果指标放进同一条闭环｜▶ 学会：商业判断 / 用户增长",
        ],
    highlightCallouts: [
      {
        title: "这三段经历给我的不是某一个行业的领域知识",
        body: `而是一套跨领域可迁移的产品方法论：${earlyCapabilityLine}。`,
        variant: "violet",
      },
    ],
    phaseTag: "早期训练",
    summaryLine: "早期经历只证明通用产品能力：需求、业务、用户、系统、商业和协同",
    narrativeBeats: ["早期经历压缩", "产品通用能力", "迁移方法"],
    layoutIntensity: "reference",
  });

  updateSlide(slides, "tension", {
    title: "我进入了汽车电子工具链——看到了一个被国外桌面软件垄断了二十年的领域",
    subtitle: "The Gap · 2022.08—2023.06",
    body: "我的经纬恒润经历",
    bullets: [
      "2022.08：入职，深入一线理解通信工程师日常工作与 Excel 通信矩阵痛点",
      "2022.08—2023.01：VDE Cloud 云端化：协同编辑、变更审批、版本追溯与三级数据模型",
      "2022.12—2023.05：诊断设计系统 0->1：诊断服务、DTC/DID、安全策略、权限与审计",
      "2023.06：两个工具交付两家头部主机厂，SaaS + 平台化方法论初步验证",
    ],
    visualizations: [viz(blueprint.diagrams.tension!)],
    overlayIds: ["ov-conflict-types"],
    highlightCallouts: [
      { title: "三个发现定义了后续产品方向", body: "多人并行带来数据冲突，桌面单机限制协同，工具数据无法沉淀为知识库。", variant: "gold" },
    ],
    phaseTag: "行业断点",
    summaryLine: "V 模型工具割裂 -> 统一数据模型 -> Agent 落地前提",
    narrativeBeats: ["行业矛盾", "工具割裂", "Agent 前提"],
    layoutIntensity: "reference",
  });

  updateSlide(slides, "platform-build", {
    title: "晋升前我先补平台：让工具链产生可被 Agent 使用的数据",
    subtitle: latest ? `${latest.company} · 平台建设阶段` : "Platform Build",
    body: "我先做的不是最炫的 AI，而是通信设计、代码生成、云平台、低代码和售前交付这些基础能力。它们共同解决一个问题：让业务对象、模型和文档结构化。",
    bullets: [
      "SOME/IP 通信设计工具：把配置和交付流程产品化",
      "ARXML / ROS2 代码生成：把设计结果变成可交付产物",
      "云平台基础设施：把单机工具推向协同平台",
      "低代码座舱设计：把复杂配置转成业务可理解界面",
      "售前 / 交付 / 定价：把工具能力放进商业闭环验证",
    ].filter((line) => profile.metrics.some((metric) => line.includes(metric)) || /售前|交付|云平台|工具/.test(line)),
    overlayIds: ["ov-platform"],
    highlightCallouts: [
      { title: "平台先于 Agent", body: "只有平台先把数据结构化，Agent 才有稳定的工具调用对象和知识来源。", variant: "gold" },
    ],
    phaseTag: "平台阶段",
    summaryLine: "通信、代码生成、云平台、低代码和交付共同形成数据底座",
    narrativeBeats: ["平台化", "结构化", "商业验证"],
    layoutIntensity: "reference",
  });

  updateSlide(slides, "agent-leap", {
    title: "晋升后我做的第一件事不是 Agent，而是先把架构工具平台做完整",
    subtitle: "Agent Leap",
    body: "这个顺序很重要：企业级 Agent 不是聊天框，而是受控工作流。它需要明确任务、可调用工具、可追溯知识库、状态管理和人工确认。",
    bullets: [
      "文档生成 Agent：FDS/SSTS 初稿自动生成",
      "模型生成 Agent：UML/SysML 草稿生成",
      "一致性校验 Agent：跨文档/模型冲突检测",
      "方案推荐 Agent：历史项目方案匹配",
      "知识检索 Agent：RAG 跨项目知识复用",
    ],
    visualizations: [viz(blueprint.diagrams.agentLeap!)],
    overlayIds: ["ov-agent-workflow", "ov-rag-detail", "ov-conflict-types"],
    highlightCallouts: [
      { title: "产品战略", body: "不做 ChatGPT 套壳。Agent 有效性取决于知识库质量，知识库质量取决于平台数据结构化程度。没有统一平台数据模型，就没有高质量知识库，Agent 只能停留在 LLM 搜索框。", variant: "violet" },
    ],
    phaseTag: "Agent 跃迁",
    summaryLine: "受控工作流 / 工具调用 / RAG / 人工确认 / 结果归档",
    narrativeBeats: ["反直觉开场", "受控工作流", "RAG", "5 Agent"],
    layoutIntensity: "reference",
  });

  updateSlide(slides, "fullstack", {
    title: "Agent 不是孤立 feature——它贯穿从架构设计到运维观测的全生命周期",
    subtitle: "Full Stack",
    body: "以 Groot-Arch 为设计起点，依次完成服务编排、仿真验证、DevOps 交付和运维观测。AI Agent + RAG 作为智能层贯穿全程：每个阶段产生的数据回流知识库，知识库反哺每个阶段的 Agent 能力。",
    visualizations: [viz(blueprint.diagrams.lifecycle!)],
    featurePills: [
      { label: "架构设计", variant: "gold" },
      { label: "Agent + RAG", variant: "violet" },
      { label: "仿真验证", variant: "blue" },
    ],
    domainTags: ["汽车 · 主机厂", "军工 · 航空航天", "具身智能"],
    phaseTag: "全链路",
    summaryLine: "从设计态、验证态延伸到交付和运行反馈",
    narrativeBeats: ["全链路", "平台层", "智能层", "运行态"],
    layoutIntensity: "reference",
  });

  updateSlide(slides, "impact", {
    title: "从产品设计到商业闭环——我带来了什么结果",
    subtitle: "Impact",
    body: "我的价值不只在 0-1 做功能，而是把平台、Agent、知识库、售前和交付放进一个商业闭环里验证。",
    cards: (blueprint.diagrams.impact?.data.cards as PresentationSlide["cards"]) ?? [],
    bullets: [
      `"我做过 Agent 从 0 到 1。我知道它为什么能成、哪里会出问题、怎么让客户买单。"`,
    ],
    highlightCallouts: [
      {
        title: "我的成长弧线",
        body: `2022 恒润入行 -> 2023 础石平台 PM -> 2025 ${profile.targetRole}。五年时间，经历工具链产品经理 -> 产品负责人 -> 产品总监，${teamMetric ? `管理${teamMetric}。` : "持续承担平台与 Agent 产品责任。"}`,
        variant: "violet",
      },
    ],
    phaseTag: "商业结果",
    summaryLine: "用用户、效率、客户和投标交付证明 Agent 不是 Demo",
    narrativeBeats: ["用户", "效率", "客户", "商业化"],
    layoutIntensity: "reference",
  });

  updateSlide(slides, "resolution", {
    title: "五年后，回到同一张 V 模型图——这不是追赶，是架构代际的更替",
    subtitle: "The Arc",
    body: "回头看，我的经历不是从工具到 AI 的跳跃，而是一直在处理同一个问题：复杂系统如何被结构化、协同化、智能化。",
    bullets: [
      "6 个国外桌面工具",
      "0 AI 能力",
      "0 多人协同",
      "0 数据积累",
      "1 个国产云平台",
      "5 个 AI Agent",
      "100% Web 协同",
      "结构化知识库",
    ],
    visualizations: [viz(blueprint.diagrams.resolution!)],
    closingQuote: `我是${profile.candidateName}。从工具链产品经理做到 ${profile.targetRole}，我做的事一直在变，但逻辑始终一致：理解业务本质，然后定义产品应该是什么。这一次，我看到的是 Agent 应该成为工程工具的操作系统。`,
    narrativeThread: "五年，三个阶段：一线理解痛点 -> 平台统一数据 -> Agent 放大智能。每一段经历都是下一段的前提。",
    phaseTag: "个人主张",
    summaryLine: "复杂系统产品化：结构化、协同化、智能化",
    narrativeBeats: ["视觉回扣", "Before/After", "个人品牌"],
    layoutIntensity: "reference",
  });

  enforceInternshipScope(slides, data);
  return draft;
}

function applyGenericOverlayCopy(overlays: PresentationOverlay[]): void {
  const genericCopy: Record<string, { title: string; body: string; kind: string }> = {
    "ov-agent-workflow": {
      title: "结构化面试 Agent 工作流",
      kind: "agent-workflow",
      body: "任务规划、证据抽取、叙事编排、事实校验、结果归档，全部围绕简历和用户确认事实运行。",
    },
    "ov-rag-detail": {
      title: "证据库 / 全链路数据流",
      kind: "rag-detail",
      body: "把简历、项目经历、表达目标和用户确认事实转成可追溯证据，再服务于每页叙事和图形生成。",
    },
    "ov-conflict-types": {
      title: "事实一致性校验",
      kind: "conflict-types",
      body: "重点校验公司名、项目名、指标、日期、角色责任和岗位表达，避免生成不可追溯的面试内容。",
    },
    "ov-arch-detail": {
      title: "能力架构 / 三层体系",
      kind: "arch-detail",
      body: "底层是简历证据，中层是可迁移能力与方法，上层是面向目标方向的展示表达。",
    },
    "ov-platform": {
      title: "产品方法平台",
      kind: "platform",
      body: "把问题定义、方案设计、协同推进、指标验证和复盘沉淀串成一套可复用的产品方法。",
    },
  };

  for (const overlay of overlays) {
    const copy = genericCopy[overlay.id];
    if (!copy) continue;
    overlay.title = copy.title;
    overlay.kind = copy.kind;
    overlay.body = copy.body;
    overlay.spec = {
      id: overlay.id,
      title: copy.title,
      kind: copy.kind,
      sections: [{ title: "说明", body: copy.body, tone: "blue" }],
    };
  }
}

export function applyInterviewStoryBlueprint(
  baseline: PresentationDraft,
  data: ResumeData,
): PresentationDraft {
  const profile = buildInterviewNarrativeProfile(data);
  const blueprint = buildInterviewStoryBlueprint(data, profile);
  const draft: PresentationDraft = {
    ...baseline,
    slides: baseline.slides.map((slide) => ({ ...slide })),
    overlays: baseline.overlays.map((overlay) => ({ ...overlay })),
    themeTokens: blueprint.themeTokens,
    narrativeProfile: profile,
    storyBlueprint: blueprint,
  };
  clearInheritedStoryFields(draft.slides);

  if (profile.presetId === ENTERPRISE_AGENT_PRESET.id) {
    return applyEnterpriseAgentStory(draft, data, profile, blueprint);
  }

  applyGenericOverlayCopy(draft.overlays);

  updateSlide(draft.slides, "hero", {
    visualizations: [viz(blueprint.diagrams.hero!)],
    phaseTag: "目标定位",
    summaryLine: profile.positioning,
    narrativeBeats: ["定位", "证据", "目标"],
    layoutIntensity: "dense",
  });
  updateSlide(draft.slides, "foundation", {
    phaseTag: "能力底座",
    summaryLine: "早期经历只保留可迁移方法",
    narrativeBeats: ["底座", "迁移", "方法"],
    layoutIntensity: "dense",
  });
  updateSlide(draft.slides, "tension", {
    visualizations: [viz(blueprint.diagrams.tension!)],
    phaseTag: "核心矛盾",
    summaryLine: "从经历中提炼业务断点和机会",
    narrativeBeats: ["矛盾", "断点", "机会"],
    layoutIntensity: "dense",
  });
  updateSlide(draft.slides, "platform-build", {
    phaseTag: "平台能力",
    summaryLine: "把项目经验组织成结构化交付能力",
    narrativeBeats: ["平台", "协同", "交付"],
    layoutIntensity: "dense",
  });
  updateSlide(draft.slides, "agent-leap", {
    phaseTag: "能力跃迁",
    summaryLine: "从执行经验升级为系统化产品判断",
    narrativeBeats: ["跃迁", "判断", "证据"],
    layoutIntensity: "dense",
  });
  updateSlide(draft.slides, "fullstack", {
    visualizations: [viz(blueprint.diagrams.lifecycle!)],
    phaseTag: "方法链路",
    summaryLine: "把单点经验组织成可复用工作系统",
    narrativeBeats: ["方法", "链路", "复用"],
    layoutIntensity: "dense",
  });
  updateSlide(draft.slides, "impact", {
    phaseTag: "结果验证",
    summaryLine: "用可追溯指标证明真实业务价值",
    narrativeBeats: ["结果", "指标", "验证"],
    layoutIntensity: "dense",
  });
  updateSlide(draft.slides, "resolution", {
    visualizations: [viz(blueprint.diagrams.resolution!)],
    phaseTag: "个人主张",
    summaryLine: "回扣问题、证据和目标岗位",
    narrativeBeats: ["回扣", "闭环", "主张"],
    layoutIntensity: "dense",
  });

  return draft;
}
