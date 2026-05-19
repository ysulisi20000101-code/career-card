import { describe, expect, it } from "vitest";
import type { PresentationDraft } from "@/lib/presentation/types";
import { diagnosePresentationDraft } from "./diagnose-presentation";

function draftForDiagnosis(): PresentationDraft {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "draft-diagnosis",
    schemaVersion: 1,
    sourceResumeRevision: "resume",
    targetRole: "AI 产品经理",
    template: "agent-product-arc",
    slides: [
      {
        id: "hero",
        kind: "hero",
        title: "AI Agent 产品经理",
        body: "用 Agent 工作流把审批效率提升 30%。",
        bullets: ["AI Agent 工作流", "审批效率提升 30%"],
        sourceRefs: [{ type: "profile" }],
      },
      {
        id: "impact",
        kind: "impact",
        title: "结果验证",
        body: "ROI 提升 18%，覆盖 10 万日均审批量。",
        bullets: ["指标口径需要解释"],
        sourceRefs: [],
      },
    ],
    overlays: [],
    themeId: "dark-story",
    createdAt: now,
    updatedAt: now,
  };
}

describe("diagnosePresentationDraft", () => {
  it("creates product-facing diagnosis, dynamic suggestions, risks, and practice questions", () => {
    const diagnosis = diagnosePresentationDraft(draftForDiagnosis());

    expect(diagnosis.readinessScore).toBeGreaterThan(50);
    expect(diagnosis.headline).toContain("2 页");
    expect(diagnosis.suggestions.length).toBeGreaterThan(0);
    expect(diagnosis.suggestions.some((item) => item.prompt.includes("AI Agent") || item.prompt.includes("数据"))).toBe(true);
    expect(diagnosis.riskFlags.some((risk) => risk.label.includes("第 2 页"))).toBe(true);
    expect(diagnosis.practiceQuestions.some((question) => question.includes("数字口径"))).toBe(true);
  });

  it("keeps starter framework diagnosis honest and does not infer fake evidence", () => {
    const now = "2026-01-01T00:00:00.000Z";
    const diagnosis = diagnosePresentationDraft({
      id: "starter",
      schemaVersion: 1,
      sourceResumeRevision: "blank",
      targetRole: "待补充目标方向",
      template: "agent-product-arc",
      narrativeProfile: {
        presetId: "starter-interview-outline",
        confidence: 0,
        candidateName: "候选人",
        targetRole: "待补充目标方向",
        positioning: "待补充简历素材的面试演示框架",
        domainContext: [],
        evidenceKeywords: [],
        metrics: [],
        transferableCapabilities: [],
        riskNotes: [],
      },
      slides: [
        {
          id: "hero",
          kind: "starter_outline",
          title: "面试 PPT 演示框架",
          body: "当前项目还没有可用简历素材。后续可以用 Agent 微调。",
          bullets: ["上传简历", "自动生成第一版", "对话微调"],
          speakerNotes: "待补充素材。",
          sourceRefs: [{ type: "profile" }],
        },
      ],
      overlays: [],
      themeId: "light-story",
      createdAt: now,
      updatedAt: now,
    });

    expect(diagnosis.readinessScore).toBe(52);
    expect(diagnosis.headline).toContain("可编辑演示框架");
    expect(diagnosis.strengths.join("\n")).not.toContain("AI / Agent 相关卖点");
    expect(diagnosis.riskFlags).toHaveLength(0);
    expect(diagnosis.priorities[0]?.id).toBe("upload-real-resume");
  });
});
