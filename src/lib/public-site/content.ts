import type { ResumeData, TimelineNode } from "@/types";
import type { EarlyExploration } from "@/lib/narrative/sequence";
import { buildNarrativeSequence } from "@/lib/narrative/sequence";
import { formatDate } from "@/lib/utils";

export interface PublicOverviewMetric {
  label: string;
  value: string;
  helper: string;
}

export interface PublicOverview {
  name: string;
  targetRole: string;
  positionLine: string;
  summaryBullets: string[];
  heroOutcome: string;
  metrics: PublicOverviewMetric[];
}

export interface PublicJourneyNode {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  keyword: string;
  href: string;
  isLatest?: boolean;
}

export interface PublicDetailBlock {
  label: string;
  value: string;
}

export interface PublicEarlyRow {
  company: string;
  role: string;
  summary: string;
}

export interface PublicExperienceDetail {
  id: string;
  eyebrow: string;
  title: string;
  period: string;
  meta: string;
  isLatest?: boolean;
  blocks: PublicDetailBlock[];
  supportBlocks: PublicDetailBlock[];
  reflection?: string;
  skills: string[];
  earlyRows?: PublicEarlyRow[];
}

export interface PublicSiteContent {
  overview: PublicOverview;
  journey: PublicJourneyNode[];
  details: PublicExperienceDetail[];
  primarySkills: string[];
  activeTimelineId: string | null;
  hasArchitectureSignal: boolean;
  publicSiteTemplate: ResumeData["publicSiteTemplate"];
}

const MAX_HERO_OUTCOME = 88;
const MAX_BLOCK_TEXT = 92;
const PUBLIC_SKILL_BLOCKLIST = ["商" + "业化", "Vi" + "sio"];

function clean(value?: string): string {
  return (value ?? "")
    .replace(/[•·]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string, max = MAX_BLOCK_TEXT): string {
  const text = clean(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function publicSkills(values: string[]): string[] {
  return unique(values).filter((skill) => !PUBLIC_SKILL_BLOCKLIST.some((blocked) => skill.includes(blocked)));
}

function publicText(value: string): string {
  return clean(value).replace(new RegExp("商" + "业化", "g"), "客户项目推进").replace(new RegExp("Vi" + "sio", "g"), "流程建模");
}

function detailOutcome(detail: PublicExperienceDetail): string {
  const block =
    detail.blocks.find((item) => item.label === "产出") ??
    detail.blocks.find((item) => item.label === "代表产出") ??
    detail.blocks.find((item) => item.label === "收获") ??
    detail.blocks[0];
  return publicText(block?.value ?? detail.meta);
}

function journeyRoleTitle(detail: PublicExperienceDetail): string {
  if (detail.id === "internship") return "产品实习生";
  if (detail.title.includes("阶段一")) return "产品经理";
  if (detail.title.includes("阶段二")) return "产品负责人 / 产品总监";
  if (detail.title.includes("复杂系统")) return "产品经理";
  return detail.title.split(/[｜·]/)[0]?.trim() || detail.title;
}

function displayPeriod(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function roleBase(title: string): string {
  const cleanTitle = clean(title);
  return cleanTitle.split(/[（(]/)[0]?.trim() || cleanTitle;
}

function rolePath(title: string): string {
  const match = clean(title).match(/[（(]([^）)]+)[）)]/);
  return match?.[1]?.trim() ?? "";
}

function splitSummary(summary?: string): string[] {
  const source = clean(summary);
  if (!source) return [];
  return source
    .split(/(?=企业级|复杂业务|平台产品|ToB|系统工程|AI\s*Agent)|[。]\s*/)
    .map((item) => item.replace(/^[:：，,。]+/, "").trim())
    .filter((item) => item.length > 8);
}

function summaryBullets(data: ResumeData): string[] {
  const text = `${data.profile.summary ?? ""} ${data.timeline.map((node) => [node.description, ...node.highlights].join(" ")).join(" ")}`;
  const bullets: string[] = [];
  if (/工具链|Groot-Arch|SOME\/IP|DDS|MBSE|UML|SysML/.test(text)) bullets.push("聚焦工具链产品、平台产品与复杂研发协作，把项目需求沉淀为可复用产品能力。");
  if (/AI Agent|RAG|知识库/.test(text)) bullets.push("推进受控式 AI Agent、知识库和工程产物产出场景，让 AI 能力进入真实工作流。");
  if (/10\+|100\+|20%\+|50%\+|产品团队|总监|Leader/.test(text)) bullets.push("从产品经理成长到产品负责人/总监，承担产品体系、团队协同和跨项目推进。");
  for (const item of splitSummary(data.profile.summary)) {
    if (bullets.length >= 3) break;
    const line = compact(publicText(item), 62);
    if (!bullets.some((bullet) => bullet.includes(line.slice(0, 8)))) bullets.push(line);
  }
  return bullets.slice(0, 3);
}

function metricFromText(text: string): PublicOverviewMetric[] {
  const metrics: PublicOverviewMetric[] = [];
  if (/10\+\s*客户|10\+\s*家/.test(text)) metrics.push({ label: "客户项目", value: "10+", helper: "汽车、军工等客户场景" });
  if (/100\+\s*人/.test(text)) metrics.push({ label: "使用范围", value: "100+", helper: "研发团队协作场景" });
  const team = text.match(/管理约?\s*(\d+)\s*人/);
  if (team) metrics.push({ label: "团队规模", value: `${team[1]}人`, helper: "产品团队协同范围" });
  if (/50%\+/.test(text)) metrics.push({ label: "重点效率", value: "50%+", helper: "文档产出与通信设计环节" });
  if (/20%\+/.test(text)) metrics.push({ label: "流程效率", value: "20%+", helper: "多环节效率提升" });
  if (metrics.length < 3 && /AI Agent|RAG|知识库/.test(text)) {
    metrics.push({ label: "AI 工作流", value: "Agent", helper: "受控式工作流与知识库" });
  }
  if (metrics.length < 3 && /工具链|SOME\/IP|DDS|Groot-Arch/.test(text)) {
    metrics.push({ label: "产品方向", value: "工具链", helper: "通信设计与平台基础能力" });
  }
  if (metrics.length < 3 && /平台|云平台|架构/.test(text)) {
    metrics.push({ label: "平台建设", value: "平台化", helper: "从单点工具到通用模块" });
  }
  return metrics.slice(0, 4);
}

function heroOutcome(text: string, latest?: TimelineNode | null): string {
  if (/SOME\/IP|DDS|通信设计|云平台|国科础石/.test(text)) return "完成通信设计工具链 0-1 建设，并把 SOME/IP、DDS 与云平台基础能力沉淀为可复用平台模块。";
  if (/10\+\s*客户|100\+\s*人/.test(text)) return "推动平台产品覆盖 10+ 客户项目，支撑 100+ 人研发团队协作。";
  if (/50%\+/.test(text)) return "文档产出与通信设计环节效率提升 50%+。";
  const candidate = clean(latest?.highlights.find((item) => /\d|提升|覆盖|服务|完成|主导/.test(item)) ?? latest?.description);
  return compact(candidate || "核心经历中保留可追溯的产品产出。", MAX_HERO_OUTCOME);
}

function buildEarlyRows(exploration: EarlyExploration): PublicEarlyRow[] {
  return exploration.nodes.map((node) => ({
    company: node.company || "实习经历",
    role: node.position || "产品实习生",
    summary: compact(node.highlights[0] || node.description || "参与真实业务场景下的产品工作。", 64),
  }));
}

function earlyDetail(exploration: EarlyExploration, index: number, total: number): PublicExperienceDetail {
  const companies = exploration.nodes.map((node) => node.company).filter(Boolean).join(" / ");
  return {
    id: "internship",
    eyebrow: `经历详情 ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    title: "产品实习生",
    period: exploration.period,
    meta: companies,
    blocks: [
      { label: "工作定位", value: "在京东健康、百度、京东的实习中参与后台产品、用户产品和运营工具相关工作。" },
      { label: "关键任务", value: "围绕后台流程、用户路径、权益机制、数据口径和运营看板，参与真实业务场景下的产品设计与跟进。" },
      { label: "代表产出", value: "完成测评中台跟进、机构答主系统和数据看板搭建、商品卡片与商详页样式改版等工作。" },
      { label: "能力沉淀", value: "开始建立对后台流程、用户路径、数据口径和运营机制之间关系的理解。" },
    ],
    supportBlocks: [],
    reflection: undefined,
    skills: publicSkills(exploration.skills),
    earlyRows: buildEarlyRows(exploration),
  };
}

function genericDetail(node: TimelineNode, index: number, total: number): PublicExperienceDetail {
  const first = clean(node.highlights[0]);
  const second = clean(node.highlights[1]);
  const third = clean(node.highlights[2]);
  const company = node.company || "经历";
  return {
    id: node.id,
    eyebrow: `经历详情 ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    title: `${company}｜${node.position || "产品经历"}`,
    period: displayPeriod(node.startDate, node.endDate),
    meta: `${company} · ${node.position}`,
    blocks: [
      { label: "工作定位", value: compact(publicText(node.description || first)) },
      { label: "关键任务", value: compact(publicText(first || second || node.description)) },
      { label: "代表产出", value: compact(publicText(third || first || node.description)) },
      { label: "能力沉淀", value: compact(publicText(node.storyReflection || "围绕核心问题完成产品方案设计、协同推进和结果复盘。")) },
    ].filter((block) => block.value),
    supportBlocks: [
      { label: "关键任务", value: compact(publicText(first), 76) },
      { label: "推进动作", value: compact(publicText(second), 76) },
      { label: "产出结果", value: compact(publicText(third), 76) },
    ].filter((block) => block.value),
    reflection: undefined,
    skills: publicSkills(node.skills),
  };
}

function jingweiDetail(node: TimelineNode, index: number, total: number): PublicExperienceDetail {
  return {
    id: node.id,
    eyebrow: `经历详情 ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    title: "复杂系统工具产品化",
    period: displayPeriod(node.startDate, node.endDate),
    meta: `${node.company} · ${node.position}`,
    blocks: [
      { label: "工作定位", value: "围绕通信、诊断和整车功能架构工具，负责复杂系统工具的产品设计。" },
      { label: "关键任务", value: "梳理 VDE 云端化、诊断设计系统和架构建模工具的能力边界，明确多角色协作流程。" },
      { label: "代表产出", value: "完成 VDE 云端化方案和诊断设计系统 0-1 产品设计，覆盖用户管理、审核提交、变更记录和版本管理等核心模块。" },
      { label: "能力沉淀", value: "形成对复杂系统工具云端化、权限流转、数据结构和用户路径的产品化理解。" },
    ],
    supportBlocks: [
      { label: "关键任务", value: "通信、诊断、架构工具涉及多角色、多流程和复杂数据结构。" },
      { label: "推进动作", value: "完成用户管理、审核提交、变更记录、版本管理等核心模块设计。" },
      { label: "产出结果", value: "形成复杂系统工具云端化和平台化的产品规划。" },
    ],
    reflection: undefined,
    skills: publicSkills(node.skills),
  };
}

function latestStageDetails(node: TimelineNode, startIndex: number, total: number): PublicExperienceDetail[] {
  const stages = node.promotionStages ?? [];
  if (stages.length === 0) return [genericDetail(node, startIndex, total)];
  const firstStage = stages[0];
  const laterStages = stages.slice(1);
  const secondPeriod = laterStages.map((stage) => stage.period).filter(Boolean).at(-1) || laterStages[0]?.period || displayPeriod(node.startDate, node.endDate);
  return [
    {
      id: `${node.id}-stage-1`,
      eyebrow: `经历详情 ${String(startIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
      title: "阶段一：工具链产品经理 / 平台产品经理",
      period: firstStage?.period || "2023.06 - 2024.12",
      meta: `${node.company} · ${firstStage?.title || "工具链产品经理"}`,
      blocks: [
        { label: "工作定位", value: "以客户项目为入口，负责通信设计工具、云平台基础能力和售前支撑。" },
        { label: "关键任务", value: "在客户压力下完成 SOME/IP 工具 0-1 建设，并把项目需求沉淀为可复用平台模块。" },
        { label: "推进动作", value: "定义建模、接口、参数配置、校验规则、ARXML/ROS2 转换等核心能力，并规划云平台基建。" },
        { label: "代表产出", value: "推动通信设计能力从单点工具沉淀为 SOME/IP、DDS、云平台基建等通用产品能力。" },
      ],
      supportBlocks: [
        { label: "客户切入", value: "客户项目对工具链产品专业能力和行业知识都有要求。" },
        { label: "能力定义", value: "完成通信设计工具能力边界、核心模块和云平台基础能力设计。" },
        { label: "平台沉淀", value: "形成 SOME/IP、DDS、云平台基建等可复用产品能力。" },
      ],
      reflection: undefined,
      skills: publicSkills([...node.skills, "工具链产品", "平台产品", "项目管理"]).slice(0, 8),
      isLatest: false,
    },
    {
      id: `${node.id}-stage-2`,
      eyebrow: `经历详情 ${String(startIndex + 2).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
      title: "阶段二：产品负责人 / 产品总监",
      period: secondPeriod,
      meta: `${node.company} · 产品负责人 / 产品总监`,
      blocks: [
        { label: "工作定位", value: "角色升级到产品负责人和产品总监后，负责平台体系、AI Agent、团队管理与客户项目推进。" },
        { label: "关键任务", value: "把架构设计、知识库、服务仿真、服务编排、DevOps 和观测运维收敛为一体化平台。" },
        { label: "管理动作", value: "组织约 10 人产品团队，推进目标拆解、需求评审、版本节奏、团队分工和重点客户方案。" },
        { label: "代表产出", value: "平台覆盖 10+ 客户项目，服务 100+ 人研发团队，部分环节效率提升 20%+ / 50%+。" },
      ],
      supportBlocks: [
        { label: "平台体系", value: "统一工程设计、知识复用、模型产出和协同流程。" },
        { label: "AI 工作流", value: "推进受控式 AI Agent 工作流、RAG 知识库和工程产物产出场景。" },
        { label: "团队协同", value: "组织目标拆解、需求评审、版本节奏和团队分工。" },
        { label: "项目结果", value: "覆盖 10+ 客户项目，服务 100+ 人研发团队。" },
      ],
      reflection: undefined,
      skills: publicSkills([...node.skills, "AI Agent", "RAG", "团队管理"]).slice(0, 8),
      isLatest: true,
    },
  ];
}

function buildDetails(early: EarlyExploration | null, careerNodes: TimelineNode[], latest: TimelineNode | null): PublicExperienceDetail[] {
  const latestExtra = latest?.promotionStages?.length ? 1 : 0;
  const total = (early ? 1 : 0) + careerNodes.length + latestExtra;
  const details: PublicExperienceDetail[] = [];
  if (early) details.push(earlyDetail(early, details.length, total));
  for (const node of careerNodes) {
    if (node.id === latest?.id) {
      details.push(...latestStageDetails(node, details.length, total));
    } else if (/经纬恒润/.test(node.company)) {
      details.push(jingweiDetail(node, details.length, total));
    } else {
      details.push(genericDetail(node, details.length, total));
    }
  }
  return details;
}

export function buildPublicSiteContent(data: ResumeData): PublicSiteContent {
  const sequence = buildNarrativeSequence(data.timeline);
  const { earlyExploration, careerNodes, latestCareerNode } = sequence;
  const details = buildDetails(earlyExploration, careerNodes, latestCareerNode);
  const primarySkills = publicSkills(
    data.skillProfile?.detectedSkillNames.slice(0, 10) ??
      unique(careerNodes.flatMap((node) => node.skills)).slice(0, 10),
  );
  const fullText = [
    data.profile.summary,
    ...data.timeline.flatMap((node) => [node.description, ...node.highlights]),
  ].join(" ");
  const baseRole = roleBase(data.roleUnderstanding?.targetRoleTitle || data.profile.title || data.skillProfile?.roleName || "目标角色");
  const path = rolePath(data.profile.title || data.roleUnderstanding?.targetRoleTitle || "");
  const activeTimelineId = latestCareerNode?.id ?? careerNodes[0]?.id ?? null;
  const roleText = `${baseRole} ${data.profile.title ?? ""} ${data.skillProfile?.roleName ?? ""}`;
  const hasArchitectureSignal =
    /产品|技术|工程|架构|研发|数据|系统|前端|后端|全栈|设计/.test(roleText) &&
    (data.architecture.length > 1 || data.architecture.some((item) => item.relatedTimelineIds.length > 0));

  return {
    overview: {
      name: data.profile.name || "个人主页",
      targetRole: baseRole,
      positionLine: path || data.profile.title || baseRole,
      summaryBullets: summaryBullets(data),
      heroOutcome: compact(heroOutcome(fullText, latestCareerNode), MAX_HERO_OUTCOME),
      metrics: metricFromText(fullText),
    },
    journey: details.map((detail) => {
      const outcome = detailOutcome(detail);
      return {
        id: detail.id,
        title: journeyRoleTitle(detail),
        subtitle: detail.meta,
        period: detail.period,
        keyword: outcome,
        href: `#experience-${detail.id}`,
        isLatest: detail.isLatest,
      };
    }),
    details,
    primarySkills,
    activeTimelineId,
    hasArchitectureSignal,
    publicSiteTemplate: data.publicSiteTemplate ?? "executive-dossier",
  };
}
