import { describe, expect, it } from "vitest";
import type { ResumeData } from "@/types";
import {
  isSlideLabelUpdateCompatible,
  mergePresentationEnhancements,
  normalizeEnhancementOutput,
} from "@/lib/agent/presentation/normalize-presentation";
import type { ValidationIssue } from "@/lib/agent/presentation/types";
import { resolveOpenOverlayId } from "@/components/presentation/story-deck/presentation-shell";
import { generatePresentationDraft } from "./generator";
import { buildInterviewNarrativeProfile, classifyMetrics } from "./interview-story";

const AGENT_MBSE_RESUME: ResumeData = {
  profile: {
    id: "p1",
    name: "李锦涛",
    email: "test@example.com",
    title: "平台产品负责人 / AI 产品负责人",
    summary: "企业级 AI Agent、RAG 知识库、Groot-Arch 架构工具链、ToB 商业化。",
  },
  timeline: [
    {
      id: "t1",
      company: "国科础石",
      position: "平台产品负责人 / AI 产品负责人",
      startDate: "2023-06",
      endDate: "至今",
      description: "负责 Groot-Arch、一体化智能工具平台、受控 AI Agent 工作流和 RAG 知识库。",
      highlights: [
        "建设 5 个 Agent 场景，覆盖文档生成、模型生成、一致性校验、方案推荐、知识检索",
        "文档/沟通/设计效率提升 50%+，研发全流程效率提升 20%+",
        "覆盖 100+ 研发用户，管理/协同约 10 人产品团队，支撑 10+ 客户/项目售前投标与交付",
        "涉及 SOME/IP、ARXML、ROS2、UML、SysML、DOORS、PREEvision、SystemWeaver、CANdelaStudio、CANdb++、VDE",
      ],
      projects: [],
      skills: ["AI Agent", "RAG", "Groot-Arch", "MBSE", "工具链"],
      order: 0,
      careerKind: "fulltime",
      storyMood: "impact",
    },
    {
      id: "t2",
      company: "经纬恒润",
      position: "工具链产品经理",
      startDate: "2022-08",
      endDate: "2023-06",
      description: "负责通信/诊断设计工具、VDE 云平台和自研架构建模工具。",
      highlights: ["参与 VDE Cloud SaaS、诊断设计系统和架构建模工具规划"],
      projects: [],
      skills: ["通信设计", "诊断设计", "VDE"],
      order: 1,
      careerKind: "fulltime",
      storyMood: "growth",
    },
    {
      id: "t3",
      company: "百度",
      position: "后台产品实习生",
      startDate: "2021-06",
      endDate: "2021-09",
      description: "MEG 知识业务部后台产品实习，参与在线问答产品。",
      highlights: ["需求分析、后台系统、用户问题拆解"],
      projects: [],
      skills: ["需求分析", "后台系统", "用户问题"],
      order: 2,
      careerKind: "internship",
      storyMood: "growth",
    },
    {
      id: "t4",
      company: "京东健康",
      position: "后台产品实习生",
      startDate: "2020-06",
      endDate: "2020-09",
      description: "互联网医院产品部实习，参与在线问诊和购药流程。",
      highlights: ["业务理解、用户问题、跨团队沟通"],
      projects: [],
      skills: ["业务理解", "用户问题", "跨团队沟通"],
      order: 3,
      careerKind: "internship",
      storyMood: "growth",
    },
  ],
  skills: [
    { id: "s1", name: "AI Agent", category: "AI", level: 5, parentId: null },
    { id: "s2", name: "RAG", category: "AI", level: 5, parentId: null },
    { id: "s3", name: "MBSE", category: "系统工程", level: 4, parentId: null },
  ],
  architecture: [],
  education: [],
  roleUnderstanding: {
    targetRoleTitle: "Agent 产品总监",
    oneLineInterpretation: "把复杂系统工程平台化，再用受控 Agent 完成企业级落地",
    priorityProblems: [],
    ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
    experienceMappings: [],
  },
};

const GENERIC_RESUME: ResumeData = {
  profile: {
    id: "p2",
    name: "张三",
    email: "generic@example.com",
    title: "增长产品经理",
    summary: "负责会员增长、转化漏斗和数据分析。",
  },
  timeline: [
    {
      id: "g1",
      company: "某互联网公司",
      position: "增长产品经理",
      startDate: "2021-01",
      endDate: "至今",
      description: "负责会员增长策略和活动工具。",
      highlights: ["会员转化率提升 18%", "活动配置效率提升 30%"],
      projects: [],
      skills: ["增长", "数据分析", "A/B 测试"],
      order: 0,
      careerKind: "fulltime",
      storyMood: "impact",
    },
  ],
  skills: [
    { id: "gs1", name: "增长策略", category: "产品", level: 5, parentId: null },
    { id: "gs2", name: "数据分析", category: "产品", level: 4, parentId: null },
  ],
  architecture: [],
  education: [],
  roleUnderstanding: {
    targetRoleTitle: "增长产品负责人",
    oneLineInterpretation: "用数据和实验体系提升用户增长效率",
    priorityProblems: [],
    ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
    experienceMappings: [],
  },
};

describe("interview story blueprint", () => {
  it("activates the enterprise Agent/MBSE preset only when resume evidence matches", () => {
    const profile = buildInterviewNarrativeProfile(AGENT_MBSE_RESUME);
    expect(profile.presetId).toBe("enterprise-ai-agent-mbse");
    expect(profile.evidenceKeywords).toContain("Groot-Arch");
    expect(profile.metrics.some((metric) => metric.includes("50%+"))).toBe(true);
  });

  it("renders the reference-style 8-slide arc for the matching resume", () => {
    const draft = generatePresentationDraft(AGENT_MBSE_RESUME);
    expect(draft.narrativeProfile?.presetId).toBe("enterprise-ai-agent-mbse");
    expect(draft.storyBlueprint?.slideArc).toHaveLength(8);

    const hero = draft.slides.find((slide) => slide.id === "hero")!;
    const agentLeap = draft.slides.find((slide) => slide.id === "agent-leap")!;
    const resolution = draft.slides.find((slide) => slide.id === "resolution")!;

    expect(hero.title).toContain("李锦涛");
    expect(hero.visualizations?.[0]?.type).toBe("hero-architecture");
    expect(agentLeap.title).toContain("第一件事不是 Agent");
    expect(agentLeap.visualizations?.[0]?.type).toBe("agent-workflow");
    expect(resolution.visualizations?.[0]?.data).toMatchObject({ variant: "complete" });
    expect(resolution.closingQuote).toContain("李锦涛");
  });

  it("cleans inherited labels and binds phase tags to the correct slide beats", () => {
    const draft = generatePresentationDraft(AGENT_MBSE_RESUME);
    const labelsBySlide = Object.fromEntries(draft.slides.map((slide) => [slide.id, slide.phaseTag]));

    expect(labelsBySlide.hero).toBe("目标定位");
    expect(labelsBySlide.foundation).toBe("早期训练");
    expect(labelsBySlide.tension).toBe("行业断点");
    expect(labelsBySlide["platform-build"]).toBe("平台阶段");
    expect(labelsBySlide["agent-leap"]).toBe("Agent 跃迁");
    expect(labelsBySlide.fullstack).toBe("全链路");
    expect(labelsBySlide.impact).toBe("商业结果");
    expect(labelsBySlide.resolution).toBe("个人主张");
    expect(draft.slides.find((slide) => slide.id === "hero")?.summaryLine).not.toContain("经纬恒润");
  });

  it("classifies 10 people as team size instead of commercial proof", () => {
    const profile = buildInterviewNarrativeProfile(AGENT_MBSE_RESUME);
    const metrics = classifyMetrics(profile);
    const draft = generatePresentationDraft(AGENT_MBSE_RESUME);
    const impact = draft.slides.find((slide) => slide.id === "impact")!;
    const commercialCard = impact.cards?.find((card) => /客户|项目/.test(card.title));
    const teamCard = impact.cards?.find((card) => /团队|协同/.test(card.title));

    expect(metrics.teamSize).toContain("10 人");
    expect(metrics.customersProjects).toContain("10+ 客户/项目");
    expect(teamCard?.body).toContain("10 人");
    expect(commercialCard?.body).toContain("10+ 客户/项目");
    expect(commercialCard?.body).not.toContain("10 人");
  });

  it("does not classify unrelated numbers as business metrics", () => {
    const metrics = classifyMetrics({
      metrics: [
        "7 类冲突场景：功能触发、执行时序、网络通信",
        "第 3 页 / 8 页",
        "2025.01：负责一体化平台与 AI Agent",
        "文档沟通效率提升 50%+",
        "支撑 12 客户售前投标与交付验证",
      ],
    });

    expect(metrics.efficiency).toBe("50%+");
    expect(metrics.customersProjects).toBe("12 个客户/项目");
    expect(JSON.stringify(metrics)).not.toContain("7");
    expect(JSON.stringify(metrics)).not.toContain("2025");
  });

  it("keeps internships only on the foundation slide", () => {
    const draft = generatePresentationDraft(AGENT_MBSE_RESUME);
    const foundation = draft.slides.find((slide) => slide.id === "foundation")!;
    const laterSlides = draft.slides.filter((slide) => slide.id !== "foundation");

    expect(JSON.stringify(foundation)).toMatch(/京东健康|百度|实习/);
    expect(JSON.stringify(foundation)).not.toMatch(/汽车电子|工具链|Agent|MBSE|Groot-Arch|RAG/);
    expect(JSON.stringify(laterSlides)).not.toMatch(/京东健康|百度|实习生|互联网医院产品部|产品设计部/);
  });

  it("generates audience-facing copy without self-prep meta narrative", () => {
    const draft = generatePresentationDraft(AGENT_MBSE_RESUME);
    const serialized = JSON.stringify(draft);

    expect(serialized).not.toMatch(/面试故事|面试表达|给面试官|准备材料/);
    expect(draft.slides.find((slide) => slide.id === "hero")?.body).toContain("我的产品判断");
    const resolution = draft.slides.find((slide) => slide.id === "resolution")!;
    expect(resolution.title).toBe("从工具链产品经理到平台产品负责人 / AI 产品负责人：把复杂系统产品化");
    expect(resolution.title).not.toMatch(/实习|京东|百度|产品设计部/);
  });

  it("does not leak the Agent/MBSE preset into generic resumes", () => {
    const draft = generatePresentationDraft(GENERIC_RESUME);
    expect(draft.narrativeProfile?.presetId).toBe("generic-interview-story");
    const serialized = JSON.stringify(draft);
    expect(serialized).not.toContain("Groot-Arch");
    expect(serialized).not.toContain("PREEvision");
    expect(serialized).not.toContain("CANdelaStudio");
    expect(serialized).not.toContain("军工");
    expect(serialized).not.toContain("航天");
  });
});

describe("presentation enhancement normalizer", () => {
  it("rejects raw HTML/SVG/JS visualization payloads", () => {
    const issues: ValidationIssue[] = [];
    const normalized = normalizeEnhancementOutput({
      slides: [
        {
          id: "hero",
          visualizations: [
            { type: "custom", data: { rawSvg: "<svg><script>alert(1)</script></svg>" } },
          ],
        },
      ],
    }, issues);

    expect(normalized).toBeNull();
    expect(issues.some((issue) => issue.id === "normalize-empty")).toBe(true);
  });

  it("rejects label updates that belong to another slide beat", () => {
    expect(isSlideLabelUpdateCompatible(
      { id: "hero", kind: "hero" },
      { phaseTag: "平台阶段", narrativeBeats: ["平台化"] },
    )).toBe(false);
    expect(isSlideLabelUpdateCompatible(
      { id: "agent-leap", kind: "agent_leap" },
      { phaseTag: "Agent 跃迁", narrativeBeats: ["受控工作流", "RAG"] },
    )).toBe(true);
  });

  it("drops incompatible tag fields while preserving safe text enhancements", () => {
    const baseline = generatePresentationDraft(AGENT_MBSE_RESUME);
    const merged = mergePresentationEnhancements(baseline, {
      slides: [
        {
          id: "hero",
          body: "新的开场表达",
          phaseTag: "平台阶段",
          domainTags: ["汽车电子架构"],
        },
      ],
    });
    const hero = merged.slides.find((slide) => slide.id === "hero")!;

    expect(hero.body).toBe("新的开场表达");
    expect(hero.phaseTag).toBe("目标定位");
    expect(hero.domainTags).toBeUndefined();
  });

  it("drops meta narrative and internship leakage from later slides", () => {
    const baseline = generatePresentationDraft(AGENT_MBSE_RESUME);
    const merged = mergePresentationEnhancements(baseline, {
      slides: [
        {
          id: "impact",
          body: "这是一段面试表达，会串到投屏内容",
          bullets: ["京东健康后台产品实习生经历"],
          summaryLine: "商业结果仍然保留",
        },
      ],
    });
    const impact = merged.slides.find((slide) => slide.id === "impact")!;

    expect(impact.body).not.toContain("面试表达");
    expect(impact.bullets?.join("")).not.toContain("京东健康");
    expect(impact.summaryLine).toBe("商业结果仍然保留");
  });

  it("rejects cards that put team size into commercial proof", () => {
    const baseline = generatePresentationDraft(AGENT_MBSE_RESUME);
    const originalCards = baseline.slides.find((slide) => slide.id === "impact")!.cards;
    const merged = mergePresentationEnhancements(baseline, {
      slides: [
        {
          id: "impact",
          cards: [
            { title: "商业验证", body: "10 人\n客户/项目/售前投标闭环", variant: "teal" },
          ],
        },
      ],
    });
    const impact = merged.slides.find((slide) => slide.id === "impact")!;

    expect(impact.cards).toEqual(originalCards);
  });

  it("rejects metric cards that introduce unsupported numbers", () => {
    const baseline = generatePresentationDraft(AGENT_MBSE_RESUME);
    const originalCards = baseline.slides.find((slide) => slide.id === "impact")!.cards;
    const merged = mergePresentationEnhancements(baseline, {
      slides: [
        {
          id: "impact",
          cards: [
            { title: "效率提升", body: "7% / 1%\n文档/沟通/设计效率改善", variant: "violet" },
          ],
        },
      ],
    });
    const impact = merged.slides.find((slide) => slide.id === "impact")!;

    expect(impact.cards).toEqual(originalCards);
  });
});

describe("presentation shell overlay helpers", () => {
  it("only opens overlays that exist in the draft", () => {
    const draft = generatePresentationDraft(AGENT_MBSE_RESUME);
    expect(resolveOpenOverlayId("ov-arch-detail", draft.overlays)).toBe("ov-arch-detail");
    expect(resolveOpenOverlayId("missing-overlay", draft.overlays)).toBeNull();
  });
});
