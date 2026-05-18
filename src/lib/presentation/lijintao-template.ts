import type { ResumeData } from "@/types";
import type { PresentationDraft, PresentationModule, PresentationOverlay, PresentationSlide } from "./types";
import { getResumeRevision } from "@/lib/public-narrative/from-draft";

type GenerateOptions = Record<string, never>;

const LIJINTAO_MODULES: PresentationModule[] = [
  {
    id: "self",
    label: "自我介绍",
    description: "10 页主线：从产品基础训练、复杂工程工具链，到 AI Agent 工作流与最终判断",
    defaultSlideId: "hero",
    keyboardShortcut: "1",
  },
];

export const LIJINTAO_TEMPLATE_ID = "lijintao-interview-space";

function sourceTimeline(id: string) {
  return { type: "timeline" as const, id };
}

function findTimelineId(data: ResumeData, patterns: string[]): string | undefined {
  const hit = data.timeline?.find((item) => {
    const text = [item.company, item.position, item.description, ...(item.highlights ?? []), ...(item.skills ?? [])].join(" ");
    return patterns.some((pattern) => text.includes(pattern));
  });
  return hit?.id;
}

export function shouldUseLijintaoInterviewTemplate(data: ResumeData): boolean {
  const profileText = [data.profile.name, data.profile.title, data.profile.summary].join(" ");

  const resumeText = [
    profileText,
    ...(data.timeline ?? []).flatMap((item) => [
      item.company,
      item.position,
      item.description,
      ...(item.highlights ?? []),
      ...(item.skills ?? []),
    ]),
  ].join(" ");

  const isCurrentLijintaoResume =
    profileText.includes("李锦涛") &&
    (
      profileText.includes("复杂 ToB 产品与平台产品负责人") ||
      profileText.includes("汽车、军工") ||
      resumeText.includes("全生命周期协同平台") ||
      resumeText.includes("整车级 E/E")
    );

  const signalHits = [
    "经纬恒润",
    "架构设计工具",
    "SOME/IP",
    "DDS",
    "VDE Cloud",
    "国科础石",
    "知识库",
    "受控式",
    "Agent 工作流",
  ].filter((signal) => resumeText.includes(signal)).length;

  return isCurrentLijintaoResume && signalHits >= 2;
}

export function buildLijintaoPresentationDraft(
  data: ResumeData,
  _options: GenerateOptions,
  id: string,
  now: string,
): PresentationDraft {
  const name = data.profile.name || "李锦涛";
  const targetRole = data.roleUnderstanding?.targetRoleTitle || data.profile.title || "复杂 ToB 产品与平台产品负责人";
  const coreToolId = findTimelineId(data, ["架构设计工具", "SOME/IP", "国科础石"]) ?? data.timeline?.[0]?.id;
  const platformId = findTimelineId(data, ["全生命周期", "知识库", "DevOps", "运维监控"]) ?? coreToolId;
  const agentId = findTimelineId(data, ["Agent", "RAG", "文档生成", "模型生成", "一致性校验"]) ?? platformId;

  const overlays: PresentationOverlay[] = [
    {
      id: "ov-ljt-architecture",
      title: "企业智能化产品架构关系",
      kind: "arch-detail",
      body: "可信知识层、可调用工具层和统一底座层共同支撑受控式 Agent 工作流，让知识可追溯、流程可执行、结果可回写。",
      sourceRefs: [{ type: "profile" }, ...(agentId ? [sourceTimeline(agentId)] : [])],
    },
    {
      id: "ov-ljt-product-system",
      title: "复杂研发协同平台底座",
      kind: "platform",
      body: "项目管理、架构设计、服务仿真、服务编排、知识库、DevOps 和运维监控组成产品矩阵，并通过统一云平台承接权限、项目空间、审计和数据模型。",
      sourceRefs: platformId ? [sourceTimeline(platformId)] : [{ type: "profile" }],
    },
    {
      id: "ov-ljt-agent-boundary",
      title: "Agent 能力边界",
      kind: "agent-workflow",
      body: "已落地能力以知识库、RAG、原生工具调用、多步骤执行、产物预览和人工确认为边界，不把高风险决策包装成全自动。",
      sourceRefs: agentId ? [sourceTimeline(agentId)] : [{ type: "profile" }],
    },
    {
      id: "ov-ljt-evidence",
      title: "追问证据层",
      kind: "material-evidence",
      body: "可继续补充架构设计工具、DDS/SOME-IP 演进、售前方案、标书定价、团队管理、效率口径和 Agent 能力边界。",
      sourceRefs: [{ type: "profile" }],
    },
  ];

  const slides: PresentationSlide[] = [
    {
      id: "hero",
      kind: "hero",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 0,
      title: `${name} · 复杂 ToB 产品与平台产品负责人`,
      subtitle: "面试空间 · 01",
      body: "长期在汽车、军工等复杂产业场景中负责平台产品、专业工具链、知识库与产品矩阵建设，经历从单点工具、平台化产品到企业智能化探索的完整过程。",
      bullets: [
        "产品体系：架构设计工具、服务仿真、服务编排、项目管理、知识库、运维监控等产品矩阵",
        "客户与交付：支撑东风、广汽及多个军工客户场景，参与售前、方案、标书、定价和交付推进",
        "负责人经历：从产品经理成长为产品负责人 / 产品总监，管理 10 人产品团队",
        "智能化探索：围绕知识库、工具调用、多步执行、状态管理和人工确认探索 Agent 化工作流",
      ],
      visualizations: [
        {
          type: "hero-architecture",
          data: {
            core: "Enterprise AI Agent",
            layers: ["可信知识层（RAG）", "可调用工具层", "统一底座层"],
            satellites: ["文档生成", "模型生成", "一致性校验", "推荐 / 检索"],
          },
        },
      ],
      overlayIds: ["ov-ljt-architecture"],
      highlightCallouts: [
        {
          title: "核心判断",
          body: "核心不在单点 AI 能力，而在知识、工具、编排与底座之间形成稳定、可控的关联关系。",
          variant: "green",
        },
      ],
      speakerNotes: "开场先给面试官一个清晰定位：复杂 ToB 产品、平台产品、工程工具链和受控式 Agent 工作流。",
      sourceRefs: [{ type: "profile" }],
    },
    {
      id: "foundation",
      kind: "foundation",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 1,
      title: "我的起点，是在互联网团队完成产品经理的基础训练",
      subtitle: "Foundation · 2020-2022",
      body: "在进入汽车行业之前，我在京东和百度做了三轮产品实习：B 端后台、数据基建、用户增长。这段经历奠定了我的产品方法论：先理解业务本质，再定义产品形态，用数据验证决策。",
      bullets: [
        "京东健康：测评中台、医生管理后台、搜索召回逻辑，学会从 0 到 1 搭建业务系统",
        "百度 MEG：B 端机构答主系统、BI 报表和用户画像，学会平台架构与数据驱动",
        "京东商业提升：智能营销屏、权益中心和商业化探索，建立用户增长与商业闭环意识",
      ],
      highlightCallouts: [
        {
          title: "可迁移方法论",
          body: "B 端后台让我理解平台架构，数据基建让我学会用指标说话，用户增长让我建立商业化思维。",
          variant: "gold",
        },
      ],
      sourceRefs: [{ type: "timeline" }],
    },
    {
      id: "tension",
      kind: "tension",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 2,
      title: "进入汽车电子工具链后，我面对的是高知识密度、强流程协同、国外工具主导的复杂领域",
      subtitle: "The Gap · 2022.08-2023.06",
      body: "从通信矩阵、诊断设计到平台化协同，我开始把桌面单机工具的痛点翻译成云原生、可协同、可追溯的产品系统。",
      bullets: [
        "多人并行编辑通信矩阵时存在数据冲突和版本错乱，需要协同审批机制",
        "平台化战略要求车型间数据复用，桌面工具难以支撑三级数据模型",
        "通信矩阵的层级结构最适合做结构化建模，后来成为 AI 能力落地的第一块数据基础",
      ],
      visualizations: [{ type: "v-model", data: { showGaps: true } }],
      sourceRefs: coreToolId ? [sourceTimeline(coreToolId)] : [{ type: "timeline" }],
    },
    {
      id: "customer-breakthrough",
      kind: "platform_build",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 3,
      title: "从客户项目打开局面：第一次完整跑通产品闭环",
      subtitle: "Customer Breakthrough · 国科础石 Phase 1",
      body: "在客户沟通和 OEM 工具链诊断中，我识别出 SOME/IP 服务设计在多团队协作、接口一致性、可观测性和变更管理上的痛点，并推动从售前方案到工具 0→1 落地的完整闭环。",
      bullets: [
        "客户痛点识别：明确 SOME/IP 服务设计的接口一致性、版本管理和设计效率痛点",
        "售前与方案推进：输出解决方案、价值论证和方案演示，推动项目立项",
        "工具 0→1：覆盖服务建模、校验、代码生成、可视化与追溯",
        "平台能力沉淀：把一次性项目经验抽象成可复制产品能力",
      ],
      overlayIds: ["ov-ljt-product-system"],
      highlightCallouts: [
        { title: "关键转折", body: "通过真实项目验证产品价值，建立客户沟通能力，并获得内部负责人角色。", variant: "teal" },
      ],
      sourceRefs: coreToolId ? [sourceTimeline(coreToolId)] : [{ type: "timeline" }],
    },
    {
      id: "core-product",
      kind: "job_business_context",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 4,
      title: "架构设计工具：覆盖 V 模型关键设计链路的系统级产品",
      subtitle: "Core Product · 架构设计工具",
      body: "面向汽车与复杂装备研发，覆盖需求、功能、系统、通信、诊断、软件等关键设计对象，支撑多角色协同、一致性管理、变更追溯和客户交付。",
      bullets: [
        "复杂对象建模：把工程对象结构化、可追溯",
        "多角色协同：理解架构师、通信工程师、诊断工程师、软件工程师之间的协作关系",
        "项目需求产品化：把客户痛点和工程实践抽象为产品能力",
        "系统级规划：从单点工具走向覆盖研发链路的平台",
      ],
      cards: [
        { title: "设计链路", body: "需求管理 / 功能设计 / 系统设计 / 软件设计 / 通信设计 / 诊断设计", variant: "green" },
        { title: "验证与交付", body: "仿真验证 / 集成测试 / 系统测试 / 验收测试", variant: "blue" },
        { title: "关键收束", body: "架构设计工具是我从“做工具”进入“建设系统级产品”的代表项目。", variant: "gold" },
      ],
      sourceRefs: coreToolId ? [sourceTimeline(coreToolId)] : [{ type: "timeline" }],
    },
    {
      id: "product-system",
      kind: "material_index",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 5,
      title: "全生命周期协同平台：从专业工具到复杂研发组织的产品体系",
      subtitle: "Product System · 全生命周期协同平台",
      body: "围绕项目协作、架构设计、服务仿真、服务编排、知识库、DevOps 与观测运维，形成覆盖复杂研发全流程的产品矩阵和平台底座。",
      bullets: [
        "单点工具提升局部效率，每个产品解决一个关键环节",
        "产品矩阵覆盖完整流程，承接从设计、仿真、协作到交付运维的连续工作",
        "知识沉淀支撑复用，将项目经验、规范模板和最佳实践结构化沉淀",
        "统一底座支撑持续演进，让产品矩阵可以扩展并接入智能化能力",
      ],
      cards: [
        { title: "项目管理", body: "计划、进度、风险与资源，承接项目协同与过程管理。", variant: "green" },
        { title: "架构设计 / 服务仿真", body: "一体化管理工程对象，并连接设计与验证闭环。", variant: "cyan" },
        { title: "知识库 / DevOps / 运维", body: "让项目知识成为组织能力，并形成交付后的运行反馈。", variant: "violet" },
      ],
      overlayIds: ["ov-ljt-product-system"],
      sourceRefs: platformId ? [sourceTimeline(platformId)] : [{ type: "timeline" }],
    },
    {
      id: "agent-workflow",
      kind: "job_agent_boundary",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 6,
      title: "已落地：受控式 AI Agent 工作流",
      subtitle: "Landed Capability · AI Agent 工作流",
      body: "面向工程设计、文档生产、模型生成与一致性校验等高频场景，将 AI 从问答辅助推进到真实业务系统中的可控产物生成。",
      bullets: [
        "知识检索：基于 RAG 召回规范、项目文档与历史方案",
        "任务规划与工具调用：将目标拆成任务链，并调用平台内自研工具",
        "多步骤执行：按链路生成、校验、修正和汇总",
        "人工确认与归档：关键产物确认后进入下一步，并回流知识资产",
      ],
      cards: [
        { title: "已落地场景", body: "FDS / SSTS 文档生成、UML / SysML 模型生成、跨文档 / 模型一致性校验、历史方案推荐。", variant: "green" },
        { title: "结果信号", body: "服务 100+ 研发用户，覆盖主机厂从需求科到软件科的流程节点。", variant: "blue" },
        { title: "为什么受控", body: "上下文边界明确、只调用平台内工具、产物输出前有人确认。", variant: "gold" },
      ],
      overlayIds: ["ov-ljt-agent-boundary"],
      sourceRefs: agentId ? [sourceTimeline(agentId)] : [{ type: "timeline" }],
    },
    {
      id: "expert-assistant",
      kind: "job_customer_segments",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 7,
      title: "在建设：面向 EE 工程角色的专家助手体系",
      subtitle: "In Progress · 专家助手体系",
      body: "从单点工程助手进一步走向面向角色、对象和任务的专家助手体系，让助手从“能回答 / 能生成”走向“能辅助一个工程师完成一类工作”。",
      bullets: [
        "架构工程师：需求承接、功能分解、系统设计、接口协同、变更影响分析",
        "通信工程师：通信影响确认、矩阵维护、版本对比、校验分析、供应商下发",
        "诊断 / 系统 / 软件工程师：围绕核心对象完成策略设计、方案定义、接口承接和问题闭环",
      ],
      cards: [
        { title: "更懂工程场景", body: "基于角色场景与工程知识，而不是通用问答。", variant: "green" },
        { title: "更可信赖", body: "来源可追溯、规则可解释、结果可验证。", variant: "gold" },
        { title: "融入工作流", body: "在工具链和协同平台中自然触达，反馈驱动持续进化。", variant: "cyan" },
      ],
      sourceRefs: agentId ? [sourceTimeline(agentId)] : [{ type: "timeline" }],
    },
    {
      id: "vehicle-solution",
      kind: "job_solution_path",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 8,
      title: "整车级 E/E 解决方案：从车型平台到变更闭环",
      subtitle: "Vehicle-level Solution · 整车级 E/E",
      body: "围绕产品线、车型变体和架构基线，统一管理架构方案、工程对象、复用派生、追溯关系和变更影响，让整车平台在多车型、多配置、多版本下持续演进。",
      bullets: [
        "产品线 / 车型变体管理：从平台模型管理车型系列、配置差异与功能选装",
        "整车架构方案评估：对成本、重量、空间、功耗、网络负载、时序和安全约束进行权衡",
        "全流程追溯：建立需求、功能、逻辑架构、软硬件、通信、测试、工单之间的双向追溯",
        "变更影响分析：沿产品线、车型变体、工程对象和追溯关系识别影响范围",
      ],
      cards: [
        { title: "从单车到产品线", body: "面向平台、车型系列、配置变体和版本基线管理整车 E/E 架构。", variant: "green" },
        { title: "从对象到关系", body: "不只管理单个对象，而是管理映射、依赖和影响关系。", variant: "blue" },
        { title: "从变更到闭环", body: "把影响分析、任务拆解、修改验证、评审冻结和发布管理串成闭环。", variant: "gold" },
      ],
      sourceRefs: platformId ? [sourceTimeline(platformId)] : [{ type: "timeline" }],
    },
    {
      id: "result-judgement",
      kind: "impact",
      moduleId: "self",
      moduleTitle: "自我介绍",
      moduleOrder: 9,
      title: "建设结果与我的判断：把复杂工程能力做成可交付产品系统",
      subtitle: "Result & Judgement · 建设结果与判断",
      body: "这几年的工作最终沉淀出的，不是单一行业标签，也不是单点 AI 功能经验，而是把复杂业务、工程对象、专业工具、知识库、角色工作流和评审闭环组织成可执行产品系统的能力。",
      bullets: [
        "10+ 客户 / 项目",
        "100+ 研发用户",
        "10 人产品团队管理",
        "7 类核心产品与平台能力",
      ],
      cards: [
        { title: "复杂业务理解", body: "快速进入高知识密度行业，识别真实业务对象、角色流程和价值断点。", variant: "green" },
        { title: "产品体系抽象", body: "从单点工具走向产品矩阵、平台底座和可复用能力体系。", variant: "blue" },
        { title: "AI 产品化判断", body: "把 AI 放进真实流程，以可控、可审计、可交付为核心。", variant: "gold" },
      ],
      closingQuote: "AI 的价值不是替代信息化建设，而是深化信息化建设。",
      highlightCallouts: [
        {
          title: "最终判断",
          body: "把知识、流程、工具、数据和评审闭环真正沉淀进客户业务系统，形成可交付、可验证、可复制、可商业化的产品系统。",
          variant: "green",
        },
      ],
      sourceRefs: [{ type: "profile" }, ...(agentId ? [sourceTimeline(agentId)] : [])],
    },
  ];

  const finalSlides = slides.filter((slide) => slide.moduleId === "self");

  return {
    id,
    schemaVersion: 1,
    sourceResumeRevision: getResumeRevision(data),
    targetRole,
    template: "agent-product-arc",
    modules: LIJINTAO_MODULES,
    slides: finalSlides,
    overlays,
    themeId: "light-story",
    themeTokens: {
      gold: "#047857",
      "gold-bright": "#10b981",
      teal: "#059669",
      violet: "#0f766e",
      blue: "#0891b2",
    },
    narrativeProfile: {
      presetId: LIJINTAO_TEMPLATE_ID,
      confidence: 1,
      candidateName: name,
      targetRole,
      positioning: "复杂 ToB 产品与平台产品负责人",
      domainContext: ["汽车电子工具链", "复杂研发协同平台", "受控式 AI Agent 工作流"],
      evidenceKeywords: ["架构设计工具", "SOME/IP", "知识库", "RAG", "工具调用", "多步骤执行", "人工确认"],
      metrics: ["10+ 客户 / 项目", "100+ 研发用户", "10 人产品团队", "50%+ 文档生成效率提升"],
      classifiedMetrics: {
        teamSize: "10 人产品团队",
        users: "100+ 研发用户",
        customersProjects: "10+ 客户 / 项目",
        efficiency: "50%+ 文档生成效率提升",
        agents: "知识库 + RAG + 原生工具调用 + 人工确认",
      },
      transferableCapabilities: ["复杂对象建模", "平台产品规划", "客户与商业闭环", "AI 产品化判断", "团队管理"],
      riskNotes: [],
    },
    createdAt: now,
    updatedAt: now,
  };
}
