import type { ResumeData } from "@/types";
import { buildTimelineStory } from "@/lib/narrative/story";

export interface PublishCheck {
  id: string;
  label: string;
  description: string;
  severity: "blocker" | "warning" | "passed";
}

function hasTwoSupportParts(parts: string[]): boolean {
  return parts.filter((part) => Boolean(part.trim())).length >= 2;
}

export function getPublishChecks(data: ResumeData): PublishCheck[] {
  const timeline = data.timeline ?? [];
  const hasName = Boolean(data.profile.name?.trim());
  const hasRole = Boolean(data.roleUnderstanding?.targetRoleTitle?.trim() || data.profile.title?.trim());
  const hasTimeline = timeline.length > 0;
  const stories = timeline.map((node, index) => buildTimelineStory(node, index));
  const hasSupport = stories.some((story) =>
    hasTwoSupportParts([story.evidenceProblem, story.evidenceAction, story.evidenceResult]),
  );
  const hasStory = stories.some((story) => Boolean(story.title && story.scene && story.action && story.outcome));

  return [
    {
      id: "profile-name",
      label: "姓名",
      description: hasName ? "访客可以识别候选人身份" : "请先补充姓名，否则公开页缺少主体",
      severity: hasName ? "passed" : "blocker",
    },
    {
      id: "target-role",
      label: "目标岗位",
      description: hasRole
        ? "公开站会在首屏展示岗位匹配摘要"
        : "建议补充目标岗位或个人标题，帮助面试官快速判断匹配度",
      severity: hasRole ? "passed" : "warning",
    },
    {
      id: "core-experience",
      label: "核心经历",
      description: hasTimeline ? `已包含 ${timeline.length} 段经历` : "至少需要一段经历才能发布职业叙事站",
      severity: hasTimeline ? "passed" : "blocker",
    },
    {
      id: "career-story",
      label: "职业故事",
      description: hasStory ? "经历已具备可阅读的叙事结构" : "建议先生成故事草稿，再进行校准",
      severity: hasStory ? "passed" : "warning",
    },
    {
      id: "highlight-support",
      label: "亮点支撑",
      description: hasSupport
        ? "至少一段经历已经具备挑战、行动、产出中的关键内容"
        : "建议补充挑战、行动或产出，让公开页表达更扎实",
      severity: hasSupport ? "passed" : "warning",
    },
  ];
}

export function hasBlockingPublishChecks(checks: PublishCheck[]): boolean {
  return checks.some((check) => check.severity === "blocker");
}
