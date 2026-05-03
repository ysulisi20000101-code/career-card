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
  "domainTags", "speakerNotes",
];

const VALID_CARD_VARIANTS = new Set(["gold", "teal", "violet", "blue", "rose", "green", "cyan"]);
const VALID_VIZ_TYPES = new Set(["v-model", "pipeline", "orbit", "custom"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ─── Field-level validators ──────────────────────────────────────────

function validateStringField(val: unknown, maxLen: number): string | undefined {
  if (val === undefined) return undefined;
  if (typeof val !== "string") return undefined;
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
    result.push({ type: type as PresentationSlide["visualizations"] extends Array<infer T> ? T extends { type: infer U } ? U : never : never, data: item.data as Record<string, unknown> ?? {} });
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
      case "speakerNotes":
        update.speakerNotes = typeof val === "string" ? val.trim().slice(0, 500) : undefined;
        break;
    }
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

      // Only overwrite if the new value is non-empty
      if (update.title !== undefined) existing.title = update.title;
      if (update.subtitle !== undefined) existing.subtitle = update.subtitle;
      if (update.body !== undefined) existing.body = update.body;
      if (update.bullets !== undefined) existing.bullets = update.bullets;
      if (update.visualizations !== undefined) existing.visualizations = update.visualizations;
      if (update.phaseTag !== undefined) existing.phaseTag = update.phaseTag;
      if (update.summaryLine !== undefined) existing.summaryLine = update.summaryLine;
      if (update.highlightCallouts !== undefined) existing.highlightCallouts = update.highlightCallouts;
      if (update.cards !== undefined) existing.cards = update.cards;
      if (update.closingQuote !== undefined) existing.closingQuote = update.closingQuote;
      if (update.narrativeThread !== undefined) existing.narrativeThread = update.narrativeThread;
      if (update.featurePills !== undefined) existing.featurePills = update.featurePills;
      if (update.domainTags !== undefined) existing.domainTags = update.domainTags;
      if (update.speakerNotes !== undefined) existing.speakerNotes = update.speakerNotes;
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
