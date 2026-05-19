import type { PresentationDraft, PresentationSlide } from "./types";
import { generateId } from "@/lib/utils";
import { diffPresentationDraft, type AgentChangeSet } from "@/lib/agent/change-diff";

export interface PresentationInstructionResult {
  draft: PresentationDraft;
  summary: string;
  changes?: AgentChangeSet;
}

interface InstructionContext {
  targetSlideIndex?: number;
}

function nowIso(): string {
  return new Date().toISOString();
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
  ].filter(Boolean).join("\n");
}

function withNewDraftId(draft: PresentationDraft, slides: PresentationSlide[], summary: string): PresentationInstructionResult {
  const now = nowIso();
  const nextDraft = {
    ...draft,
    id: generateId(),
    slides,
    createdAt: now,
    updatedAt: now,
  };
  return {
    draft: nextDraft,
    summary,
    changes: diffPresentationDraft(draft, nextDraft, summary),
  };
}

function appendUnique(items: string[], next: string, limit = 5): string[] {
  const normalized = next.trim();
  if (!normalized) return items;
  if (items.some((item) => item.trim() === normalized)) return items;
  return [...items, normalized].slice(0, limit);
}

function appendSpeakerNote(note: string | undefined, addition: string): string {
  const clean = addition.trim();
  if (!note?.trim()) return clean;
  if (note.includes(clean)) return note;
  return `${note.trim()}\n${clean}`;
}

function visibleSlides(draft: PresentationDraft): Array<{ slide: PresentationSlide; index: number; visibleIndex: number }> {
  let visibleIndex = 0;
  return draft.slides.flatMap((slide, index) => {
    if (slide.hidden || (slide.moduleId ?? "self") !== "self") return [];
    const item = { slide, index, visibleIndex };
    visibleIndex += 1;
    return [item];
  });
}

function parseChineseNumber(value: string): number | null {
  const map: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  if (map[value]) return map[value];
  if (value.startsWith("十")) return 10 + (map[value.slice(1)] ?? 0);
  if (value.endsWith("十")) return (map[value[0] ?? ""] ?? 1) * 10;
  if (value.includes("十")) {
    const [left, right] = value.split("十");
    return (map[left ?? ""] ?? 1) * 10 + (map[right ?? ""] ?? 0);
  }
  return null;
}

function resolveTargetSlideIndex(draft: PresentationDraft, instruction: string): number | undefined {
  const numeric = instruction.match(/(?:第\s*)?(\d{1,2})\s*(?:页|頁|p|P|slide|Slide)/);
  const chinese = instruction.match(/第\s*([一二三四五六七八九十]{1,3})\s*(?:页|頁)/);
  const requested = numeric ? Number(numeric[1]) : chinese ? parseChineseNumber(chinese[1] ?? "") : null;
  if (!requested || Number.isNaN(requested)) return undefined;
  const target = visibleSlides(draft).find((item) => item.visibleIndex === requested - 1);
  return target?.index;
}

function applyToTargetSlides(
  draft: PresentationDraft,
  context: InstructionContext,
  updater: (slide: PresentationSlide, visibleIndex: number) => PresentationSlide,
): PresentationSlide[] {
  const visible = visibleSlides(draft);
  const targetIndexes = context.targetSlideIndex !== undefined
    ? new Set([context.targetSlideIndex])
    : new Set(visible.slice(0, 3).map((item) => item.index));

  const visibleIndexByIndex = new Map(visible.map((item) => [item.index, item.visibleIndex]));
  return draft.slides.map((slide, index) => {
    if (!targetIndexes.has(index)) return slide;
    return updater(slide, visibleIndexByIndex.get(index) ?? index);
  });
}

function compressDraft(draft: PresentationDraft, visibleLimit: number): PresentationInstructionResult {
  const visibleSlides = draft.slides.filter((slide) => !slide.hidden);
  const keepIds = new Set(visibleSlides.slice(0, visibleLimit).map((slide) => slide.id));
  const slides = draft.slides.map((slide) => ({
    ...slide,
    hidden: slide.hidden ? true : !keepIds.has(slide.id),
  }));

  return withNewDraftId(draft, slides, `已压缩为 ${Math.min(visibleSlides.length, visibleLimit)} 页版本，适合快速面试开场。`);
}

function makeEightMinuteTalkTrack(draft: PresentationDraft): PresentationInstructionResult {
  const visible = visibleSlides(draft);
  const focusIds = new Set([
    visible[0]?.slide.id,
    ...visible
      .filter(({ slide }) => /AI|Agent|智能|自动化|模型|RAG|\d|%|万|倍/i.test(slideText(slide)))
      .slice(0, 3)
      .map(({ slide }) => slide.id),
    visible.at(-1)?.slide.id,
  ].filter(Boolean));

  const slides = draft.slides.map((slide) => {
    if (slide.hidden || (slide.moduleId ?? "self") !== "self") return slide;
    const focus = focusIds.has(slide.id);
    return {
      ...slide,
      summaryLine: focus
        ? slide.summaryLine || "这一页是重点讲述页，建议展开判断、动作和证据。"
        : slide.summaryLine || "这一页快速带过，只保留一句结论。",
      speakerNotes: appendSpeakerNote(
        slide.speakerNotes,
        focus
          ? "8 分钟讲法：这一页讲 60-75 秒，先讲结论，再讲一个具体证据，最后回扣面试价值。"
          : "8 分钟讲法：这一页控制在 20-30 秒，用一句话过渡，不展开细枝末节。",
      ),
    };
  });

  return withNewDraftId(draft, slides, "已调整为 8 分钟面试讲法：标出重点页和快速带过页。");
}

function emphasizeAgent(draft: PresentationDraft, context: InstructionContext = {}): PresentationInstructionResult {
  const hasAgentEvidence = draft.slides.some((slide) => /AI|Agent|智能|自动化|模型|RAG/i.test(slideText(slide)));
  if (!hasAgentEvidence) {
    return { draft, summary: "当前简历演示里没有检测到 AI / Agent 证据，建议先补充相关经历后再强化这一方向。" };
  }

  const slides = draft.slides.map((slide, index) => {
    const text = slideText(slide);
    if (context.targetSlideIndex !== undefined && index !== context.targetSlideIndex) return slide;
    if (index > 2 && !/AI|Agent|智能|自动化|模型|RAG/i.test(text)) return slide;
    return {
      ...slide,
      bullets: appendUnique(slide.bullets ?? [], "讲法重点：把 AI / Agent 能力落到业务流程、工具调用、人工确认和结果指标。", 6),
      featurePills: appendUnique(
        (slide.featurePills ?? []).map((pill) => pill.label),
        "AI Agent",
        4,
      ).map((label) => ({ label, variant: label === "AI Agent" ? "violet" as const : "blue" as const })),
      speakerNotes: appendSpeakerNote(slide.speakerNotes, "微调方向：这一页优先讲 AI / Agent 如何服务业务结果，不停留在工具名。"),
    };
  });

  return withNewDraftId(draft, slides, "已强化 AI / Agent 主线：把相关页改成“能力 -> 场景 -> 结果”的讲法。");
}

function emphasizeMetrics(draft: PresentationDraft, context: InstructionContext = {}): PresentationInstructionResult {
  const metricPattern = /\d|%|倍|万|千|ROI|NPS|DAU|MAU|GMV/i;
  const slides = draft.slides.map((slide) => {
    if (context.targetSlideIndex !== undefined && draft.slides[context.targetSlideIndex]?.id !== slide.id) return slide;
    if (!metricPattern.test(slideText(slide))) return slide;
    return {
      ...slide,
      summaryLine: slide.summaryLine || "这一页优先用数字建立可信度。",
      highlightCallouts: [
        ...(slide.highlightCallouts ?? []),
        { title: "数据讲法", body: "讲清口径、周期、你的贡献边界，再回到岗位价值。", variant: "gold" as const },
      ].slice(0, 3),
      speakerNotes: appendSpeakerNote(slide.speakerNotes, "微调方向：不要只报数字，要补充统计口径、周期和自己的角色边界。"),
    };
  });

  return withNewDraftId(draft, slides, "已强化数据成果页：突出指标口径、贡献边界和面试可讲性。");
}

function makeBusinessStyle(draft: PresentationDraft, context: InstructionContext = {}): PresentationInstructionResult {
  const slides = (context.targetSlideIndex !== undefined ? applyToTargetSlides(draft, context, (slide) => ({
    ...slide,
    layoutIntensity: slide.layoutIntensity === "reference" ? "dense" as const : slide.layoutIntensity,
    speakerNotes: appendSpeakerNote(slide.speakerNotes, "微调方向：表达更克制，先给结论，再给证据。"),
  })) : draft.slides.map((slide) => ({
    ...slide,
    layoutIntensity: slide.layoutIntensity === "reference" ? "dense" as const : slide.layoutIntensity,
    speakerNotes: appendSpeakerNote(slide.speakerNotes, "微调方向：表达更克制，先给结论，再给证据。"),
  })));

  return withNewDraftId(
    { ...draft, themeId: "light-story" },
    slides,
    "已切到更商务克制的表达：降低炫技感，强化结论和证据。",
  );
}

function makeProductInterview(draft: PresentationDraft, context: InstructionContext = {}): PresentationInstructionResult {
  const slides = draft.slides.map((slide, index) => {
    if (context.targetSlideIndex !== undefined && index !== context.targetSlideIndex) return slide;
    if (index > 3 && slide.kind !== "resolution") return slide;
    return {
      ...slide,
      bullets: appendUnique(slide.bullets ?? [], "产品面试讲法：先定义业务问题，再说明判断、取舍、推进和验证。", 6),
      speakerNotes: appendSpeakerNote(slide.speakerNotes, "微调方向：用产品经理语言讲问题定义、方案取舍、协同推进和指标验证。"),
    };
  });

  return withNewDraftId(draft, slides, "已改成更适合产品经理面试的讲法：问题定义、方案取舍、指标验证更靠前。");
}

function makeInterviewQuestions(draft: PresentationDraft, context: InstructionContext = {}): PresentationInstructionResult {
  const slides = applyToTargetSlides(draft, context, (slide, visibleIndex) => {
    const text = slideText(slide);
    const questions = [
      `面试官追问：第 ${visibleIndex + 1} 页里最关键的判断依据是什么？`,
      /AI|Agent|智能|自动化|模型|RAG/i.test(text)
        ? "面试官追问：AI / Agent 在这里解决的是业务问题，还是只是工具使用？"
        : "面试官追问：这段经历和目标岗位的关系是什么？",
      /\d|%|倍|万|千/.test(text)
        ? "面试官追问：这个数字的口径、周期和你的贡献边界是什么？"
        : "面试官追问：能不能补一个更具体的例子？",
    ];
    return {
      ...slide,
      speakerNotes: appendSpeakerNote(slide.speakerNotes, questions.join("\n")),
    };
  });

  return withNewDraftId(draft, slides, context.targetSlideIndex !== undefined
    ? "已为指定页面生成面试官追问准备。"
    : "已为重点页面生成面试官追问准备。");
}

function makeGroundedReview(draft: PresentationDraft, context: InstructionContext = {}): PresentationInstructionResult {
  const slides = applyToTargetSlides(draft, context, (slide) => ({
    ...slide,
    summaryLine: slide.summaryLine || "这一页只保留真实经历中能支撑的判断。",
    speakerNotes: appendSpeakerNote(
      slide.speakerNotes,
      "事实边界：不要新增简历外公司、数字或结果；如果面试官追问，优先说明口径、周期和个人贡献边界。",
    ),
  }));

  return withNewDraftId(draft, slides, "已增加事实边界提示：本次不会新增未经确认的数字、公司或业务结果。");
}

function makeProjectReviewStyle(draft: PresentationDraft, instruction: string, context: InstructionContext = {}): PresentationInstructionResult {
  const clean = instruction.trim().slice(0, 80);
  const slides = applyToTargetSlides(draft, context, (slide) => ({
    ...slide,
    summaryLine: "按真实项目复盘讲：问题、动作、结果、边界。",
    bullets: appendUnique(slide.bullets ?? [], "复盘讲法：先说问题，再说你做了什么、产生什么结果、边界在哪里。", 6),
    speakerNotes: appendSpeakerNote(
      slide.speakerNotes,
      `用户要求：${clean}\n讲述结构：问题是什么 -> 我怎么判断 -> 我做了什么 -> 结果和边界是什么。`,
    ),
  }));

  return withNewDraftId(draft, slides, "已改成更像真实项目复盘的讲法：问题、动作、结果和边界更清楚。");
}

function applyGenericInstruction(draft: PresentationDraft, instruction: string, context: InstructionContext = {}): PresentationInstructionResult {
  const clean = instruction.trim().slice(0, 80);
  const slides = applyToTargetSlides(draft, context, (slide, visibleIndex) => ({
    ...slide,
    summaryLine: clean
      ? context.targetSlideIndex !== undefined
        ? `第 ${visibleIndex + 1} 页微调方向：${clean}`
        : `本页微调方向：${clean}`
      : slide.summaryLine,
    speakerNotes: appendSpeakerNote(slide.speakerNotes, clean ? `用户微调指令：${clean}` : "用户要求对当前演示做微调。"),
  }));

  return withNewDraftId(
    draft,
    slides,
    context.targetSlideIndex !== undefined
      ? "已把微调指令应用到指定页面，并保留为可审阅修改。"
      : "已把微调方向应用到重点页面，后续可继续用 AI 精修展开。",
  );
}

export function applyPresentationInstruction(draft: PresentationDraft, instruction: string): PresentationInstructionResult {
  const clean = instruction.trim();
  const normalized = clean.toLowerCase();
  const context: InstructionContext = { targetSlideIndex: resolveTargetSlideIndex(draft, clean) };

  if (!clean) return { draft, summary: "请输入你希望怎么调整这份 PPT。" };

  if (/8\s*分钟|八分钟|8\s*min|八\s*分钟/.test(normalized)) {
    return makeEightMinuteTalkTrack(draft);
  }
  if (/压缩|精简|6\s*页|六页|短一点|更短/.test(clean)) {
    return compressDraft(draft, 6);
  }
  if (/ai|agent|智能|自动化|大模型|rag/.test(normalized)) {
    return emphasizeAgent(draft, context);
  }
  if (/数据|指标|量化|数字|roi|nps|增长|转化|提升/.test(normalized)) {
    return emphasizeMetrics(draft, context);
  }
  if (/商务|高级|克制|正式|咨询|汇报/.test(clean)) {
    return makeBusinessStyle(draft, context);
  }
  if (/产品经理|产品面试|pm|prd|需求|用户|业务/.test(normalized)) {
    return makeProductInterview(draft, context);
  }
  if (/追问|面试官|练习|回答要点|怎么回答/.test(normalized)) {
    return makeInterviewQuestions(draft, context);
  }
  if (/不编造|别编|真实|事实|可信|口径|边界/.test(normalized)) {
    return /复盘|真实项目|项目复盘/.test(normalized)
      ? makeProjectReviewStyle(draft, clean, context)
      : makeGroundedReview(draft, context);
  }
  if (/复盘|真实项目|项目复盘|太虚|有点虚|更实/.test(normalized)) {
    return makeProjectReviewStyle(draft, clean, context);
  }
  if (/岗位|jd|职位|公司|匹配/.test(normalized)) {
    return applyGenericInstruction(draft, clean, context);
  }

  return applyGenericInstruction(draft, clean, context);
}
