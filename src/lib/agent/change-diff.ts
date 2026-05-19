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
  category?: "content" | "structure" | "visual" | "notes" | "risk";
  reason?: string;
  riskLevel?: "none" | "needs-confirmation" | "blocked";
  source?: "resume" | "agent" | "manual" | "template";
  slideId?: string;
  field?: keyof PresentationSlide | keyof PresentationDraft;
  beforeValue?: unknown;
  afterValue?: unknown;
}

export interface AgentChangeSet {
  id: string;
  summary: string;
  createdAt: string;
  items: AgentChangeItem[];
  riskFlags?: Array<{
    id: string;
    severity: "info" | "warning" | "error";
    label: string;
    detail: string;
    slideId?: string;
  }>;
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
  meta: Partial<AgentChangeItem> = {},
) {
  const before = text(beforeValue);
  const after = text(afterValue);
  if (before === after) return;
  const hasMetric = /\d|%|倍|万|千|ROI|NPS|DAU|MAU|GMV/i.test(after);
  items.push({
    id: generateId(),
    scope,
    label,
    before: before || "空",
    after: after || "空",
    kind: !before ? "added" : !after ? "removed" : "changed",
    beforeValue,
    afterValue,
    category: meta.category,
    reason: meta.reason,
    riskLevel: meta.riskLevel ?? (scope === "presentation" && hasMetric ? "needs-confirmation" : undefined),
    source: meta.source ?? (scope === "presentation" ? "agent" : undefined),
    slideId: meta.slideId,
    field: meta.field,
  });
}

function makeChangeSet(summary: string, items: AgentChangeItem[]): AgentChangeSet {
  const riskFlags = items
    .filter((item) => item.riskLevel && item.riskLevel !== "none")
    .map((item) => ({
      id: generateId(),
      severity: item.riskLevel === "blocked" ? "error" as const : "warning" as const,
      label: item.label,
      detail: item.reason ?? "这条修改含有量化或事实性表述，建议确认口径、周期和个人贡献边界。",
      slideId: item.slideId,
    }))
    .slice(0, 8);
  return {
    id: generateId(),
    summary,
    createdAt: new Date().toISOString(),
    items,
    riskFlags,
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

    pushChange(items, "presentation", `${label} 标题`, previous.slide.title, slide.title, {
      category: "content",
      slideId: slide.id,
      field: "title",
      reason: "标题会改变面试官对这一页的第一判断。",
    });
    pushChange(items, "presentation", `${label} 正文`, previous.slide.body, slide.body, {
      category: "content",
      slideId: slide.id,
      field: "body",
      reason: "正文会影响这一页的主张和事实表达。",
    });
    pushChange(items, "presentation", `${label} 要点`, previous.slide.bullets, slide.bullets, {
      category: "content",
      slideId: slide.id,
      field: "bullets",
      reason: "要点会影响用户讲述顺序和证据密度。",
    });
    pushChange(items, "presentation", `${label} 摘要`, previous.slide.summaryLine, slide.summaryLine, {
      category: "content",
      slideId: slide.id,
      field: "summaryLine",
      reason: "摘要会影响这一页的口播结论。",
    });
    pushChange(items, "presentation", `${label} 卡片`, previous.slide.cards, slide.cards, {
      category: "visual",
      slideId: slide.id,
      field: "cards",
      reason: "卡片变化会影响页面的信息分组和投屏可读性。",
    });
    pushChange(items, "presentation", `${label} 强调信息`, previous.slide.highlightCallouts, slide.highlightCallouts, {
      category: "visual",
      slideId: slide.id,
      field: "highlightCallouts",
      reason: "强调信息会改变面试官优先注意的内容。",
    });
    pushChange(items, "presentation", `${label} 讲稿备注`, previous.slide.speakerNotes, slide.speakerNotes, {
      category: "notes",
      slideId: slide.id,
      field: "speakerNotes",
      reason: "讲稿备注会影响真实面试时的表达节奏。",
    });
    if (previous.slide.hidden !== slide.hidden) {
      pushChange(items, "presentation", `${label} 可见性`, previous.slide.hidden ? "隐藏" : "显示", slide.hidden ? "隐藏" : "显示", {
        category: "structure",
        slideId: slide.id,
        field: "hidden",
        reason: "可见性变化会改变最终演示结构。",
      });
    }
    pushChange(items, "presentation", `${label} 版式密度`, previous.slide.layoutIntensity, slide.layoutIntensity, {
      category: "visual",
      slideId: slide.id,
      field: "layoutIntensity",
      reason: "版式密度会影响投屏时的信息压迫感。",
    });
  }

  for (const { slide, index } of beforeById.values()) {
    if (!afterById.has(slide.id)) {
      pushChange(items, "presentation", `${slideLabel(slide, index)} 删除`, [slide.title, slide.body], "");
    }
  }

  pushChange(items, "presentation", "整套视觉主题", before.themeId, after.themeId, {
    category: "visual",
    field: "themeId",
    reason: "视觉主题变化会影响整份演示的气质。",
  });

  return makeChangeSet(summary, items.slice(0, 32));
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
