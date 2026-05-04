import { describe, it, expect } from "vitest";
import { generatePresentationDraft } from "./generator";
import type { ResumeData } from "@/types";

/** Minimal resume data — simulates what the parser produces from a raw resume upload. */
const MINIMAL_RESUME: ResumeData = {
  profile: {
    id: "1",
    name: "张三",
    email: "zhangsan@example.com",
    title: "产品经理",
    summary: "5 年互联网产品经验，擅长 B 端 SaaS 产品设计。",
  },
  timeline: [
    {
      id: "t1",
      company: "字节跳动",
      position: "高级产品经理",
      startDate: "2022-03",
      endDate: "至今",
      description: "负责飞书审批模块的产品设计，推动审批流程自动化。",
      highlights: [
        "审批流程自动化覆盖率从 30% 提升至 85%",
        "日均审批处理量提升 200%",
        "用户满意度 NPS 从 42 提升至 67",
      ],
      projects: [],
      skills: ["B端产品", "SaaS", "流程自动化"],
      order: 0,
      careerKind: "fulltime",
      storyMood: "impact",
    },
    {
      id: "t2",
      company: "阿里巴巴",
      position: "产品经理",
      startDate: "2019-07",
      endDate: "2022-02",
      description: "负责钉钉考勤模块，覆盖千万级企业用户。",
      highlights: [
        "考勤模块 DAU 突破 500 万",
        "主导考勤规则引擎重构，配置效率提升 3 倍",
      ],
      projects: [],
      skills: ["C端产品", "数据驱动"],
      order: 1,
      careerKind: "fulltime",
      storyMood: "growth",
    },
    {
      id: "t3",
      company: "美团",
      position: "产品实习生",
      startDate: "2018-06",
      endDate: "2019-06",
      description: "参与外卖商家后台产品设计。",
      highlights: ["商家后台操作步骤减少 40%"],
      projects: [],
      skills: ["需求分析"],
      order: 2,
      careerKind: "internship",
      storyMood: "focus",
    },
  ],
  skills: [
    { id: "s1", name: "B端产品设计", category: "产品", level: 5, parentId: null },
    { id: "s2", name: "数据分析", category: "产品", level: 4, parentId: null },
    { id: "s3", name: "SaaS", category: "行业", level: 4, parentId: null },
    { id: "s4", name: "用户研究", category: "产品", level: 3, parentId: null },
  ],
  architecture: [],
  education: [{ id: "e1", school: "北京大学", degree: "硕士", major: "计算机", startDate: "2016", endDate: "2018" }],
  roleUnderstanding: {
    targetRoleTitle: "B端产品负责人",
    oneLineInterpretation: "用产品思维重构企业协作效率",
    priorityProblems: [
      { id: "p1", problem: "企业审批流程碎片化", impact: "效率损失 30%+", evidence: "" },
      { id: "p2", problem: "跨部门协作信息孤岛", impact: "重复劳动严重", evidence: "" },
    ],
    ninetyDayPlan: { day0To30: "调研现状", day31To60: "制定方案", day61To90: "推动落地" },
    experienceMappings: [
      { id: "m1", requirement: "B端产品设计能力", myExperience: "飞书审批模块", outcomeEvidence: "审批自动化覆盖率 30%→85%" },
    ],
  },
};

/** Rich resume data — simulates what the interview prep flow produces (with story/evidence fields). */
const RICH_RESUME: ResumeData = {
  ...MINIMAL_RESUME,
  timeline: MINIMAL_RESUME.timeline.map((t, i) => ({
    ...t,
    storyTitle: i === 0 ? "飞书审批：重新定义企业审批效率" : t.storyTitle,
    storyScene: i === 0 ? "企业审批流程存在大量手工环节，平均耗时 3 天" : undefined,
    storyChallenge: i === 0 ? "如何在不影响灵活性的前提下实现自动化" : undefined,
    storyAction: i === 0 ? "设计规则引擎 + 智能路由，覆盖 85% 常见场景" : undefined,
    storyOutcome: i === 0 ? "审批处理量提升 200%，NPS 从 42 到 67" : undefined,
    evidenceResult: i === 0 ? "日均审批处理量 10 万+，自动化率 85%" : undefined,
    evidenceProof: i === 0 ? "飞书官方数据看板" : undefined,
    evidenceStrength: i === 0 ? ("strong" as const) : undefined,
    storyReflection: i === 0 ? "产品最大的价值是让人从重复劳动中解放" : undefined,
  })),
  roleUnderstanding: {
    ...MINIMAL_RESUME.roleUnderstanding,
    priorityProblems: [
      { id: "p1", problem: "企业审批流程碎片化", impact: "每年浪费 30% 人力在手工流转", evidence: "调研 50 家企业平均审批 3.2 天" },
      { id: "p2", problem: "跨部门协作信息孤岛", impact: "重复劳动导致人均效率下降 25%", evidence: "钉钉内部效率报告" },
    ],
  },
};

describe("generatePresentationDraft", () => {
  describe("with minimal resume data (raw upload)", () => {
    const draft = generatePresentationDraft(MINIMAL_RESUME);

    it("produces 8 slides", () => {
      expect(draft.slides).toHaveLength(8);
    });

    it("hero slide has meaningful title from profile", () => {
      const hero = draft.slides.find((s) => s.id === "hero")!;
      expect(hero.title).toContain("张三");
      expect(hero.title).toContain("用产品思维重构企业协作效率");
      expect(hero.bullets.length).toBeGreaterThanOrEqual(2);
    });

    it("foundation slide uses company names and highlights", () => {
      const foundation = draft.slides.find((s) => s.id === "foundation")!;
      expect(foundation.title).toContain("字节跳动");
      expect(foundation.bullets.some((b) => b.includes("字节跳动"))).toBe(true);
      expect(foundation.bullets.some((b) => b.includes("审批流程自动化覆盖率"))).toBe(true);
    });

    it("tension slide uses roleUnderstanding problems", () => {
      const tension = draft.slides.find((s) => s.id === "tension")!;
      expect(tension.title).toContain("审批流程碎片化");
      expect(tension.bullets.some((b) => b.includes("审批流程碎片化"))).toBe(true);
      expect(tension.bullets.some((b) => b.includes("效率损失"))).toBe(true);
    });

    it("platform-build slide uses top experience highlights", () => {
      const pb = draft.slides.find((s) => s.id === "platform-build")!;
      expect(pb.title).toContain("字节跳动");
      expect(pb.bullets.some((b) => b.includes("200%"))).toBe(true);
      expect(pb.overlayIds).toBeDefined();
      expect(pb.overlayIds!.length).toBeGreaterThan(0);
    });

    it("impact slide extracts metrics from highlights", () => {
      const impact = draft.slides.find((s) => s.id === "impact")!;
      // Should find quantified metrics
      const hasMetric = impact.bullets.some((b) => /\d/.test(b));
      expect(hasMetric).toBe(true);
    });

    it("resolution slide has career arc title", () => {
      const resolution = draft.slides.find((s) => s.id === "resolution")!;
      expect(resolution.title).toContain("张三");
      expect(resolution.title).toContain("职业弧线");
    });

    it("overlays are created for experience details", () => {
      expect(draft.overlays.length).toBeGreaterThanOrEqual(1);
    });

    it("every slide has non-empty title and bullets", () => {
      for (const slide of draft.slides) {
        expect(slide.title.length).toBeGreaterThan(0);
        expect(slide.bullets.length).toBeGreaterThan(0);
        for (const bullet of slide.bullets) {
          expect(bullet.length).toBeGreaterThan(0);
        }
      }
    });

    it("every slide has sourceRefs", () => {
      for (const slide of draft.slides) {
        expect(slide.sourceRefs.length).toBeGreaterThan(0);
      }
    });
  });

  describe("with rich resume data (interview prep)", () => {
    const draft = generatePresentationDraft(RICH_RESUME);

    it("produces 8 slides", () => {
      expect(draft.slides).toHaveLength(8);
    });

    it("hero uses oneLineInterpretation in title", () => {
      const hero = draft.slides.find((s) => s.id === "hero")!;
      expect(hero.title).toContain("用产品思维重构企业协作效率");
    });

    it("platform-build uses storyTitle when available", () => {
      const pb = draft.slides.find((s) => s.id === "platform-build")!;
      expect(pb.title).toContain("飞书审批");
    });

    it("tension slide uses evidence-backed problems", () => {
      const tension = draft.slides.find((s) => s.id === "tension")!;
      expect(tension.bullets.some((b) => b.includes("调研 50 家企业"))).toBe(true);
    });

    it("impact slide uses evidenceResult", () => {
      const impact = draft.slides.find((s) => s.id === "impact")!;
      expect(impact.bullets.some((b) => b.includes("日均审批处理量 10 万"))).toBe(true);
    });

    it("resolution uses storyReflection", () => {
      const resolution = draft.slides.find((s) => s.id === "resolution")!;
      expect(resolution.body).toContain("产品最大的价值");
    });

    it("overlays include experience-mapping from roleUnderstanding", () => {
      const mappingOverlays = draft.overlays.filter((o) => o.kind === "experience-mapping");
      expect(mappingOverlays.length).toBeGreaterThanOrEqual(1);
      expect(mappingOverlays[0]!.body).toContain("审批自动化覆盖率");
    });
  });

  describe("edge cases", () => {
    it("handles empty timeline gracefully", () => {
      const empty: ResumeData = { ...MINIMAL_RESUME, timeline: [], skills: [] };
      const draft = generatePresentationDraft(empty);
      expect(draft.slides.length).toBeGreaterThanOrEqual(5); // hero, tension, fullstack, impact, resolution
      for (const slide of draft.slides) {
        expect(slide.title.length).toBeGreaterThan(0);
      }
    });

    it("handles single experience", () => {
      const single: ResumeData = { ...MINIMAL_RESUME, timeline: MINIMAL_RESUME.timeline.slice(0, 1) };
      const draft = generatePresentationDraft(single);
      expect(draft.slides).toHaveLength(7); // no agent-leap with only 1 experience
    });

    it("handles no roleUnderstanding", () => {
      const noRole: ResumeData = {
        ...MINIMAL_RESUME,
        roleUnderstanding: {
          targetRoleTitle: "",
          oneLineInterpretation: "",
          priorityProblems: [],
          ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
          experienceMappings: [],
        },
      };
      const draft = generatePresentationDraft(noRole);
      expect(draft.slides).toHaveLength(8);
      // Tension should synthesize from career data
      const tension = draft.slides.find((s) => s.id === "tension")!;
      expect(tension.title.length).toBeGreaterThan(0);
    });
  });
});
