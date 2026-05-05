import type { ResumeData } from "@/types";
import type { PresentationDraft, PresentationSlide } from "@/lib/presentation/types";
import type {
  LLMEnhancementOutput,
  SlideEnhancementUpdate,
  OverlayEnhancementUpdate,
  ValidationIssue,
} from "./types";

const ALLOWED_SLIDE_FIELDS: Array<keyof SlideEnhancementUpdate> = [
  "id", "title", "subtitle", "body", "bullets", "visualizations",
  "phaseTag", "summaryLine", "highlightCallouts", "cards",
  "closingQuote", "narrativeThread", "featurePills",
  "domainTags", "narrativeBeats", "layoutIntensity", "overlayComposition", "speakerNotes",
];

const VALID_CARD_VARIANTS = new Set(["gold", "teal", "violet", "blue", "rose", "green", "cyan"]);
const VALID_VIZ_TYPES = new Set([
  "hero-architecture",
  "v-model",
  "pipeline",
  "platform-quadrants",
  "agent-workflow",
  "rag-flow",
  "impact-metrics",
  "orbit",
  "custom",
]);
const VALID_LAYOUT_INTENSITY = new Set(["standard", "dense", "reference"]);
const TAG_RULES: Record<string, { phase: string[]; beats: string[]; domainTagsAllowed?: boolean; featurePillsAllowed?: boolean }> = {
  hero: { phase: ["目标", "定位", "开场"], beats: ["定位", "系统", "证据", "目标", "Agent", "商业化"], domainTagsAllowed: true },
  foundation: { phase: ["早期", "训练", "底座", "能力"], beats: ["早期", "训练", "底座", "迁移", "方法", "元能力"] },
  tension: { phase: ["行业", "断点", "矛盾", "问题"], beats: ["行业", "矛盾", "断点", "工具", "割裂", "机会", "前提"] },
  "platform-build": { phase: ["平台", "数据", "结构化"], beats: ["平台", "结构化", "协同", "交付", "商业验证"] },
  "agent-leap": { phase: ["Agent", "跃迁", "智能"], beats: ["Agent", "跃迁", "受控", "工作流", "RAG", "反直觉", "证据"] },
  fullstack: { phase: ["全链路", "生命周期", "方法"], beats: ["全链路", "平台层", "智能层", "运行态", "复用", "方法"], domainTagsAllowed: true, featurePillsAllowed: true },
  lifecycle: { phase: ["全链路", "生命周期", "方法"], beats: ["全链路", "平台层", "智能层", "运行态", "复用", "方法"], domainTagsAllowed: true, featurePillsAllowed: true },
  impact: { phase: ["结果", "商业", "验证", "影响"], beats: ["结果", "用户", "效率", "客户", "商业化", "指标", "验证"] },
  resolution: { phase: ["主张", "闭环", "总结"], beats: ["回扣", "闭环", "主张", "个人品牌", "Before/After", "视觉回扣"] },
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function containsExecutableMarkup(value: unknown): boolean {
  if (typeof value === "string") {
    return /<\s*(script|svg|style|html|body|iframe)\b|javascript:|function\s+\w*\s*\(|=>\s*\{|import\s+.+from\s+/i.test(value);
  }
  if (Array.isArray(value)) return value.some(containsExecutableMarkup);
  if (!isRecord(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (/^(html|svg|rawSvg|script|javascript|css|jsx|tsx|reactCode)$/i.test(key)) return true;
    if (containsExecutableMarkup(child)) return true;
  }
  return false;
}

// ─── Field-level validators ──────────────────────────────────────────

function validateStringField(val: unknown, maxLen: number): string | undefined {
  if (val === undefined) return undefined;
  if (typeof val !== "string") return undefined;
  if (containsExecutableMarkup(val)) return undefined;
  return val.trim().slice(0, maxLen);
}

function validateBullets(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  return val.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 12);
}

function validateVisualizations(val: unknown): PresentationSlide["visualizations"] | undefined {
  if (!Array.isArray(val)) return undefined;
  const result: PresentationSlide["visualizations"] = [];
  for (const item of val) {
    if (!isRecord(item)) continue;
    const type = String(item.type ?? "");
    if (!VALID_VIZ_TYPES.has(type)) continue;
    if (containsExecutableMarkup(item.data)) continue;
    result.push({ type: type as PresentationSlide["visualizations"] extends Array<infer T> ? T extends { type: infer U } ? U : never : never, data: item.data as Record<string, unknown> ?? {} });
  }
  return result.length > 0 ? result : undefined;
}

function validateOverlayComposition(val: unknown): PresentationSlide["overlayComposition"] | undefined {
  if (!Array.isArray(val)) return undefined;
  const result: NonNullable<PresentationSlide["overlayComposition"]> = [];
  for (const item of val) {
    if (!isRecord(item)) continue;
    const id = typeof item.id === "string" ? item.id.trim().slice(0, 80) : "";
    const kind = typeof item.kind === "string" ? item.kind.trim().slice(0, 40) : "";
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 120) : "";
    if (!id || !kind || !title) continue;
    const sections = Array.isArray(item.sections)
      ? item.sections.filter(isRecord).map((section) => ({
          title: typeof section.title === "string" ? section.title.trim().slice(0, 80) : "",
          body: typeof section.body === "string" ? section.body.trim().slice(0, 400) : "",
          tone: typeof section.tone === "string" && VALID_CARD_VARIANTS.has(section.tone)
            ? section.tone as "gold" | "teal" | "violet" | "blue" | "rose" | "green" | "cyan"
            : undefined,
        })).filter((section) => section.title && section.body).slice(0, 6)
      : undefined;
    result.push({ id, kind, title, sections });
  }
  return result.length > 0 ? result : undefined;
}

function validateCallouts(val: unknown): PresentationSlide["highlightCallouts"] | undefined {
  if (!Array.isArray(val)) return undefined;
  const result: PresentationSlide["highlightCallouts"] = [];
  for (const item of val) {
    if (!isRecord(item)) continue;
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 40) : "";
    const body = typeof item.body === "string" ? item.body.trim().slice(0, 200) : "";
    const variant = typeof item.variant === "string" && VALID_CARD_VARIANTS.has(item.variant)
      ? item.variant as "gold" | "teal" | "violet"
      : "gold";
    if (title && body) result.push({ title, body, variant });
  }
  return result.length > 0 ? result : undefined;
}

function validateCards(val: unknown): PresentationSlide["cards"] | undefined {
  if (!Array.isArray(val)) return undefined;
  const result: PresentationSlide["cards"] = [];
  for (const item of val) {
    if (!isRecord(item)) continue;
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 60) : "";
    const body = typeof item.body === "string" ? item.body.trim().slice(0, 200) : "";
    const variant = typeof item.variant === "string" && VALID_CARD_VARIANTS.has(item.variant)
      ? item.variant as "gold" | "teal" | "violet"
      : "gold";
    if (title && body) result.push({ title, body, variant });
  }
  return result.length > 0 ? result : undefined;
}

function validateFeaturePills(val: unknown): PresentationSlide["featurePills"] | undefined {
  if (!Array.isArray(val)) return undefined;
  const result: PresentationSlide["featurePills"] = [];
  for (const item of val) {
    if (!isRecord(item)) continue;
    const label = typeof item.label === "string" ? item.label.trim().slice(0, 40) : "";
    const variant = typeof item.variant === "string" && VALID_CARD_VARIANTS.has(item.variant)
      ? (item.variant as "violet" | "blue" | "gold")
      : ("violet" as const);
    if (label) result.push({ label, variant });
  }
  return result.length > 0 ? result : undefined;
}

function validateDomainTags(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined;
  const tags = val.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 8);
  return tags.length > 0 ? tags : undefined;
}

function containsAny(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value.toLowerCase().includes(token.toLowerCase()));
}

export function isSlideLabelUpdateCompatible(
  slide: Pick<PresentationSlide, "id" | "kind">,
  update: Pick<SlideEnhancementUpdate, "phaseTag" | "domainTags" | "featurePills" | "narrativeBeats">,
): boolean {
  const rule = TAG_RULES[slide.id] ?? TAG_RULES[slide.kind];
  if (!rule) return true;

  if (update.phaseTag && !containsAny(update.phaseTag, rule.phase)) return false;
  if (update.narrativeBeats?.length && !update.narrativeBeats.every((beat) => containsAny(beat, rule.beats))) return false;
  if (update.domainTags?.length && !rule.domainTagsAllowed) return false;
  if (update.featurePills?.length && !rule.featurePillsAllowed) return false;

  return true;
}

function stripIncompatibleLabelFields(
  slide: PresentationSlide,
  update: SlideEnhancementUpdate,
): SlideEnhancementUpdate {
  if (isSlideLabelUpdateCompatible(slide, update)) return update;
  const cleaned = { ...update };
  delete cleaned.phaseTag;
  delete cleaned.domainTags;
  delete cleaned.featurePills;
  delete cleaned.narrativeBeats;
  return cleaned;
}

const META_NARRATIVE_RE = /面试故事|面试表达|给面试官|准备材料/;
const INTERNSHIP_SCOPE_RE = /实习|实习生|京东健康|互联网医院产品部|后台产品实习生|产品设计部|百度|京东/;
const TEAM_SIZE_RE = /(?:约\s*)?10\s*人|10\s*个\s*人/;
const NUMERIC_RE = /\d+\s*(?:%|\+|人|个|家|项)?/;
const EFFICIENCY_CARD_RE = /效率|提升|提效|节省|缩短|减少/;
const COMMERCIAL_CARD_RE = /客户|项目|售前|投标|交付|验证/;
const TEAM_CARD_RE = /团队|协同|管理|带领/;

function slideAllowsInternship(slide: PresentationSlide): boolean {
  return slide.id === "foundation";
}

function sanitizeAudienceText(slide: PresentationSlide, value: string | undefined): string | undefined {
  if (!value) return value;
  if (META_NARRATIVE_RE.test(value)) return undefined;
  if (!slideAllowsInternship(slide) && INTERNSHIP_SCOPE_RE.test(value)) return undefined;
  return value;
}

function sanitizeAudienceStringArray(slide: PresentationSlide, values: string[] | undefined): string[] | undefined {
  const cleaned = values
    ?.map((value) => sanitizeAudienceText(slide, value))
    .filter((value): value is string => Boolean(value));
  return cleaned && cleaned.length > 0 ? cleaned : undefined;
}

function cardsUseTeamSizeAsCommercialProof(cards: PresentationSlide["cards"]): boolean {
  return Boolean(cards?.some((card) =>
    /商业|客户|项目|验证/.test(card.title) && TEAM_SIZE_RE.test(`${card.title}\n${card.body}`),
  ));
}

function cardsContainUngroundedMetrics(cards: PresentationSlide["cards"]): boolean {
  return Boolean(cards?.some((card) => {
    const text = `${card.title}\n${card.body}`;
    if (!NUMERIC_RE.test(text)) return false;
    if (/%/.test(text)) return !EFFICIENCY_CARD_RE.test(text);
    if (/客户|项目/.test(text)) return !COMMERCIAL_CARD_RE.test(text);
    if (/人/.test(text)) return !TEAM_CARD_RE.test(text);
    return false;
  }));
}

function cardIntroducesNewNumbers(slide: PresentationSlide, cards: PresentationSlide["cards"]): boolean {
  const baselineNumbers = new Set(JSON.stringify(slide).match(/\d+\s*(?:%|\+|人|个|家|项)?/g) ?? []);
  const nextNumbers = JSON.stringify(cards).match(/\d+\s*(?:%|\+|人|个|家|项)?/g) ?? [];
  return nextNumbers.some((num) => !baselineNumbers.has(num));
}

function sanitizeAudienceUpdate(
  slide: PresentationSlide,
  update: SlideEnhancementUpdate,
): SlideEnhancementUpdate {
  const cleaned = { ...update };
  cleaned.title = sanitizeAudienceText(slide, cleaned.title);
  cleaned.subtitle = sanitizeAudienceText(slide, cleaned.subtitle);
  cleaned.body = sanitizeAudienceText(slide, cleaned.body);
  cleaned.phaseTag = sanitizeAudienceText(slide, cleaned.phaseTag);
  cleaned.summaryLine = sanitizeAudienceText(slide, cleaned.summaryLine);
  cleaned.closingQuote = sanitizeAudienceText(slide, cleaned.closingQuote);
  cleaned.narrativeThread = sanitizeAudienceText(slide, cleaned.narrativeThread);
  cleaned.speakerNotes = sanitizeAudienceText(slide, cleaned.speakerNotes);
  cleaned.bullets = sanitizeAudienceStringArray(slide, cleaned.bullets);
  cleaned.domainTags = sanitizeAudienceStringArray(slide, cleaned.domainTags);
  cleaned.narrativeBeats = sanitizeAudienceStringArray(slide, cleaned.narrativeBeats);

  if (cleaned.highlightCallouts) {
    const callouts = cleaned.highlightCallouts
      .map((callout) => ({
        ...callout,
        title: sanitizeAudienceText(slide, callout.title) ?? callout.title,
        body: sanitizeAudienceText(slide, callout.body) ?? "",
      }))
      .filter((callout) => callout.body.length > 0);
    cleaned.highlightCallouts = callouts.length > 0 ? callouts : undefined;
  }

  if (cleaned.cards) {
    cleaned.cards = cardsUseTeamSizeAsCommercialProof(cleaned.cards)
      || cardsContainUngroundedMetrics(cleaned.cards)
      || cardIntroducesNewNumbers(slide, cleaned.cards)
      ? undefined
      : cleaned.cards;
  }

  for (const key of Object.keys(cleaned) as Array<keyof SlideEnhancementUpdate>) {
    if (key !== "id" && cleaned[key] === undefined) delete cleaned[key];
  }

  return Object.keys(cleaned).length > 1 ? cleaned : { id: update.id };
}

// ─── Slide enhancement validator ─────────────────────────────────────

function validateSlideUpdate(raw: Record<string, unknown>): SlideEnhancementUpdate | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : null;
  if (!id) return null;

  const update: SlideEnhancementUpdate = { id };

  for (const key of Object.keys(raw)) {
    if (key === "id") continue;
    if (!(ALLOWED_SLIDE_FIELDS as string[]).includes(key)) continue;

    const val = raw[key];

    switch (key) {
      case "title": case "subtitle": case "body": case "phaseTag": case "summaryLine": case "closingQuote": case "narrativeThread":
        update[key] = validateStringField(val, key === "closingQuote" ? 300 : key === "narrativeThread" ? 500 : key === "body" ? 800 : 120);
        break;
      case "bullets":
        update.bullets = validateBullets(val);
        break;
      case "visualizations":
        update.visualizations = validateVisualizations(val);
        break;
      case "highlightCallouts":
        update.highlightCallouts = validateCallouts(val);
        break;
      case "cards":
        update.cards = validateCards(val);
        break;
      case "featurePills":
        update.featurePills = validateFeaturePills(val);
        break;
      case "domainTags":
        update.domainTags = validateDomainTags(val);
        break;
      case "narrativeBeats":
        update.narrativeBeats = validateDomainTags(val);
        break;
      case "layoutIntensity":
        update.layoutIntensity = typeof val === "string" && VALID_LAYOUT_INTENSITY.has(val)
          ? val as PresentationSlide["layoutIntensity"]
          : undefined;
        break;
      case "overlayComposition":
        update.overlayComposition = validateOverlayComposition(val);
        break;
      case "speakerNotes":
        update.speakerNotes = typeof val === "string" ? val.trim().slice(0, 500) : undefined;
        break;
    }
  }

  for (const key of Object.keys(update) as Array<keyof SlideEnhancementUpdate>) {
    if (key !== "id" && update[key] === undefined) delete update[key];
  }

  // Must have at least one modifiable field beyond id
  const hasChanges = Object.keys(update).length > 1;
  return hasChanges ? update : null;
}

// ─── Overlay enhancement validator ───────────────────────────────────

function validateOverlayUpdate(raw: Record<string, unknown>): OverlayEnhancementUpdate | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : null;
  if (!id) return null;

  const update: OverlayEnhancementUpdate = { id };
  if (typeof raw.title === "string") update.title = raw.title.trim().slice(0, 80);
  if (typeof raw.body === "string") update.body = raw.body.trim().slice(0, 3000);

  return update.title || update.body ? update : null;
}

// ─── Top-level normalizer ────────────────────────────────────────────

export function normalizeEnhancementOutput(
  raw: unknown,
  issues: ValidationIssue[],
): LLMEnhancementOutput | null {
  if (!isRecord(raw)) {
    issues.push({ id: "normalize-structure", severity: "error", message: "LLM response is not a JSON object." });
    return null;
  }

  const output: LLMEnhancementOutput = {};

  if (Array.isArray(raw.slides)) {
    output.slides = (raw.slides as unknown[])
      .filter(isRecord)
      .map((s) => validateSlideUpdate(s))
      .filter((s): s is SlideEnhancementUpdate => s !== null);
  }

  if (Array.isArray(raw.overlays)) {
    output.overlays = (raw.overlays as unknown[])
      .filter(isRecord)
      .map((o) => validateOverlayUpdate(o))
      .filter((o): o is OverlayEnhancementUpdate => o !== null);
  }

  if (!output.slides?.length && !output.overlays?.length) {
    issues.push({ id: "normalize-empty", severity: "warning", message: "LLM returned no valid slide or overlay updates." });
    return null;
  }

  return output;
}

// ─── Safe merge into baseline ────────────────────────────────────────

export function mergePresentationEnhancements(
  baseline: PresentationDraft,
  updates: LLMEnhancementOutput,
): PresentationDraft {
  const merged = structuredClone(baseline);

  if (updates.slides) {
    for (const update of updates.slides) {
      const idx = merged.slides.findIndex((s) => s.id === update.id);
      if (idx === -1) continue;
      const existing = merged.slides[idx]!;
      const safeUpdate = sanitizeAudienceUpdate(existing, stripIncompatibleLabelFields(existing, update));

      // Only overwrite if the new value is non-empty
      if (safeUpdate.title !== undefined) existing.title = safeUpdate.title;
      if (safeUpdate.subtitle !== undefined) existing.subtitle = safeUpdate.subtitle;
      if (safeUpdate.body !== undefined) existing.body = safeUpdate.body;
      if (safeUpdate.bullets !== undefined) existing.bullets = safeUpdate.bullets;
      if (safeUpdate.visualizations !== undefined) existing.visualizations = safeUpdate.visualizations;
      if (safeUpdate.phaseTag !== undefined) existing.phaseTag = safeUpdate.phaseTag;
      if (safeUpdate.summaryLine !== undefined) existing.summaryLine = safeUpdate.summaryLine;
      if (safeUpdate.highlightCallouts !== undefined) existing.highlightCallouts = safeUpdate.highlightCallouts;
      if (safeUpdate.cards !== undefined) existing.cards = safeUpdate.cards;
      if (safeUpdate.closingQuote !== undefined) existing.closingQuote = safeUpdate.closingQuote;
      if (safeUpdate.narrativeThread !== undefined) existing.narrativeThread = safeUpdate.narrativeThread;
      if (safeUpdate.featurePills !== undefined) existing.featurePills = safeUpdate.featurePills;
      if (safeUpdate.domainTags !== undefined) existing.domainTags = safeUpdate.domainTags;
      if (safeUpdate.narrativeBeats !== undefined) existing.narrativeBeats = safeUpdate.narrativeBeats;
      if (safeUpdate.layoutIntensity !== undefined) existing.layoutIntensity = safeUpdate.layoutIntensity;
      if (safeUpdate.overlayComposition !== undefined) existing.overlayComposition = safeUpdate.overlayComposition;
      if (safeUpdate.speakerNotes !== undefined) existing.speakerNotes = safeUpdate.speakerNotes;
    }
  }

  if (updates.overlays) {
    for (const update of updates.overlays) {
      const idx = merged.overlays.findIndex((o) => o.id === update.id);
      if (idx === -1) continue;
      if (update.title !== undefined) merged.overlays[idx]!.title = update.title;
      if (update.body !== undefined) merged.overlays[idx]!.body = update.body;
    }
  }

  merged.updatedAt = new Date().toISOString();
  return merged;
}

// ─── Rule 0 post-processing scan ─────────────────────────────────────

/**
 * Scan merged output for potential Rule 0 violations.
 * Checks for metrics/numbers in body text that don't appear in ResumeData.
 */
export function scanForFabrication(
  draft: PresentationDraft,
  data: ResumeData,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Build a set of known metrics from ResumeData
  const knownNumbers = new Set<string>();
  const knownCompanies = new Set<string>();

  knownCompanies.add(data.profile.name ?? "");

  for (const node of data.timeline ?? []) {
    if (node.company) knownCompanies.add(node.company);
    for (const h of node.highlights ?? []) {
      // Extract all number patterns
      const matches = h.match(/\d+[%万亿x倍+]*/g);
      if (matches) matches.forEach((m) => knownNumbers.add(m));
    }
    if (node.evidenceResult) {
      const matches = node.evidenceResult.match(/\d+[%万亿x倍+]*/g);
      if (matches) matches.forEach((m) => knownNumbers.add(m));
    }
  }

  // Scan each slide body for unfamiliar large numbers
  for (const slide of draft.slides) {
    const texts = [
      slide.body,
      ...(slide.bullets ?? []),
      slide.closingQuote,
      slide.narrativeThread,
      slide.summaryLine,
    ].filter((t): t is string => typeof t === "string" && t.length > 0);

    for (const text of texts) {
      const bigNumbers = text.match(/\d{2,}[%万亿x倍+s]*/g);
      if (!bigNumbers) continue;

      for (const num of bigNumbers) {
        // Skip years (2020-2029)
        if (/^20\d{2}$/.test(num)) continue;
        if (!knownNumbers.has(num) && ![...knownNumbers].some((k) => k.includes(num) || num.includes(k))) {
          issues.push({
            id: `rule0-${slide.id}-${num}`,
            slideId: slide.id,
            severity: "warning",
            message: `Metric "${num}" in slide "${slide.id}" not found in ResumeData — verify it is not fabricated.`,
          });
        }
      }
    }

    // Check company/name mentions
    for (const text of texts) {
      // Look for potential company names (2-6 Chinese chars followed by common suffixes)
      const companyPattern = /([一-龥]{2,6}(?:科技|汽车|集团|公司|银行|健康|医疗|教育|控股|技术|软件|智行|北斗|航天|航空))/g;
      let match: RegExpExecArray | null;
      while ((match = companyPattern.exec(text)) !== null) {
        const name = match[0];
        if (![...knownCompanies].some((k) => k.includes(name) || name.includes(k))) {
          issues.push({
            id: `rule0-${slide.id}-${name}`,
            slideId: slide.id,
            severity: "warning",
            message: `Company/organization "${name}" in slide "${slide.id}" not found in ResumeData — verify it is not fabricated.`,
          });
        }
      }
    }
  }

  return issues;
}
