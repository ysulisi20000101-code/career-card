import type { PresentationDraft, PresentationSlide } from "./types";
import { generateId } from "@/lib/utils";
import { diffPresentationDraft, type AgentChangeSet } from "@/lib/agent/change-diff";

export interface PresentationInstructionResult {
  draft: PresentationDraft;
  summary: string;
  changes?: AgentChangeSet;
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

function compressDraft(draft: PresentationDraft, visibleLimit: number): PresentationInstructionResult {
  const visibleSlides = draft.slides.filter((slide) => !slide.hidden);
  const keepIds = new Set(visibleSlides.slice(0, visibleLimit).map((slide) => slide.id));
  const slides = draft.slides.map((slide) => ({
    ...slide,
    hidden: slide.hidden ? true : !keepIds.has(slide.id),
  }));

  return withNewDraftId(draft, slides, `已压缩为 ${Math.min(visibleSlides.length, visibleLimit)} 页版本，适合快速面试开场。`);
}

function emphasizeAgent(draft: PresentationDraft): PresentationInstructionResult {
  const hasAgentEvidence = draft.slides.some((slide) => /AI|Agent|智能|自动化|模型|RAG/i.test(slideText(slide)));
  if (!hasAgentEvidence) {
    return { draft, summary: "当前简历演示里没有检测到 AI / Agent 证据，建议先补充相关经历后再强化这一方向。" };
  }

  const slides = draft.slides.map((slide, index) => {
    const text = slideText(slide);
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

function emphasizeMetrics(draft: PresentationDraft): PresentationInstructionResult {
  const metricPattern = /\d|%|倍|万|千|ROI|NPS|DAU|MAU|GMV/i;
  const slides = draft.slides.map((slide) => {
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

function makeBusinessStyle(draft: PresentationDraft): PresentationInstructionResult {
  const slides = draft.slides.map((slide) => ({
    ...slide,
    layoutIntensity: slide.layoutIntensity === "reference" ? "dense" as const : slide.layoutIntensity,
    speakerNotes: appendSpeakerNote(slide.speakerNotes, "微调方向：表达更克制，先给结论，再给证据。"),
  }));

  return withNewDraftId(
    { ...draft, themeId: "light-story" },
    slides,
    "已切到更商务克制的表达：降低炫技感，强化结论和证据。",
  );
}

function makeProductInterview(draft: PresentationDraft): PresentationInstructionResult {
  const slides = draft.slides.map((slide, index) => {
    if (index > 3 && slide.kind !== "resolution") return slide;
    return {
      ...slide,
      bullets: appendUnique(slide.bullets ?? [], "产品面试讲法：先定义业务问题，再说明判断、取舍、推进和验证。", 6),
      speakerNotes: appendSpeakerNote(slide.speakerNotes, "微调方向：用产品经理语言讲问题定义、方案取舍、协同推进和指标验证。"),
    };
  });

  return withNewDraftId(draft, slides, "已改成更适合产品经理面试的讲法：问题定义、方案取舍、指标验证更靠前。");
}

function applyGenericInstruction(draft: PresentationDraft, instruction: string): PresentationInstructionResult {
  const clean = instruction.trim().slice(0, 80);
  const slides = draft.slides.map((slide, index) => {
    if (index !== 0) return slide;
    return {
      ...slide,
      summaryLine: clean ? `本版微调方向：${clean}` : slide.summaryLine,
      speakerNotes: appendSpeakerNote(slide.speakerNotes, clean ? `用户微调指令：${clean}` : "用户要求对当前演示做微调。"),
    };
  });

  return withNewDraftId(draft, slides, "已记录微调方向到演示首页，后续可继续用 AI 精修展开到每一页。");
}

export function applyPresentationInstruction(draft: PresentationDraft, instruction: string): PresentationInstructionResult {
  const clean = instruction.trim();
  const normalized = clean.toLowerCase();

  if (!clean) return { draft, summary: "请输入你希望怎么调整这份 PPT。" };

  if (/压缩|精简|6\s*页|六页|短一点|更短/.test(clean)) {
    return compressDraft(draft, 6);
  }
  if (/ai|agent|智能|自动化|大模型|rag/.test(normalized)) {
    return emphasizeAgent(draft);
  }
  if (/数据|指标|量化|数字|roi|nps|增长|转化|提升/.test(normalized)) {
    return emphasizeMetrics(draft);
  }
  if (/商务|高级|克制|正式|咨询|汇报/.test(clean)) {
    return makeBusinessStyle(draft);
  }
  if (/产品经理|产品面试|pm|prd|需求|用户|业务/.test(normalized)) {
    return makeProductInterview(draft);
  }
  if (/岗位|jd|职位|公司|匹配/.test(normalized)) {
    return applyGenericInstruction(draft, clean);
  }

  return applyGenericInstruction(draft, clean);
}
