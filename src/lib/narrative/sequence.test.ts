import { describe, expect, it } from "vitest";
import type { TimelineNode } from "@/types";
import { buildEarlyExploration } from "./sequence";

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
    careerKind: partial.careerKind ?? "internship",
  };
}

describe("buildEarlyExploration", () => {
  it("uses first-person public-site copy instead of product-system narration", () => {
    const exploration = buildEarlyExploration([
      node({
        company: "京东",
        position: "用户产品实习生",
        startDate: "2020-12",
        endDate: "2021-03",
        highlights: ["完成商品卡片样式统一和商详页样式改版。"],
        skills: ["用户路径优化"],
      }),
      node({
        company: "百度",
        position: "后台产品实习生",
        startDate: "2021-05",
        endDate: "2021-09",
        highlights: ["搭建机构答主系统和数据看板。"],
        skills: ["后台产品", "数据分析"],
      }),
      node({
        company: "京东健康",
        position: "后台产品实习生",
        startDate: "2021-12",
        endDate: "2022-04",
        highlights: ["独立跟进 0-1 阶段测评中台。"],
        skills: ["中台建设"],
      }),
    ]);

    const publicCopy = [
      exploration?.title,
      exploration?.story.title,
      exploration?.story.scene,
      exploration?.story.outcome,
      exploration?.story.reflection,
    ].join(" ");

    expect(publicCopy).toContain("产品能力的早期底色");
    expect(publicCopy).toContain("京东、百度、京东健康");
    expect(publicCopy).not.toMatch(/候选人|这里合并|不是主线|系统|生成|草稿|上传|优化建议|体验产品/);
  });
});
