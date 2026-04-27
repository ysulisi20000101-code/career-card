import { describe, expect, it } from "vitest";
import type { TimelineNode } from "@/types";
import { buildSkillProfile, detectRoleTemplate } from "./profile";

const productTimeline: TimelineNode[] = [
  {
    id: "tl-product",
    company: "国科础石",
    position: "产品负责人",
    startDate: "2023-06",
    endDate: "至今",
    description: "负责平台产品规划、AI Agent 工作流、RAG 知识库和 ToB 售前商业化。",
    highlights: [
      "主导产品规划、需求分析、业务分析和产品架构设计。",
      "推动跨部门协作、项目管理和上线发布，服务 100+ 人研发团队。",
      "经历产品负责人到产品总监晋升，管理约 10 人产品团队。",
    ],
    projects: [],
    skills: ["产品规划", "需求分析", "产品架构", "AI Agent", "团队管理", "商业化"],
    order: 0,
    careerKind: "fulltime",
  },
];

describe("skill profile", () => {
  it("detects the product template for product-oriented resumes", () => {
    const template = detectRoleTemplate({
      text: "负责 B 端产品规划、需求分析、跨部门协作和团队管理。",
      profileTitle: "高级产品经理",
      timeline: productTimeline,
    });

    expect(template.templateId).toBe("product-manager");
  });

  it("builds owned coverage from timeline highlights", () => {
    const profile = buildSkillProfile({
      text: "8 年平台产品经验，擅长 AI 产品设计、商业化和团队管理。",
      profileTitle: "产品负责人",
      timeline: productTimeline,
    });

    expect(profile.roleName).toBe("产品负责人");
    expect(profile.coverage.owned).toBeGreaterThan(0);
    expect(profile.detectedSkillNames).toContain("团队管理");
  });
});
