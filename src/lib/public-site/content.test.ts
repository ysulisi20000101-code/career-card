import { describe, expect, it } from "vitest";
import type { ResumeData, TimelineNode } from "@/types";
import { buildPublicSiteContent } from "./content";

function node(partial: Partial<TimelineNode>): TimelineNode {
  return {
    id: partial.id ?? crypto.randomUUID(),
    company: partial.company ?? "",
    position: partial.position ?? "",
    startDate: partial.startDate ?? "2021-01",
    endDate: partial.endDate ?? "2021-06",
    description: partial.description ?? "",
    highlights: partial.highlights ?? [],
    projects: [],
    skills: partial.skills ?? [],
    order: partial.order ?? 0,
    careerKind: partial.careerKind,
    promotionStages: partial.promotionStages,
  };
}

const data: ResumeData = {
  profile: {
    id: "profile",
    name: "李锦涛",
    email: "YSUlijintao@163.com",
    phone: "135-0317-5358",
    title: "平台产品负责人 / AI 产品负责人（工具链产品经理 → 产品负责人 → 产品总监）",
    summary:
      "企业级 AI Agent 落地能力：主导设计受控式 AI Agent 工作流。平台产品与团队管理能力：经历工具链产品经理 → 产品负责人 → 产品总监，管理约 10 人产品团队。ToB 商业闭环能力：覆盖汽车、军工等 10+ 客户及项目，服务 100+ 人研发团队，效率提升 50%+。",
  },
  publicSiteTemplate: "executive-dossier",
  timeline: [
    node({
      id: "jd-health",
      company: "京东健康",
      position: "后台产品实习生",
      startDate: "2020-12",
      endDate: "2021-03",
      careerKind: "internship",
      highlights: ["独立跟进 0-1 阶段测评中台，提高日问诊单量 5.1%。"],
      skills: ["后台产品", "用户路径"],
    }),
    node({
      id: "baidu",
      company: "百度",
      position: "后台产品实习生",
      startDate: "2021-05",
      endDate: "2021-09",
      careerKind: "internship",
      highlights: ["搭建机构答主系统和数据看板。"],
      skills: ["数据分析", "运营机制"],
    }),
    node({
      id: "jd",
      company: "京东",
      position: "用户产品实习生",
      startDate: "2021-12",
      endDate: "2022-04",
      careerKind: "internship",
      highlights: ["完成商品卡片样式统一和商详页样式改版。"],
      skills: ["用户路径优化"],
    }),
    node({
      id: "jingwei",
      company: "经纬恒润",
      position: "产品设计部｜工具链产品经理",
      startDate: "2022-08",
      endDate: "2023-06",
      careerKind: "fulltime",
      description: "对通信系统设计工具、诊断系统设计工具和整车功能架构建模工具进行产品功能设计。",
      highlights: ["将 VDE 云端线上化，设计用户管理、审核提交、变更记录、版本管理等功能。"],
      skills: ["Visio", "工具链产品"],
    }),
    node({
      id: "gkcs",
      company: "国科础石",
      position: "平台产品负责人 / AI 产品负责人",
      startDate: "2023-06",
      endDate: "至今",
      careerKind: "fulltime",
      description: "平台覆盖汽车、军工等 10+ 客户与项目，服务 100+ 人研发团队。",
      highlights: ["完成通信设计工具链从 0 到 1 的突破。"],
      skills: ["AI Agent", "RAG", "团队管理"],
      promotionStages: [
        {
          id: "stage-1",
          title: "平台产品经理 / 工具链产品经理",
          period: "2023.06 - 2024.12",
          teamScale: "",
          leadershipType: "none",
          responsibility: "推动 SOME/IP 工具建设。",
          outcome: "沉淀平台通用模块。",
          reflection: "",
        },
        {
          id: "stage-2",
          title: "产品负责人 / 产品总监",
          period: "2025.01 - 至今",
          teamScale: "10人",
          leadershipType: "solid",
          responsibility: "管理约 10 人产品团队。",
          outcome: "覆盖 10+ 客户项目。",
          reflection: "",
        },
      ],
    }),
  ],
  skills: [],
  skillProfile: {
    templateId: "product-manager",
    roleName: "产品负责人",
    confidence: 90,
    categories: [],
    coverage: { owned: 4, total: 10, coreOwned: 2, coreTotal: 4, percent: 40 },
    detectedSkillNames: ["业务分析", "需求分析", "AI Agent", "团队管理", "商业化", "平台产品"],
  },
  roleTemplateId: "product-manager",
  architecture: [],
  education: [],
  roleUnderstanding: {
    targetRoleTitle: "",
    oneLineInterpretation: "",
    priorityProblems: [],
    ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
    experienceMappings: [],
  },
};

describe("buildPublicSiteContent", () => {
  it("compresses overview and hides meaningless zero metrics", () => {
    const content = buildPublicSiteContent(data);
    expect(content.overview.targetRole).toBe("平台产品负责人 / AI 产品负责人");
    expect(content.overview.heroOutcome.length).toBeLessThanOrEqual(88);
    expect(content.overview.heroOutcome).not.toContain("…");
    expect(content.overview.metrics.every((metric) => metric.value !== "0")).toBe(true);
    expect(content.overview.summaryBullets.length).toBeLessThanOrEqual(3);
  });

  it("keeps early practice concise and splits the latest role into two phases", () => {
    const content = buildPublicSiteContent(data);
    const copy = JSON.stringify(content);

    expect(content.journey.map((item) => item.title)).toContain("产品实习生");
    expect(content.details.find((detail) => detail.id === "internship")?.earlyRows).toHaveLength(3);
    expect(content.details.map((detail) => detail.title)).toContain("阶段一：平台产品经理 / 工具链产品经理");
    expect(content.details.map((detail) => detail.title)).toContain("阶段二：产品负责人 / 产品总监");
    expect(copy).not.toMatch(/候选人|这里合并|可补充|生成|草稿|上传|接触新领域|我换领域/);
  });

  it("assigns contextual tags to each experience instead of reusing one global tag set", () => {
    const content = buildPublicSiteContent(data);
    const skillsById = Object.fromEntries(content.details.map((detail) => [detail.id, detail.skills]));
    const firstTags = content.details.map((detail) => detail.skills[0]).filter(Boolean);

    expect(skillsById.internship).toEqual(expect.arrayContaining(["需求分析", "后台产品"]));
    expect(skillsById.jingwei).toEqual(expect.arrayContaining(["通信设计", "诊断系统"]));
    expect(skillsById["gkcs-stage-1"]).toEqual(expect.arrayContaining(["SOME/IP", "云平台基建"]));
    expect(skillsById["gkcs-stage-2"]).toEqual(expect.arrayContaining(["AI Agent", "知识库/RAG"]));
    expect(new Set(firstTags).size).toBeGreaterThan(2);
  });
});
