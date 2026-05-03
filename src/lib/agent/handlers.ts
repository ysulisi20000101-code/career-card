import type { ResumeData, RoleUnderstanding, TimelineNode } from "@/types";
import { getPublishChecks } from "@/lib/share/publish-checks";
import type {
  AgentFinding,
  AgentInput,
  AgentPatch,
  AgentQuestion,
  AgentSafetyNote,
  AgentSuggestion,
} from "./types";
import { compact, hasText, unique } from "@/lib/utils-helpers";

export function pathForTimeline(id: string, field: keyof TimelineNode): string {
  return `timeline[id=${id}].${String(field)}`;
}

export function patch(input: {
  id: string;
  label: string;
  path: string;
  value: AgentPatch["value"];
  previousValue?: AgentPatch["previousValue"];
}): AgentPatch {
  return { ...input, requiresConfirmation: true };
}

export function activeTimeline(data: ResumeData, activeTimelineId?: string | null): TimelineNode | null {
  if (activeTimelineId) {
    return data.timeline.find((node) => node.id === activeTimelineId) ?? null;
  }
  return data.timeline[0] ?? null;
}

export function evidenceForNode(node: TimelineNode): string[] {
  return unique([
    node.company,
    node.position,
    compact(node.description, 80),
    ...node.highlights.slice(0, 3).map((item) => compact(item, 80)),
  ]).slice(0, 5);
}

export function buildSafetyNotes(): AgentSafetyNote[] {
  return [
    {
      id: "no-fabrication",
      message: "没有证据的数字、奖项、公司事实和结果提升不会自动写入最终卡片。",
    },
    {
      id: "user-confirmation",
      message: "所有 patch 都需要用户手动确认后才会更新草稿。",
    },
  ];
}

export function buildQuestions(data: ResumeData): AgentQuestion[] {
  const questions: AgentQuestion[] = [];
  if (!hasText(data.roleUnderstanding?.targetRoleTitle) && !hasText(data.profile.title)) {
    questions.push({
      id: "target-role",
      label: "这份职业档案主要投递什么岗位？",
      reason: "目标岗位会影响经历排序、能力强调和面试讲述角度。",
      targetPath: "roleUnderstanding.targetRoleTitle",
      required: true,
    });
  }
  if (!hasText(data.profile.summary)) {
    questions.push({
      id: "profile-summary",
      label: "你希望别人用一句话记住你的职业定位是什么？",
      reason: "首页摘要缺失时，公开页会缺少快速判断候选人的入口。",
      targetPath: "profile.summary",
      required: true,
    });
  }
  const weakEvidence = data.timeline.find(
    (node) =>
      !hasText(node.evidenceProblem) ||
      !hasText(node.evidenceAction) ||
      !hasText(node.evidenceResult),
  );
  if (weakEvidence) {
    questions.push({
      id: `evidence-${weakEvidence.id}`,
      label: `${weakEvidence.company || "这段经历"}里最能证明结果的数字或事实是什么？`,
      reason: "经历叙事需要至少包含问题、行动、结果，避免只停留在职责描述。",
      targetPath: pathForTimeline(weakEvidence.id, "evidenceResult"),
      required: false,
    });
  }
  if (data.timeline.length === 0) {
    questions.push({
      id: "timeline-empty",
      label: "至少补充一段工作、项目或实习经历。",
      reason: "没有经历节点时，agent 无法生成可发布的职业叙事。",
      targetPath: "timeline",
      required: true,
    });
  }
  return questions.slice(0, 5);
}

export function analyzeResume(data: ResumeData): {
  findings: AgentFinding[];
  suggestions: AgentSuggestion[];
} {
  const findings: AgentFinding[] = [];
  const suggestions: AgentSuggestion[] = [];
  const hasRole = hasText(data.roleUnderstanding?.targetRoleTitle) || hasText(data.profile.title);
  const storyReady = data.timeline.filter(
    (node) => hasText(node.storyTitle) && hasText(node.storyAction) && hasText(node.storyOutcome),
  ).length;
  const evidenceReady = data.timeline.filter(
    (node) => hasText(node.evidenceProblem) && hasText(node.evidenceAction) && hasText(node.evidenceResult),
  ).length;

  findings.push({
    id: "profile-readiness",
    severity: hasText(data.profile.name) && hasRole ? "passed" : "warning",
    title: "身份和岗位定位",
    body: hasRole ? "已具备基础身份和岗位定位。" : "缺少明确目标岗位或个人标题，会影响首页首屏判断。",
    targetPath: hasRole ? undefined : "profile.title",
  });
  findings.push({
    id: "story-readiness",
    severity: storyReady > 0 ? "passed" : "warning",
    title: "经历叙事",
    body:
      storyReady > 0
        ? `已有 ${storyReady} 段经历包含故事结构。`
        : "还没有经历包含完整故事结构，建议先整理最新或最关键的一段。",
    targetPath: storyReady > 0 ? undefined : "timeline",
  });
  findings.push({
    id: "evidence-readiness",
    severity: evidenceReady > 0 ? "passed" : "warning",
    title: "证据支撑",
    body:
      evidenceReady > 0
        ? `已有 ${evidenceReady} 段经历包含问题、行动、结果支撑。`
        : "缺少可追溯证据，公开页可能像职责列表而不是能力证明。",
    targetPath: evidenceReady > 0 ? undefined : "timeline",
  });

  const firstNode = data.timeline[0];
  if (firstNode && storyReady === 0) {
    suggestions.push({
      id: "start-from-first-story",
      title: "先整理一段核心经历",
      body: `建议从「${firstNode.company || firstNode.position}」开始，把职责描述改成"背景-行动-结果-反思"的讲述结构。`,
      priority: "high",
      evidence: evidenceForNode(firstNode),
      patches: [],
    });
  }

  return { findings, suggestions };
}

export function rewriteExperienceStory(data: ResumeData, activeTimelineId?: string | null): AgentSuggestion[] {
  const node = activeTimeline(data, activeTimelineId);
  if (!node) return [];

  const mainResult =
    node.highlights.find((item) => /\d|提升|增长|覆盖|完成|上线|负责|主导/.test(item)) ??
    node.highlights[0] ??
    node.description;
  const storyTitle = `${node.company || "核心经历"}：${node.position || "关键角色"}的代表产出`;
  const storyScene = node.description || `${node.company} 的 ${node.position} 经历。`;
  const storyChallenge =
    node.evidenceProblem ||
    node.highlights.find((item) => /问题|挑战|复杂|压力|不足|成本|效率/.test(item)) ||
    "需要在有限信息下梳理关键问题，并推动跨角色协作落地。";
  const storyAction =
    node.evidenceAction ||
    node.highlights.find((item) => /负责|主导|推动|设计|搭建|建立|优化/.test(item)) ||
    "围绕目标拆解需求、组织方案评审，并推进版本交付。";
  const storyOutcome = node.evidenceResult || mainResult || "形成可复用的产品产出和协作经验。";
  const storyReflection =
    node.storyReflection ||
    "这段经历体现了从问题识别、方案设计到结果验证的完整产品推进能力。";

  const patches = [
    patch({
      id: "story-title",
      label: "故事标题",
      path: pathForTimeline(node.id, "storyTitle"),
      value: compact(storyTitle, 48),
      previousValue: node.storyTitle,
    }),
    patch({
      id: "story-scene",
      label: "背景",
      path: pathForTimeline(node.id, "storyScene"),
      value: compact(storyScene, 160),
      previousValue: node.storyScene,
    }),
    patch({
      id: "story-challenge",
      label: "挑战",
      path: pathForTimeline(node.id, "storyChallenge"),
      value: compact(storyChallenge, 160),
      previousValue: node.storyChallenge,
    }),
    patch({
      id: "story-action",
      label: "行动",
      path: pathForTimeline(node.id, "storyAction"),
      value: compact(storyAction, 180),
      previousValue: node.storyAction,
    }),
    patch({
      id: "story-outcome",
      label: "结果",
      path: pathForTimeline(node.id, "storyOutcome"),
      value: compact(storyOutcome, 180),
      previousValue: node.storyOutcome,
    }),
    patch({
      id: "story-reflection",
      label: "反思",
      path: pathForTimeline(node.id, "storyReflection"),
      value: compact(storyReflection, 180),
      previousValue: node.storyReflection,
    }),
  ];

  return [
    {
      id: `rewrite-${node.id}`,
      title: `整理「${node.company || node.position}」经历叙事`,
      body: "这组建议只重组已有内容，不新增未经证实的数字或事实。",
      priority: "high",
      evidence: evidenceForNode(node),
      patches,
    },
  ];
}

function extractRoleKeywords(text: string): string[] {
  const keywords = [
    "AI Agent",
    "RAG",
    "平台产品",
    "B端",
    "SaaS",
    "数据分析",
    "团队管理",
    "商业化",
    "项目管理",
    "用户增长",
    "低代码",
    "知识库",
  ];
  return keywords.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
}

export function mapToTargetRole(data: ResumeData, input: AgentInput): AgentSuggestion[] {
  const targetRole = compact(input.targetRole || data.roleUnderstanding?.targetRoleTitle || data.profile.title || "", 60);
  const jd = input.jobDescription || input.message || "";
  if (!targetRole && !jd) return [];
  const keywords = unique([...extractRoleKeywords(`${targetRole} ${jd}`), ...extractRoleKeywords(data.profile.summary ?? "")]).slice(0, 5);
  const strongestNode =
    data.timeline.find((node) => keywords.some((keyword) => `${node.description} ${node.highlights.join(" ")} ${node.skills.join(" ")}`.includes(keyword))) ??
    data.timeline[0];
  const nextRole: RoleUnderstanding = {
    ...data.roleUnderstanding,
    targetRoleTitle: targetRole || data.roleUnderstanding.targetRoleTitle,
    oneLineInterpretation:
      data.roleUnderstanding.oneLineInterpretation ||
      `这个岗位的核心是把${keywords[0] ?? "复杂业务问题"}转化为可交付、可验证的产品结果。`,
    priorityProblems:
      data.roleUnderstanding.priorityProblems.length > 0
        ? data.roleUnderstanding.priorityProblems
        : [
            {
              id: "agent-problem-1",
              problem: `明确${keywords[0] ?? "核心业务"}的优先级和成功指标`,
              impact: "避免需求分散，提升交付聚焦度。",
              evidence: "",
            },
            {
              id: "agent-problem-2",
              problem: "把跨团队协作从临时推进变成稳定机制",
              impact: "降低沟通成本和版本延期风险。",
              evidence: "",
            },
          ],
    ninetyDayPlan:
      data.roleUnderstanding.ninetyDayPlan.day0To30 ||
      data.roleUnderstanding.ninetyDayPlan.day31To60 ||
      data.roleUnderstanding.ninetyDayPlan.day61To90
        ? data.roleUnderstanding.ninetyDayPlan
        : {
            day0To30: "完成业务、用户和关键指标诊断，明确最需要优先解决的问题。",
            day31To60: "围绕高优先级问题产出方案原型，并完成跨团队评审和范围收敛。",
            day61To90: "推动核心方案上线，跟踪结果并建立复盘机制。",
          },
    experienceMappings:
      data.roleUnderstanding.experienceMappings.length > 0
        ? data.roleUnderstanding.experienceMappings
        : strongestNode
          ? [
              {
                id: "agent-mapping-1",
                requirement: `${targetRole || "目标岗位"}需要的核心能力`,
                myExperience: `${strongestNode.company} · ${strongestNode.position}`,
                outcomeEvidence: compact(strongestNode.highlights[0] || strongestNode.description, 140),
              },
            ]
          : [],
  };

  return [
    {
      id: "role-mapping",
      title: "生成岗位理解初稿",
      body: "基于目标岗位和现有经历生成岗位理解模块，仍需要你确认公司语境和真实优先级。",
      priority: "high",
      evidence: unique([targetRole, ...keywords, strongestNode?.company ?? ""]).slice(0, 5),
      patches: [
        patch({
          id: "role-understanding",
          label: "岗位理解模块",
          path: "roleUnderstanding",
          value: nextRole as unknown as Record<string, unknown>,
          previousValue: data.roleUnderstanding as unknown as Record<string, unknown>,
        }),
      ],
    },
  ];
}

export function reviewBeforePublish(data: ResumeData): {
  findings: AgentFinding[];
  suggestions: AgentSuggestion[];
} {
  const checks = getPublishChecks(data);
  const findings: AgentFinding[] = checks.map((check) => ({
    id: `publish-${check.id}`,
    severity:
      check.severity === "blocker" ? "blocker" : check.severity === "warning" ? "warning" : "passed",
    title: check.label,
    body: check.description,
  }));
  const blocker = findings.find((finding) => finding.severity === "blocker");
  const suggestions: AgentSuggestion[] = blocker
    ? [
        {
          id: "fix-blocker-first",
          title: "先处理发布阻断项",
          body: "有阻断项时不建议继续生成公开链接，否则面试官打开后会缺少核心信息。",
          priority: "high",
          evidence: [blocker.title, blocker.body],
          patches: [],
        },
      ]
    : [
        {
          id: "ready-to-publish",
          title: "可以进入发布校验",
          body: "当前没有发布阻断项。发布后仍建议用无痕窗口打开链接，确认公开页可读。",
          priority: "medium",
          evidence: checks.map((check) => check.label),
          patches: [],
        },
      ];
  return { findings, suggestions };
}
