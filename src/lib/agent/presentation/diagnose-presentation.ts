import type { PresentationDraft, PresentationSlide } from "@/lib/presentation/types";
import { generateId } from "@/lib/utils";

export type PresentationAgentRole = "user" | "agent" | "system";

export interface PresentationAgentMessage {
  id: string;
  role: PresentationAgentRole;
  content: string;
  createdAt: string;
}

export interface PresentationRiskFlag {
  id: string;
  severity: "info" | "warning" | "error";
  label: string;
  detail: string;
  slideId?: string;
  slideNumber?: number;
}

export interface SlideDiagnosis {
  slideId: string;
  slideNumber: number;
  title: string;
  score: number;
  purpose: string;
  strengths: string[];
  risks: string[];
  suggestedPrompt: string;
}

export interface PresentationAgentSuggestion {
  id: string;
  label: string;
  prompt: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  kind: "opening" | "structure" | "evidence" | "practice" | "style";
}

export interface PresentationDiagnosis {
  id: string;
  createdAt: string;
  readinessScore: number;
  headline: string;
  storyLine: string;
  strengths: string[];
  priorities: Array<{
    id: string;
    label: string;
    detail: string;
    prompt: string;
  }>;
  slideDiagnoses: SlideDiagnosis[];
  riskFlags: PresentationRiskFlag[];
  suggestions: PresentationAgentSuggestion[];
  practiceQuestions: string[];
}

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value: string, max = 84): string {
  const text = clean(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function visibleSelfSlides(draft: PresentationDraft): PresentationSlide[] {
  return draft.slides.filter((slide) => !slide.hidden && (slide.moduleId ?? "self") === "self");
}

function slideText(slide: PresentationSlide): string {
  return [
    slide.title,
    slide.subtitle,
    slide.body,
    slide.summaryLine,
    ...(slide.bullets ?? []),
    ...(slide.cards ?? []).flatMap((card) => [card.title, card.body]),
    ...(slide.highlightCallouts ?? []).flatMap((callout) => [callout.title, callout.body]),
    ...(slide.narrativeBeats ?? []),
  ].filter(Boolean).join("\n");
}

function hasMetric(text: string): boolean {
  return /\d|%|倍|万|千|ROI|NPS|DAU|MAU|GMV/i.test(text);
}

function hasAgentEvidence(text: string): boolean {
  return /AI|Agent|智能|自动化|大模型|模型|RAG|工作流/i.test(text);
}

function isStarterSlide(slide: PresentationSlide): boolean {
  return slide.kind === "starter_outline";
}

function isStarterDraft(draft: PresentationDraft, slides: PresentationSlide[]): boolean {
  return draft.narrativeProfile?.presetId === "starter-interview-outline" || (slides.length > 0 && slides.every(isStarterSlide));
}

function slidePurpose(slide: PresentationSlide, index: number): string {
  if (isStarterSlide(slide)) return "这一页是待补充素材的演示框架，重点是引导用户上传简历或补齐真实经历。";
  if (index === 0 || slide.kind === "hero") return "开场页要在 30 秒内给出定位、主线和最强证据预告。";
  if (slide.kind === "impact") return "结果页要让数字、贡献边界和可复核证据站得住。";
  if (slide.kind === "resolution") return "结尾页要把经历收束成面试官能带走的一句话。";
  if (hasAgentEvidence(slideText(slide))) return "这一页负责证明 AI / Agent 能力不是概念，而是能落到业务场景。";
  return "这一页需要承担清晰的叙事任务：判断先行，证据跟上。";
}

function diagnoseSlide(slide: PresentationSlide, index: number): SlideDiagnosis {
  const text = slideText(slide);
  const strengths: string[] = [];
  const risks: string[] = [];
  let score = 62;
  const starter = isStarterSlide(slide);

  if (clean(slide.title).length >= 8) {
    score += 6;
    strengths.push("标题有明确判断");
  } else {
    risks.push("标题还不够像一个可记住的结论");
  }

  if ((slide.bullets?.length ?? 0) >= 2 || (slide.cards?.length ?? 0) > 0) {
    score += 8;
    strengths.push("页面有可展开的证据点");
  } else {
    risks.push("证据点偏少，面试官追问时容易空");
  }

  if (starter) {
    score = Math.min(score, 64);
    strengths.push("框架目标清楚");
    risks.push("还缺真实简历素材，不能当作最终成稿演示");
  } else if (hasMetric(text)) {
    score += 7;
    strengths.push("有量化表达");
    risks.push("涉及数字时要准备口径、周期和个人贡献边界");
  }

  if (!starter && hasAgentEvidence(text)) {
    score += 7;
    strengths.push("具备 AI / Agent 相关卖点");
  }

  if (slide.visualizations?.length || slide.overlayComposition?.length) {
    score += 5;
    strengths.push("具备可视化讲述入口");
  }

  if (!slide.speakerNotes?.trim()) {
    risks.push("缺少讲稿提示，投屏时需要提前想好第一句话");
  } else {
    score += 4;
  }

  if ((slide.bullets?.length ?? 0) > 6) {
    score -= 8;
    risks.push("要点偏多，建议压成 3 个讲述层次");
  }

  const title = clean(slide.title) || `第 ${index + 1} 页`;
  return {
    slideId: slide.id,
    slideNumber: index + 1,
    title,
    score: Math.max(40, Math.min(96, score)),
    purpose: slidePurpose(slide, index),
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
    suggestedPrompt: `优化第 ${index + 1} 页：让「${truncate(title, 28)}」更适合面试官听懂和追问`,
  };
}

function buildRiskFlags(slides: PresentationSlide[]): PresentationRiskFlag[] {
  const flags: PresentationRiskFlag[] = [];
  for (const [index, slide] of slides.entries()) {
    if (isStarterSlide(slide)) continue;
    const text = slideText(slide);
    if (hasMetric(text)) {
      flags.push({
        id: generateId(),
        severity: "warning",
        label: `第 ${index + 1} 页含量化表述`,
        detail: "面试前需要确认数字口径、统计周期和个人贡献边界，避免被追问时显得像包装。",
        slideId: slide.id,
        slideNumber: index + 1,
      });
    }
    if ((slide.sourceRefs?.length ?? 0) === 0) {
      flags.push({
        id: generateId(),
        severity: "info",
        label: `第 ${index + 1} 页缺少来源标记`,
        detail: "这页可能来自模板或 Agent 总结，建议用户确认是否完全符合真实经历。",
        slideId: slide.id,
        slideNumber: index + 1,
      });
    }
  }
  return flags.slice(0, 6);
}

function buildPriorities(slides: PresentationSlide[], risks: PresentationRiskFlag[]) {
  const priorities: PresentationDiagnosis["priorities"] = [];
  const first = slides[0];
  const firstText = first ? slideText(first) : "";
  const visibleCount = slides.length;
  const agentSlides = slides.filter((slide) => hasAgentEvidence(slideText(slide)));
  const metricSlides = slides.filter((slide) => hasMetric(slideText(slide)));

  if (!first || clean(first.title).length < 14 || !hasAgentEvidence(firstText)) {
    priorities.push({
      id: "opening-hook",
      label: "先强化开场钩子",
      detail: "第一印象页需要更快说清楚“我是谁、我强在哪、为什么适合继续听”。",
      prompt: "把第 1 页改得更有开场钩子，30 秒内讲清定位、主线和最强证据",
    });
  }

  if (visibleCount > 8) {
    priorities.push({
      id: "talk-time",
      label: "压成 8 分钟讲法",
      detail: "页数偏多时，用户需要知道哪些页重点讲、哪些页快速带过。",
      prompt: "把整套 PPT 调整成 8 分钟面试讲法，标出重点页和快速带过页",
    });
  }

  if (agentSlides.length > 0) {
    priorities.push({
      id: "agent-mainline",
      label: "把 AI / Agent 主线讲实",
      detail: "不要停留在工具名，要讲业务流程、人的确认节点和结果指标。",
      prompt: "突出 AI Agent 能力，但不要炫技，改成场景、动作、结果的面试讲法",
    });
  }

  if (metricSlides.length > 0 || risks.some((risk) => risk.severity === "warning")) {
    priorities.push({
      id: "metric-grounding",
      label: "补齐数据可信度",
      detail: "所有数字都要能解释来源、口径、周期和你的贡献边界。",
      prompt: "强化数据成果的可信度，每个数字都补出口径、周期和个人贡献边界",
    });
  }

  priorities.push({
    id: "interviewer-questions",
    label: "生成面试官追问准备",
    detail: "把 PPT 变成练习入口，提前准备高概率追问。",
    prompt: "基于当前 PPT 生成每一页的面试官追问和回答要点",
  });

  return priorities.slice(0, 4);
}

function buildStrengths(draft: PresentationDraft, slides: PresentationSlide[]): string[] {
  const allText = slides.map(slideText).join("\n");
  const strengths: string[] = [];
  if (draft.narrativeProfile?.positioning) {
    strengths.push(`主线清楚：${truncate(draft.narrativeProfile.positioning, 56)}`);
  }
  if (hasAgentEvidence(allText)) {
    strengths.push("已经具备 AI / Agent 相关卖点，可以作为差异化记忆点。");
  }
  if (hasMetric(allText)) {
    strengths.push("包含量化结果，适合用来建立可信度。");
  }
  if (slides.some((slide) => slide.visualizations?.length || slide.overlayComposition?.length)) {
    strengths.push("已有可视化结构，投屏时比纯文字更容易讲清楚。");
  }
  if (strengths.length === 0) {
    strengths.push("第一版已经完成结构化整理，可以从开场、证据和讲稿节奏继续打磨。");
  }
  return strengths.slice(0, 4);
}

function buildSuggestions(priorities: PresentationDiagnosis["priorities"]): PresentationAgentSuggestion[] {
  return priorities.map((priority, index) => ({
    id: priority.id,
    label: priority.label,
    prompt: priority.prompt,
    rationale: priority.detail,
    priority: index < 2 ? "high" : "medium",
    kind:
      priority.id === "opening-hook" ? "opening"
        : priority.id === "talk-time" ? "structure"
          : priority.id === "metric-grounding" ? "evidence"
            : priority.id === "interviewer-questions" ? "practice"
              : "style",
  }));
}

function buildPracticeQuestions(slides: PresentationSlide[]): string[] {
  if (slides.every(isStarterSlide)) {
    return [
      "上传简历后，哪一段经历最应该成为开场主线？",
      "你最想让面试官记住的一个项目结果是什么？",
      "哪些数字、规模或反馈可以证明你的贡献？",
      "如果只能讲 3 分钟，你希望重点证明哪种能力？",
    ];
  }

  const candidates = slides.slice(0, 6).map((slide, index) => {
    const text = slideText(slide);
    if (hasMetric(text)) return `第 ${index + 1} 页的数字口径、周期和你的贡献边界分别是什么？`;
    if (hasAgentEvidence(text)) return `第 ${index + 1} 页里 AI / Agent 到底解决了哪个业务问题？人工确认节点在哪里？`;
    return `第 ${index + 1} 页最能证明你的一个具体例子是什么？`;
  });
  return [
    "如果只能讲 3 分钟，你会保留哪 3 页，为什么？",
    ...candidates,
    "这份演示里哪一句最能代表你的个人定位？",
  ].slice(0, 6);
}

export function makePresentationAgentMessage(
  role: PresentationAgentRole,
  content: string,
): PresentationAgentMessage {
  return {
    id: generateId(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function buildDiagnosisMessage(diagnosis: PresentationDiagnosis): PresentationAgentMessage {
  const priority = diagnosis.priorities[0];
  return makePresentationAgentMessage(
    "agent",
    [
      `我已经看完这版面试 PPT，当前成熟度 ${diagnosis.readinessScore}/100。`,
      diagnosis.storyLine,
      diagnosis.strengths[0] ? `最强点：${diagnosis.strengths[0]}` : "",
      priority ? `建议先改：${priority.label}。${priority.detail}` : "",
    ].filter(Boolean).join("\n"),
  );
}

export function diagnosePresentationDraft(draft: PresentationDraft): PresentationDiagnosis {
  const slides = visibleSelfSlides(draft);
  const slideDiagnoses = slides.map(diagnoseSlide);
  const starterDraft = isStarterDraft(draft, slides);
  const riskFlags = starterDraft ? [] : buildRiskFlags(slides);
  const priorities: PresentationDiagnosis["priorities"] = starterDraft
    ? [
        {
          id: "upload-real-resume",
          label: "上传简历生成真实版本",
          detail: "当前是可编辑框架，还没有真实经历、项目和成果证据。",
          prompt: "我已经上传简历，请用真实经历替换当前框架，并生成可投屏的第一版 PPT",
        },
        {
          id: "fill-core-experience",
          label: "补齐核心经历",
          detail: "至少需要一段最近或最强项目，才能形成可信开场。",
          prompt: "帮我补齐一段核心经历：背景、难点、我的动作、结果和可验证证据",
        },
        {
          id: "evidence-boundary",
          label: "补事实边界",
          detail: "先把数据口径、贡献范围和不可编造的信息标出来。",
          prompt: "帮我列出这版 PPT 还缺哪些事实、数字口径和个人贡献边界",
        },
      ]
    : buildPriorities(slides, riskFlags);
  const strengths = starterDraft
    ? ["已经搭好可翻页、可对话微调的演示框架，下一步需要用真实简历替换占位内容。"]
    : buildStrengths(draft, slides);
  const average = slideDiagnoses.length
    ? Math.round(slideDiagnoses.reduce((sum, item) => sum + item.score, 0) / slideDiagnoses.length)
    : 55;
  const readinessScore = starterDraft ? 52 : Math.max(50, Math.min(94, average - Math.min(riskFlags.length, 4)));
  const storyLine = draft.narrativeProfile?.positioning
    ? starterDraft
      ? `当前状态：${draft.narrativeProfile.positioning}。上传简历后会替换为真实经历和成果证据。`
      : `当前主线：${draft.narrativeProfile.positioning}`
    : slides[0]
      ? `当前主线从「${truncate(slides[0].title, 42)}」展开，需要继续压成一句可复述的面试定位。`
      : "当前还没有可诊断的演示页。";

  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    readinessScore,
    headline: starterDraft
      ? "已生成可编辑演示框架，上传简历后会替换为真实成稿。"
      : slides.length
      ? `已生成 ${slides.length} 页面试演示稿，我建议先处理 ${priorities[0]?.label ?? "开场表达"}。`
      : "还没有可诊断的演示稿。",
    storyLine,
    strengths,
    priorities,
    slideDiagnoses,
    riskFlags,
    suggestions: buildSuggestions(priorities),
    practiceQuestions: buildPracticeQuestions(slides),
  };
}
