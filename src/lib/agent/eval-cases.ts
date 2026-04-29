import { mockResumeData } from "@/lib/mock-data";
import type { AgentInput, AgentOutputType, AgentPatch } from "./types";

export interface AgentEvalExpectations {
  type?: AgentOutputType;
  minQuestions?: number;
  questionIds?: string[];
  minPatches?: number;
  patchPathPrefixes?: string[];
  patchPaths?: string[];
  findingSeverities?: string[];
  summaryIncludes?: string;
}

export interface AgentEvalCase {
  id: string;
  title: string;
  input: AgentInput;
  expectations: AgentEvalExpectations;
}

function baseResume() {
  return structuredClone(mockResumeData);
}

function patchlessResume() {
  const data = baseResume();
  data.timeline = data.timeline.map((node) => ({
    ...node,
    storyTitle: undefined,
    storyScene: undefined,
    storyChallenge: undefined,
    storyAction: undefined,
    storyOutcome: undefined,
    storyReflection: undefined,
    evidenceProblem: undefined,
    evidenceAction: undefined,
    evidenceResult: undefined,
  }));
  return data;
}

export const agentEvalCases: AgentEvalCase[] = [
  {
    id: "missing-role-and-summary",
    title: "信息不足时先追问，不直接写事实",
    input: {
      resumeData: (() => {
        const data = baseResume();
        data.profile.title = "";
        data.profile.summary = "";
        data.roleUnderstanding.targetRoleTitle = "";
        return data;
      })(),
      intent: "ask_clarifying_questions",
    },
    expectations: {
      type: "question",
      minQuestions: 2,
      questionIds: ["target-role", "profile-summary"],
      minPatches: 0,
    },
  },
  {
    id: "rewrite-active-experience",
    title: "经历整理只输出目标经历的待确认 patch",
    input: {
      resumeData: patchlessResume(),
      intent: "rewrite_experience_story",
      activeTimelineId: "tl-2",
    },
    expectations: {
      type: "suggestion",
      minPatches: 5,
      patchPathPrefixes: ["timeline[id=tl-2]."],
    },
  },
  {
    id: "map-ai-agent-role",
    title: "岗位匹配能生成岗位理解结构",
    input: {
      resumeData: (() => {
        const data = baseResume();
        data.roleUnderstanding = {
          targetRoleTitle: "",
          oneLineInterpretation: "",
          priorityProblems: [],
          ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
          experienceMappings: [],
        };
        return data;
      })(),
      intent: "map_to_target_role",
      targetRole: "AI Agent 平台产品负责人",
      jobDescription: "负责 AI Agent、RAG 知识库、平台产品规划和团队协作。",
    },
    expectations: {
      type: "suggestion",
      minPatches: 1,
      patchPaths: ["roleUnderstanding"],
    },
  },
  {
    id: "publish-blocker",
    title: "发布检查能识别阻断项",
    input: {
      resumeData: (() => {
        const data = baseResume();
        data.profile.name = "";
        data.timeline = [];
        return data;
      })(),
      intent: "review_before_publish",
    },
    expectations: {
      type: "review",
      findingSeverities: ["blocker"],
      summaryIncludes: "阻断",
    },
  },
  {
    id: "mimo-fallback-provider",
    title: "未配置模型 provider 时回退规则结果",
    input: {
      resumeData: baseResume(),
      intent: "analyze_resume",
      provider: "mimo",
    },
    expectations: {
      minPatches: 0,
      summaryIncludes: "检查",
    },
  },
];

export function patchMatchesPrefixes(patches: AgentPatch[], prefixes: string[]): boolean {
  return patches.every((item) => prefixes.some((prefix) => item.path.startsWith(prefix)));
}
