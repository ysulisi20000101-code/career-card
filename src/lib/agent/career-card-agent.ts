import type { ResumeData } from "@/types";
import type {
  AgentFinding,
  AgentInput,
  AgentIntent,
  AgentQuestion,
  AgentResponse,
  AgentSuggestion,
  AgentToolTrace,
} from "./types";
import {
  analyzeResume,
  buildQuestions,
  buildSafetyNotes,
  mapToTargetRole,
  reviewBeforePublish,
  rewriteExperienceStory,
} from "./handlers";

const INTENT_LABELS: Record<AgentIntent, string> = {
  analyze_resume: "分析简历结构",
  ask_clarifying_questions: "追问缺失信息",
  rewrite_experience_story: "改写经历叙事",
  map_to_target_role: "匹配目标岗位",
  review_before_publish: "发布前检查",
};

function deriveIntent(input: AgentInput): { intent: AgentIntent; trace: AgentToolTrace } {
  if (input.intent) {
    return {
      intent: input.intent,
      trace: { tool: "derive_intent", status: "skipped", note: "调用方已指定任务类型。" },
    };
  }

  const text = `${input.message ?? ""} ${input.currentSection ?? ""}`.toLowerCase();
  if (/发布|检查|review|上线|分享/.test(text)) {
    return {
      intent: "review_before_publish",
      trace: { tool: "derive_intent", status: "used", note: "根据用户输入识别为发布前检查。" },
    };
  }
  if (/岗位|jd|匹配|role|target/.test(text)) {
    return {
      intent: "map_to_target_role",
      trace: { tool: "derive_intent", status: "used", note: "根据用户输入识别为职业定位。" },
    };
  }
  if (/改写|故事|经历|亮点|叙事|story/.test(text)) {
    return {
      intent: "rewrite_experience_story",
      trace: { tool: "derive_intent", status: "used", note: "根据用户输入识别为经历叙事整理。" },
    };
  }
  if (/问题|缺什么|追问|补充/.test(text)) {
    return {
      intent: "ask_clarifying_questions",
      trace: { tool: "derive_intent", status: "used", note: "根据用户输入识别为缺失信息追问。" },
    };
  }
  return {
    intent: "analyze_resume",
    trace: { tool: "derive_intent", status: "fallback", note: "未识别到明确任务，默认分析简历结构。" },
  };
}

function buildSummary(
  intent: AgentIntent,
  questions: AgentQuestion[],
  findings: AgentFinding[],
  suggestions: AgentSuggestion[],
): string {
  if (intent === "ask_clarifying_questions") {
    return questions.length > 0 ? `我找到了 ${questions.length} 个值得先补齐的问题。` : "当前没有明显必须追问的信息。";
  }
  if (intent === "review_before_publish") {
    const blockers = findings.filter((finding) => finding.severity === "blocker").length;
    return blockers > 0 ? `发布前还有 ${blockers} 个阻断项。` : "发布前检查没有发现阻断项。";
  }
  if (suggestions.length > 0) return `已生成 ${suggestions.length} 组可确认建议。`;
  if (findings.length > 0) return `已完成 ${findings.length} 项结构检查。`;
  return "当前信息不足，建议先补充目标岗位或关键经历。";
}

export function runCareerCardAgent(input: AgentInput): AgentResponse {
  const { intent, trace } = deriveIntent(input);
  const raw = input.resumeData;
  const data: ResumeData = {
    ...raw,
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    architecture: Array.isArray(raw.architecture) ? raw.architecture : [],
  };
  const toolTrace: AgentToolTrace[] = [trace];
  const questions = buildQuestions(data);
  let findings: AgentFinding[] = [];
  let suggestions: AgentSuggestion[] = [];
  let type: AgentResponse["type"] = "suggestion";

  if (!data.profile.name && data.timeline.length === 0 && intent !== "review_before_publish") {
    return {
      type: "fallback",
      intent,
      summary: "当前草稿信息太少，先上传或补充简历内容。",
      questions,
      suggestions: [],
      findings: [],
      patches: [],
      safety: buildSafetyNotes(),
      toolTrace: [...toolTrace, { tool: intent, status: "fallback", note: "输入不足，未执行生成。" }],
      createdAt: new Date().toISOString(),
    };
  }

  if (intent === "analyze_resume") {
    const result = analyzeResume(data);
    findings = result.findings;
    suggestions = result.suggestions;
    type = questions.length > 0 ? "question" : "review";
  }
  if (intent === "ask_clarifying_questions") {
    type = "question";
  }
  if (intent === "rewrite_experience_story") {
    suggestions = rewriteExperienceStory(data, input.activeTimelineId);
    type = suggestions.length > 0 ? "suggestion" : "fallback";
  }
  if (intent === "map_to_target_role") {
    suggestions = mapToTargetRole(data, input);
    type = suggestions.length > 0 ? "suggestion" : "question";
  }
  if (intent === "review_before_publish") {
    const result = reviewBeforePublish(data);
    findings = result.findings;
    suggestions = result.suggestions;
    type = "review";
  }

  const patches = suggestions.flatMap((suggestion) => suggestion.patches);
  toolTrace.push({
    tool: intent,
    status: suggestions.length > 0 || findings.length > 0 || questions.length > 0 ? "used" : "fallback",
    note: `${INTENT_LABELS[intent]}已完成。`,
  });

  return {
    type,
    intent,
    summary: buildSummary(intent, questions, findings, suggestions),
    questions: type === "question" || intent === "analyze_resume" ? questions : [],
    suggestions,
    findings,
    patches,
    safety: buildSafetyNotes(),
    toolTrace,
    createdAt: new Date().toISOString(),
  };
}
