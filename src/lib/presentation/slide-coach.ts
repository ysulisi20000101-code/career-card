import type { PresentationOverlay, PresentationSlide } from "./types";

export interface SlideCoachBrief {
  purpose: string;
  fullScoreMove: string;
  talkTrack: string[];
  compressedVersion: string;
  likelyQuestions: string[];
  caution: string;
}

function firstText(values: Array<string | undefined>, fallback: string): string {
  return values.find((value) => value && value.trim().length > 0)?.trim() ?? fallback;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, max = 96): string {
  const value = clean(text);
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function bulletsFromSlide(slide: PresentationSlide): string[] {
  return [
    ...(slide.bullets ?? []),
    ...(slide.cards ?? []).map((card) => `${card.title}：${card.body}`),
    ...(slide.highlightCallouts ?? []).map((callout) => `${callout.title}：${callout.body}`),
  ]
    .map((item) => clean(item))
    .filter(Boolean)
    .slice(0, 5);
}

function overlayQuestions(slide: PresentationSlide, overlays: PresentationOverlay[]): string[] {
  return (slide.overlayIds ?? [])
    .map((id) => overlays.find((overlay) => overlay.id === id))
    .filter((overlay): overlay is PresentationOverlay => Boolean(overlay))
    .map((overlay) => `如果面试官打开「${overlay.title}」，你能讲清楚证据来源和边界吗？`)
    .slice(0, 2);
}

function modulePurpose(slide: PresentationSlide, moduleLabel?: string): string {
  if (slide.kind === "hero") return "建立第一印象：你是谁、目标岗位是什么、这场面试为什么值得继续听。";
  if (slide.kind === "impact") return "用可验证结果建立可信度，避免经历变成主观自夸。";
  if (slide.kind === "resolution") return "把前面的经历、岗位和个人主张收束成一个清晰结论。";
  return `服务「${moduleLabel ?? slide.moduleTitle ?? "自我介绍"}」模块：让这一页承担一个明确的面试任务。`;
}

function cautionForSlide(slide: PresentationSlide): string {
  if (slide.kind === "impact") return "指标要能解释口径、周期和你的贡献边界。";
  if (slide.kind === "hero") return "开场不要铺太长履历，先给面试官一个能记住的定位。";
  return "避免照读页面，把每一条都说成「判断 + 证据 + 和岗位的关系」。";
}

function fullScoreMoveForSlide(slide: PresentationSlide): string {
  if (slide.kind === "impact") {
    return "满分讲法是把结果拆成指标口径、统计周期、你的贡献和可复核来源，让数字经得起追问。";
  }
  if (slide.kind === "hero") {
    return "满分讲法是在 30 秒内完成定位、目标岗位和最强证据预告，让面试官知道接下来要听什么。";
  }
  if (slide.kind === "resolution") {
    return "满分讲法是把前面的证据收束成入职后的行动判断，而不是只做礼貌性总结。";
  }
  return "满分讲法是每页只承担一个任务：判断先行，证据跟上，最后回扣岗位价值。";
}

function likelyQuestionsForSlide(slide: PresentationSlide, overlays: PresentationOverlay[]): string[] {
  const bodyQuestion = slide.body
    ? `你刚才这个判断的依据是什么：${truncate(slide.body, 42)}？`
    : "";
  const bulletQuestion = slide.bullets[0]
    ? `能展开讲一个具体例子证明「${truncate(slide.bullets[0], 36)}」吗？`
    : "";

  return [
    bodyQuestion || "这段经历和目标岗位有什么直接关系？",
    bulletQuestion || "这页里最强的证据是哪一个？",
    "如果面试官追问你的角色边界，你怎么说明？",
    ...overlayQuestions(slide, overlays),
  ].filter(Boolean).slice(0, 4);
}

export function buildSlideCoachBrief(
  slide: PresentationSlide,
  overlays: PresentationOverlay[],
  moduleLabel?: string,
): SlideCoachBrief {
  const evidence = bulletsFromSlide(slide);
  const firstEvidence = firstText(evidence, slide.body || slide.title);
  const secondEvidence = evidence[1];
  const talkTrack = [
    `先用一句话定调：${truncate(slide.title, 54)}`,
    `再给证据：${truncate(firstEvidence, 86)}`,
    secondEvidence ? `补一层面试官关心的细节：${truncate(secondEvidence, 86)}` : "补一层面试官关心的细节：你的角色、动作、结果和边界。",
    "最后回扣表达价值：这段经历为什么能证明你适合这场面试。",
  ];

  return {
    purpose: modulePurpose(slide, moduleLabel),
    fullScoreMove: fullScoreMoveForSlide(slide),
    talkTrack,
    compressedVersion: [
      truncate(slide.title, 44),
      truncate(firstEvidence, 72),
      "我的结论会回到表达价值。",
    ].join("。"),
    likelyQuestions: likelyQuestionsForSlide(slide, overlays),
    caution: cautionForSlide(slide),
  };
}
