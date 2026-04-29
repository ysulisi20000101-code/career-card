import { describe, expect, it } from "vitest";
import { mockResumeData } from "@/lib/mock-data";
import { runCareerCardAgent } from "./career-card-agent";

describe("runCareerCardAgent", () => {
  it("asks targeted questions when role and summary are missing", () => {
    const data = structuredClone(mockResumeData);
    data.profile.title = "";
    data.profile.summary = "";
    data.roleUnderstanding.targetRoleTitle = "";

    const response = runCareerCardAgent({
      resumeData: data,
      intent: "ask_clarifying_questions",
    });

    expect(response.type).toBe("question");
    expect(response.questions.map((item) => item.id)).toEqual(
      expect.arrayContaining(["target-role", "profile-summary"]),
    );
    expect(response.patches).toHaveLength(0);
  });

  it("rewrites one active experience into confirmation-required patches", () => {
    const response = runCareerCardAgent({
      resumeData: mockResumeData,
      intent: "rewrite_experience_story",
      activeTimelineId: "tl-2",
    });

    expect(response.type).toBe("suggestion");
    expect(response.patches.length).toBeGreaterThan(0);
    expect(response.patches.every((item) => item.requiresConfirmation)).toBe(true);
    expect(response.patches.every((item) => item.path.startsWith("timeline[id=tl-2]"))).toBe(true);
  });

  it("maps a target role to a structured roleUnderstanding patch", () => {
    const data = structuredClone(mockResumeData);
    data.roleUnderstanding = {
      targetRoleTitle: "",
      oneLineInterpretation: "",
      priorityProblems: [],
      ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
      experienceMappings: [],
    };

    const response = runCareerCardAgent({
      resumeData: data,
      intent: "map_to_target_role",
      targetRole: "AI Agent 平台产品负责人",
      jobDescription: "负责 AI Agent、RAG 知识库、平台产品规划和团队协作。",
    });

    const rolePatch = response.patches.find((item) => item.path === "roleUnderstanding");
    expect(response.type).toBe("suggestion");
    expect(rolePatch).toBeDefined();
    expect(rolePatch?.requiresConfirmation).toBe(true);
    expect(JSON.stringify(rolePatch?.value)).toContain("AI Agent 平台产品负责人");
  });

  it("finds publish blockers without auto-fixing user facts", () => {
    const data = structuredClone(mockResumeData);
    data.timeline = [];

    const response = runCareerCardAgent({
      resumeData: data,
      intent: "review_before_publish",
    });

    expect(response.type).toBe("review");
    expect(response.findings.some((item) => item.severity === "blocker")).toBe(true);
    expect(response.patches).toHaveLength(0);
  });
});
