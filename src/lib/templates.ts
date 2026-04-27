import type { ArchitectureModule, RoleSkillTemplate, SkillNode } from "@/types";
import { generateId } from "@/lib/utils";

export const roleSkillTemplates: RoleSkillTemplate[] = [
  {
    templateId: "product-manager",
    roleName: "产品负责人",
    aliases: ["产品经理", "产品负责人", "产品总监", "PM", "product manager", "product lead", "AI 产品"],
    categories: [
      {
        id: "discovery",
        name: "业务洞察",
        description: "识别业务问题、用户需求、行业机会和优先级。",
        skills: [
          { id: "business-analysis", name: "业务分析", aliases: ["业务流程", "业务抽象", "复杂业务"], importance: "core", displayGroup: "洞察" },
          { id: "requirement-analysis", name: "需求分析", aliases: ["需求拆解", "需求管理", "PRD"], importance: "core", displayGroup: "洞察" },
          { id: "industry-research", name: "行业研究", aliases: ["竞品", "调研", "行业"], importance: "important", displayGroup: "洞察" },
          { id: "user-research", name: "用户研究", aliases: ["用户调研", "访谈", "客户"], importance: "important", displayGroup: "洞察" },
        ],
      },
      {
        id: "solution",
        name: "方案设计",
        description: "把问题转化为可交付、可验证、可扩展的产品方案。",
        skills: [
          { id: "product-architecture", name: "产品架构", aliases: ["平台架构", "模块设计", "系统工程"], importance: "core", displayGroup: "设计" },
          { id: "prototype", name: "原型设计", aliases: ["Axure", "Figma", "墨刀"], importance: "important", displayGroup: "设计" },
          { id: "ai-product", name: "AI 产品设计", aliases: ["AI Agent", "RAG", "大模型", "原生工具调用"], importance: "core", displayGroup: "设计" },
          { id: "data-product", name: "数据与指标", aliases: ["指标体系", "BI", "数据分析", "看板"], importance: "important", displayGroup: "设计" },
        ],
      },
      {
        id: "delivery",
        name: "推进交付",
        description: "组织资源，让方案跨团队落地并持续迭代。",
        skills: [
          { id: "project-management", name: "项目管理", aliases: ["进度管理", "里程碑", "排期", "交付"], importance: "core", displayGroup: "交付" },
          { id: "cross-functional", name: "跨部门协作", aliases: ["协同", "沟通", "对齐", "研发团队"], importance: "core", displayGroup: "交付" },
          { id: "launch", name: "上线发布", aliases: ["版本发布", "灰度", "验收", "上线"], importance: "important", displayGroup: "交付" },
          { id: "iteration", name: "迭代复盘", aliases: ["复盘", "优化", "反馈"], importance: "important", displayGroup: "交付" },
        ],
      },
      {
        id: "leadership",
        name: "团队与战略",
        description: "从单点负责升级为方向判断、团队管理和商业结果。",
        skills: [
          { id: "roadmap", name: "产品规划", aliases: ["路线图", "规划", "0-1", "体系建设"], importance: "core", displayGroup: "管理" },
          { id: "team-leadership", name: "团队管理", aliases: ["带队", "leader", "负责人", "总监", "管理"], importance: "core", displayGroup: "管理" },
          { id: "stakeholder", name: "干系人管理", aliases: ["客户", "业务方", "售前", "招投标"], importance: "important", displayGroup: "管理" },
          { id: "commercial-impact", name: "商业化结果", aliases: ["商业化", "定价", "签单", "转化", "ARR", "营收"], importance: "important", displayGroup: "管理" },
        ],
      },
      {
        id: "tools",
        name: "工具与表达",
        description: "支撑产品判断、方案表达和跨团队沟通的工具能力。",
        skills: [
          { id: "xmind", name: "XMind", aliases: ["思维导图", "XMind"], importance: "optional", displayGroup: "工具" },
          { id: "office", name: "Office", aliases: ["MS Office", "Excel", "PPT"], importance: "important", displayGroup: "工具" },
          { id: "uml-sysml", name: "UML/SysML", aliases: ["UML", "SysML", "MBSE"], importance: "important", displayGroup: "工具" },
          { id: "engineering-tools", name: "工程工具生态", aliases: ["DOORS", "EA", "PREEvision", "SystemWeaver", "CANdelaStudio"], importance: "optional", displayGroup: "工具" },
        ],
      },
    ],
  },
  {
    templateId: "frontend-engineer",
    roleName: "前端工程师",
    aliases: ["前端", "frontend", "React", "Vue"],
    categories: [
      {
        id: "frontend-core",
        name: "前端基础",
        description: "构建稳定界面的核心工程能力。",
        skills: [
          { id: "javascript", name: "JavaScript", aliases: ["JS", "JavaScript"], importance: "core", displayGroup: "基础" },
          { id: "typescript", name: "TypeScript", aliases: ["TS", "TypeScript"], importance: "core", displayGroup: "基础" },
          { id: "react", name: "React", aliases: ["React", "Next.js"], importance: "core", displayGroup: "框架" },
          { id: "css", name: "CSS/Tailwind", aliases: ["CSS", "Tailwind", "样式"], importance: "important", displayGroup: "体验" },
        ],
      },
      {
        id: "frontend-quality",
        name: "工程质量",
        description: "让项目可维护、可测试、可持续迭代。",
        skills: [
          { id: "testing", name: "测试", aliases: ["单测", "Vitest", "Jest"], importance: "important", displayGroup: "质量" },
          { id: "performance", name: "性能优化", aliases: ["性能", "首屏", "缓存"], importance: "important", displayGroup: "质量" },
          { id: "build", name: "构建部署", aliases: ["Webpack", "Vite", "CI/CD"], importance: "important", displayGroup: "工程" },
        ],
      },
    ],
  },
  {
    templateId: "backend-engineer",
    roleName: "后端工程师",
    aliases: ["后端", "backend", "Java", "Go", "Node"],
    categories: [
      {
        id: "backend-core",
        name: "服务端开发",
        description: "设计稳定服务、接口和数据模型。",
        skills: [
          { id: "api", name: "API 设计", aliases: ["API", "接口"], importance: "core", displayGroup: "服务" },
          { id: "database", name: "数据库", aliases: ["MySQL", "PostgreSQL", "MongoDB"], importance: "core", displayGroup: "数据" },
          { id: "distributed", name: "分布式系统", aliases: ["微服务", "分布式"], importance: "important", displayGroup: "架构" },
          { id: "security", name: "安全与权限", aliases: ["鉴权", "权限", "安全"], importance: "important", displayGroup: "质量" },
        ],
      },
    ],
  },
  {
    templateId: "designer",
    roleName: "设计师",
    aliases: ["设计师", "UI", "UX", "体验设计"],
    categories: [
      {
        id: "design-core",
        name: "体验设计",
        description: "从用户理解到界面表达的完整设计能力。",
        skills: [
          { id: "user-research", name: "用户研究", aliases: ["用户调研", "访谈"], importance: "core", displayGroup: "研究" },
          { id: "interaction", name: "交互设计", aliases: ["交互", "流程"], importance: "core", displayGroup: "体验" },
          { id: "visual", name: "视觉设计", aliases: ["视觉", "品牌"], importance: "important", displayGroup: "表达" },
          { id: "design-system", name: "设计系统", aliases: ["组件库", "规范"], importance: "important", displayGroup: "系统" },
        ],
      },
    ],
  },
  {
    templateId: "operations",
    roleName: "运营",
    aliases: ["运营", "增长", "用户运营", "内容运营"],
    categories: [
      {
        id: "ops-core",
        name: "运营增长",
        description: "通过策略、内容和数据提升业务指标。",
        skills: [
          { id: "growth", name: "增长策略", aliases: ["增长", "转化"], importance: "core", displayGroup: "增长" },
          { id: "content", name: "内容运营", aliases: ["内容", "活动"], importance: "important", displayGroup: "内容" },
          { id: "user-ops", name: "用户运营", aliases: ["用户分层", "留存"], importance: "core", displayGroup: "用户" },
          { id: "data-analysis", name: "数据分析", aliases: ["数据", "指标"], importance: "core", displayGroup: "数据" },
        ],
      },
    ],
  },
  {
    templateId: "data-analyst",
    roleName: "数据分析师",
    aliases: ["数据分析", "数据分析师", "BI", "Tableau", "Power BI"],
    categories: [
      {
        id: "data-core",
        name: "数据分析",
        description: "用数据建模、指标和洞察支撑业务决策。",
        skills: [
          { id: "sql", name: "SQL", aliases: ["SQL"], importance: "core", displayGroup: "工具" },
          { id: "metrics", name: "指标体系", aliases: ["指标", "口径"], importance: "core", displayGroup: "分析" },
          { id: "dashboard", name: "看板搭建", aliases: ["BI", "Tableau", "Power BI", "看板"], importance: "important", displayGroup: "表达" },
          { id: "experiment", name: "实验分析", aliases: ["A/B", "实验"], importance: "important", displayGroup: "分析" },
        ],
      },
    ],
  },
];

function templateToSkillNodes(template: RoleSkillTemplate): SkillNode[] {
  const rootId = "skill-root";
  const nodes: SkillNode[] = [
    {
      id: rootId,
      name: `${template.roleName}能力地图`,
      category: "root",
      level: 5,
      parentId: null,
      status: "owned",
      importance: "core",
    },
  ];

  template.categories.forEach((category) => {
    const categoryId = `category-${category.id}`;
    nodes.push({
      id: categoryId,
      name: category.name,
      category: category.name,
      level: 4,
      parentId: rootId,
      status: "missing",
      importance: "core",
    });
    category.skills.forEach((skill) => {
      nodes.push({
        id: `skill-${skill.id}-${generateId()}`,
        name: skill.name,
        category: category.name,
        level: skill.importance === "core" ? 5 : skill.importance === "important" ? 4 : 3,
        parentId: categoryId,
        status: "missing",
        importance: skill.importance,
        aliases: skill.aliases,
      });
    });
  });

  return nodes;
}

export const skillTemplates = Object.fromEntries(
  roleSkillTemplates.map((template) => [template.roleName, () => templateToSkillNodes(template)]),
) as Record<string, () => SkillNode[]>;

function makeMod(
  title: string,
  description: string,
  type: ArchitectureModule["type"],
  industry: ArchitectureModule["industry"],
  position: { x: number; y: number },
  parentId: string | null,
  id?: string,
): ArchitectureModule {
  return {
    id: id ?? generateId(),
    title,
    description,
    type,
    industry,
    position,
    parentId,
    relatedTimelineIds: [],
  };
}

export function getInternetBusinessTemplate(): ArchitectureModule[] {
  const rootId = "arch-root";
  const labels = [
    ["产品规划", "市场调研、竞品分析、路线图"],
    ["产品设计", "需求文档、原型、交互流程"],
    ["研发交付", "前端、后端、测试协作"],
    ["上线运营", "发布、监控、反馈与迭代"],
    ["数据复盘", "指标、看板、增长分析"],
  ];
  return [
    makeMod("互联网业务架构", "端到端产品交付流程", "business", "internet", { x: 350, y: 0 }, null, rootId),
    ...labels.map(([title, desc], index) =>
      makeMod(title, desc, "business", "internet", { x: index * 240, y: 160 }, rootId),
    ),
  ];
}

export function getInternetTechTemplate(): ArchitectureModule[] {
  const rootId = "arch-root";
  const labels = [
    ["前端", "React/Vue/小程序"],
    ["后端", "API 网关、业务服务"],
    ["数据层", "数据库、缓存、消息队列"],
    ["基础设施", "部署、监控、告警"],
  ];
  return [
    makeMod("互联网技术架构", "全栈技术基础设施", "technical", "internet", { x: 350, y: 0 }, null, rootId),
    ...labels.map(([title, desc], index) =>
      makeMod(title, desc, "technical", "internet", { x: index * 260, y: 160 }, rootId),
    ),
  ];
}

export function getAutomotiveBusinessTemplate(): ArchitectureModule[] {
  const rootId = "arch-root";
  return [
    makeMod("汽车业务架构", "整车全生命周期", "business", "automotive", { x: 300, y: 0 }, null, rootId),
    makeMod("产品规划", "车型定义、配置管理", "business", "automotive", { x: 0, y: 160 }, rootId),
    makeMod("研发设计", "造型、工程、验证", "business", "automotive", { x: 260, y: 160 }, rootId),
    makeMod("销售服务", "渠道、金融、售后", "business", "automotive", { x: 520, y: 160 }, rootId),
  ];
}

export function getFinanceBusinessTemplate(): ArchitectureModule[] {
  const rootId = "arch-root";
  return [
    makeMod("金融业务架构", "金融业务分层结构", "business", "finance", { x: 300, y: 0 }, null, rootId),
    makeMod("前台业务", "获客、交易、服务", "business", "finance", { x: 0, y: 160 }, rootId),
    makeMod("中台支持", "产品、风控、渠道", "business", "finance", { x: 280, y: 160 }, rootId),
    makeMod("后台保障", "清结算、合规、IT", "business", "finance", { x: 560, y: 160 }, rootId),
  ];
}

export type ArchTemplateKey =
  | "互联网-业务架构"
  | "互联网-技术架构"
  | "汽车-业务架构"
  | "金融-业务架构";

export const architectureTemplates: Record<ArchTemplateKey, () => ArchitectureModule[]> = {
  "互联网-业务架构": getInternetBusinessTemplate,
  "互联网-技术架构": getInternetTechTemplate,
  "汽车-业务架构": getAutomotiveBusinessTemplate,
  "金融-业务架构": getFinanceBusinessTemplate,
};
