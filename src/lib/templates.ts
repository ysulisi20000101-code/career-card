import type { SkillNode, ArchitectureModule } from "@/types";
import { generateId } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Skill Map Templates
// ---------------------------------------------------------------------------

function makeSkill(
  name: string,
  category: string,
  level: number,
  parentId: string | null,
  id?: string,
): SkillNode {
  return { id: id ?? generateId(), name, category, level, parentId };
}

export function getProductManagerSkillTemplate(): SkillNode[] {
  const rootId = "skill-root";
  const nodes: SkillNode[] = [
    makeSkill("技能体系", "root", 5, null, rootId),
  ];

  const branches: { name: string; category: string; children: { name: string; level: number }[] }[] = [
    {
      name: "B端产品",
      category: "B端产品",
      children: [
        { name: "需求分析", level: 5 },
        { name: "产品架构", level: 4 },
        { name: "数据建模", level: 4 },
        { name: "SaaS设计", level: 3 },
      ],
    },
    {
      name: "C端产品",
      category: "C端产品",
      children: [
        { name: "用户研究", level: 4 },
        { name: "交互设计", level: 4 },
        { name: "增长策略", level: 3 },
        { name: "A/B测试", level: 3 },
      ],
    },
    {
      name: "AI产品",
      category: "AI产品",
      children: [
        { name: "NLP应用", level: 3 },
        { name: "推荐系统", level: 3 },
        { name: "LLM产品", level: 4 },
        { name: "数据标注", level: 2 },
      ],
    },
    {
      name: "数据产品",
      category: "数据产品",
      children: [
        { name: "数据分析", level: 4 },
        { name: "BI看板", level: 4 },
        { name: "指标体系", level: 3 },
        { name: "数据治理", level: 2 },
      ],
    },
    {
      name: "工具技能",
      category: "工具技能",
      children: [
        { name: "Axure", level: 5 },
        { name: "Figma", level: 4 },
        { name: "SQL", level: 3 },
        { name: "Python", level: 2 },
      ],
    },
  ];

  branches.forEach((branch) => {
    const branchId = generateId();
    nodes.push(makeSkill(branch.name, branch.category, 4, rootId, branchId));
    branch.children.forEach((child) => {
      nodes.push(makeSkill(child.name, branch.category, child.level, branchId));
    });
  });

  return nodes;
}

export function getEngineerSkillTemplate(): SkillNode[] {
  const rootId = "skill-root";
  const nodes: SkillNode[] = [makeSkill("技能体系", "root", 5, null, rootId)];

  const branches: { name: string; category: string; children: { name: string; level: number }[] }[] = [
    {
      name: "前端开发",
      category: "前端开发",
      children: [
        { name: "React", level: 5 },
        { name: "TypeScript", level: 5 },
        { name: "Next.js", level: 4 },
        { name: "CSS/Tailwind", level: 4 },
      ],
    },
    {
      name: "后端开发",
      category: "后端开发",
      children: [
        { name: "Node.js", level: 4 },
        { name: "Go", level: 3 },
        { name: "数据库", level: 4 },
        { name: "微服务", level: 3 },
      ],
    },
    {
      name: "DevOps",
      category: "DevOps",
      children: [
        { name: "Docker", level: 4 },
        { name: "K8s", level: 3 },
        { name: "CI/CD", level: 4 },
        { name: "监控告警", level: 3 },
      ],
    },
    {
      name: "架构设计",
      category: "架构设计",
      children: [
        { name: "系统设计", level: 4 },
        { name: "性能优化", level: 3 },
        { name: "安全", level: 3 },
      ],
    },
  ];

  branches.forEach((branch) => {
    const branchId = generateId();
    nodes.push(makeSkill(branch.name, branch.category, 4, rootId, branchId));
    branch.children.forEach((child) => {
      nodes.push(makeSkill(child.name, branch.category, child.level, branchId));
    });
  });

  return nodes;
}

export function getDesignerSkillTemplate(): SkillNode[] {
  const rootId = "skill-root";
  const nodes: SkillNode[] = [makeSkill("技能体系", "root", 5, null, rootId)];

  const branches: { name: string; category: string; children: { name: string; level: number }[] }[] = [
    {
      name: "UI设计",
      category: "UI设计",
      children: [
        { name: "Figma", level: 5 },
        { name: "Sketch", level: 4 },
        { name: "设计系统", level: 4 },
        { name: "组件库", level: 3 },
      ],
    },
    {
      name: "UX设计",
      category: "UX设计",
      children: [
        { name: "用户研究", level: 4 },
        { name: "信息架构", level: 4 },
        { name: "可用性测试", level: 3 },
        { name: "原型设计", level: 4 },
      ],
    },
    {
      name: "视觉设计",
      category: "视觉设计",
      children: [
        { name: "品牌设计", level: 3 },
        { name: "插画", level: 3 },
        { name: "动效设计", level: 3 },
      ],
    },
  ];

  branches.forEach((branch) => {
    const branchId = generateId();
    nodes.push(makeSkill(branch.name, branch.category, 4, rootId, branchId));
    branch.children.forEach((child) => {
      nodes.push(makeSkill(child.name, branch.category, child.level, branchId));
    });
  });

  return nodes;
}

export const skillTemplates = {
  "产品经理": getProductManagerSkillTemplate,
  "工程师": getEngineerSkillTemplate,
  "设计师": getDesignerSkillTemplate,
} as const;

// ---------------------------------------------------------------------------
// Architecture Templates
// ---------------------------------------------------------------------------

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
  const spacing = 250;
  const labels = [
    { title: "产品规划", desc: "市场调研、竞品分析、路线图" },
    { title: "产品设计", desc: "需求文档、原型、交互" },
    { title: "研发", desc: "前端、后端、移动端开发" },
    { title: "测试", desc: "功能测试、性能测试、自动化" },
    { title: "运维", desc: "部署、监控、故障排查" },
    { title: "运营", desc: "用户增长、内容运营、数据运营" },
  ];

  const modules: ArchitectureModule[] = [
    makeMod("互联网业务架构", "端到端产品交付流程", "business", "internet", { x: 350, y: 0 }, null, rootId),
  ];

  labels.forEach((l, i) => {
    modules.push(
      makeMod(l.title, l.desc, "business", "internet", { x: i * spacing, y: 150 }, rootId),
    );
  });

  return modules;
}

export function getInternetTechTemplate(): ArchitectureModule[] {
  const rootId = "arch-root";
  const spacing = 250;
  const labels = [
    { title: "前端", desc: "React/Vue/小程序" },
    { title: "后端", desc: "API网关、微服务" },
    { title: "数据库", desc: "MySQL、MongoDB、Redis" },
    { title: "缓存", desc: "Redis、Memcached" },
    { title: "消息队列", desc: "Kafka、RabbitMQ" },
    { title: "云服务", desc: "AWS/阿里云/腾讯云" },
  ];

  const modules: ArchitectureModule[] = [
    makeMod("互联网技术架构", "全栈技术基础设施", "technical", "internet", { x: 350, y: 0 }, null, rootId),
  ];

  labels.forEach((l, i) => {
    modules.push(
      makeMod(l.title, l.desc, "technical", "internet", { x: i * spacing, y: 150 }, rootId),
    );
  });

  return modules;
}

export function getAutomotiveBusinessTemplate(): ArchitectureModule[] {
  const rootId = "arch-root";
  const spacing = 260;
  const labels = [
    { title: "产品规划", desc: "整车定义、配置管理" },
    { title: "研发设计", desc: "造型设计、工程开发" },
    { title: "制造生产", desc: "工厂管理、质量控制" },
    { title: "销售服务", desc: "经销商管理、金融服务" },
    { title: "售后支持", desc: "客户服务、备件管理" },
  ];

  const modules: ArchitectureModule[] = [
    makeMod("汽车业务架构", "整车全生命周期", "business", "automotive", { x: 300, y: 0 }, null, rootId),
  ];

  labels.forEach((l, i) => {
    modules.push(
      makeMod(l.title, l.desc, "business", "automotive", { x: i * spacing, y: 150 }, rootId),
    );
  });

  return modules;
}

export function getFinanceBusinessTemplate(): ArchitectureModule[] {
  const rootId = "arch-root";
  const spacing = 280;
  const labels = [
    { title: "前台业务", desc: "零售银行、公司银行、投资银行" },
    { title: "中台支持", desc: "产品管理、客户管理、渠道管理" },
    { title: "后台保障", desc: "清算结算、会计核算、IT基础设施" },
    { title: "风险管理", desc: "信用风险、市场风险、合规管理" },
  ];

  const modules: ArchitectureModule[] = [
    makeMod("金融业务架构", "银行业务分层架构", "business", "finance", { x: 300, y: 0 }, null, rootId),
  ];

  labels.forEach((l, i) => {
    modules.push(
      makeMod(l.title, l.desc, "business", "finance", { x: i * spacing, y: 150 }, rootId),
    );
  });

  return modules;
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
