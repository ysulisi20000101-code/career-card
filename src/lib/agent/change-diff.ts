import type { CareerSiteDraft } from "@/lib/agent/site-generator/types";
import type { PresentationDraft, PresentationSlide } from "@/lib/presentation/types";
import { generateId } from "@/lib/utils";

export interface AgentChangeItem {
  id: string;
  scope: "site" | "presentation";
  label: string;
  before: string;
  after: string;
  kind?: "added" | "removed" | "changed";
}

export interface AgentChangeSet {
  id: string;
  summary: string;
  createdAt: string;
  items: AgentChangeItem[];
}

function text(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  return String(value).trim();
}

function pushChange(
  items: AgentChangeItem[],
  scope: AgentChangeItem["scope"],
  label: string,
  beforeValue: unknown,
  afterValue: unknown,
) {
  const before = text(beforeValue);
  const after = text(afterValue);
  if (before === after) return;
  items.push({
    id: generateId(),
    scope,
    label,
    before: before || "空",
    after: after || "空",
    kind: !before ? "added" : !after ? "removed" : "changed",
  });
}

function makeChangeSet(summary: string, items: AgentChangeItem[]): AgentChangeSet {
  return {
    id: generateId(),
    summary,
    createdAt: new Date().toISOString(),
    items,
  };
}

function slideLabel(slide: PresentationSlide, index: number): string {
  return `${index + 1}. ${slide.title || slide.kind || slide.id}`;
}

export function diffPresentationDraft(
  before: PresentationDraft | null | undefined,
  after: PresentationDraft,
  summary = "已更新面试 PPT",
): AgentChangeSet {
  const items: AgentChangeItem[] = [];
  if (!before) {
    return makeChangeSet(summary, [{
      id: generateId(),
      scope: "presentation",
      label: "整套 PPT",
      before: "空",
      after: `${after.slides.filter((slide) => !slide.hidden).length} 页已生成`,
      kind: "added",
    }]);
  }

  const beforeById = new Map(before.slides.map((slide, index) => [slide.id, { slide, index }]));
  const afterById = new Map(after.slides.map((slide, index) => [slide.id, { slide, index }]));

  for (const { slide, index } of afterById.values()) {
    const previous = beforeById.get(slide.id);
    const label = slideLabel(slide, index);
    if (!previous) {
      pushChange(items, "presentation", `${label} 新增`, "", [slide.title, slide.body, ...(slide.bullets ?? [])]);
      continue;
    }

    pushChange(items, "presentation", `${label} 标题`, previous.slide.title, slide.title);
    pushChange(items, "presentation", `${label} 正文`, previous.slide.body, slide.body);
    pushChange(items, "presentation", `${label} 要点`, previous.slide.bullets, slide.bullets);
    pushChange(items, "presentation", `${label} 讲稿备注`, previous.slide.speakerNotes, slide.speakerNotes);
    if (previous.slide.hidden !== slide.hidden) {
      pushChange(items, "presentation", `${label} 可见性`, previous.slide.hidden ? "隐藏" : "显示", slide.hidden ? "隐藏" : "显示");
    }
  }

  for (const { slide, index } of beforeById.values()) {
    if (!afterById.has(slide.id)) {
      pushChange(items, "presentation", `${slideLabel(slide, index)} 删除`, [slide.title, slide.body], "");
    }
  }

  return makeChangeSet(summary, items.slice(0, 24));
}

export function diffCareerSiteDraft(
  before: CareerSiteDraft | null | undefined,
  after: CareerSiteDraft,
  summary = "已更新个人网站",
): AgentChangeSet {
  const items: AgentChangeItem[] = [];
  if (!before) {
    return makeChangeSet(summary, [{
      id: generateId(),
      scope: "site",
      label: "个人网站初稿",
      before: "空",
      after: after.hero.title,
      kind: "added",
    }]);
  }

  pushChange(items, "site", "首页标题", before.hero.title, after.hero.title);
  pushChange(items, "site", "首页副标题", before.hero.subtitle, after.hero.subtitle);
  pushChange(items, "site", "职业定位", before.positioning.targetRole, after.positioning.targetRole);
  pushChange(items, "site", "一句话定位", before.positioning.oneLinePitch, after.positioning.oneLinePitch);
  pushChange(items, "site", "核心优势", before.positioning.coreStrengths, after.positioning.coreStrengths);
  pushChange(items, "site", "叙事主题", before.narrative.theme, after.narrative.theme);
  pushChange(items, "site", "叙事主线", before.narrative.storyArc, after.narrative.storyArc);
  pushChange(items, "site", "视觉风格", before.style.preset, after.style.preset);
  pushChange(items, "site", "表达语气", before.style.tone, after.style.tone);

  const beforeSections = new Map(before.sections.map((section) => [section.id, section]));
  for (const section of after.sections) {
    const previous = beforeSections.get(section.id);
    if (!previous) {
      pushChange(items, "site", `新增模块：${section.title}`, "", [section.body, ...section.bullets]);
      continue;
    }
    pushChange(items, "site", `${section.title} 标题`, previous.title, section.title);
    pushChange(items, "site", `${section.title} 正文`, previous.body, section.body);
    pushChange(items, "site", `${section.title} 要点`, previous.bullets, section.bullets);
  }

  const beforeBlocks = new Map(before.experienceBlocks.map((block) => [block.id, block]));
  for (const block of after.experienceBlocks) {
    const previous = beforeBlocks.get(block.id);
    if (!previous) continue;
    pushChange(items, "site", `${block.title} 经历摘要`, previous.summary, block.summary);
    pushChange(items, "site", `${block.title} 经历要点`, previous.bullets, block.bullets);
  }

  return makeChangeSet(summary, items.slice(0, 24));
}
