import { describe, expect, it } from "vitest";
import type { PresentationSlide } from "./types";
import { buildSlideCoachBrief } from "./slide-coach";

const BASE_SLIDE: PresentationSlide = {
  id: "hero",
  kind: "hero",
  moduleId: "self",
  moduleTitle: "自我介绍",
  moduleOrder: 0,
  title: "AI Agent 产品故事",
  body: "这场面试需要证明我能把复杂项目讲成清晰主线。",
  bullets: ["先给定位", "再讲项目证据"],
  sourceRefs: [{ type: "roleUnderstanding" }],
};

describe("buildSlideCoachBrief", () => {
  it("builds self-introduction coaching for presentation slides", () => {
    const brief = buildSlideCoachBrief(BASE_SLIDE, [], "自我介绍");
    expect(brief.purpose).toContain("第一印象");
    expect(brief.fullScoreMove).toContain("满分讲法");
    expect(brief.talkTrack.length).toBeGreaterThanOrEqual(3);
    expect(brief.likelyQuestions.some((item) => item.includes("依据") || item.includes("证明"))).toBe(true);
  });

  it("uses overlays as possible follow-up context", () => {
    const brief = buildSlideCoachBrief(
      { ...BASE_SLIDE, overlayIds: ["ov-material-faq"] },
      [{ id: "ov-material-faq", title: "追问准备框架", body: "Q&A", kind: "material-faq", sourceRefs: [] }],
      "自我介绍",
    );
    expect(brief.likelyQuestions.some((item) => item.includes("追问准备框架"))).toBe(true);
  });
});
