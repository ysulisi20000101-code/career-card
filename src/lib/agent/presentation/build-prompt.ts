import type { ResumeData } from "@/types";
import type { PresentationDraft, PresentationSlide } from "@/lib/presentation/types";
import { buildResumeDataSummary } from "@/lib/presentation/generator";

/**
 * Strip a slide down to only the fields the LLM is allowed to modify.
 * This reduces the baseline payload from ~15KB to ~3KB.
 */
function stripSlide(slide: PresentationSlide): Record<string, unknown> {
  const stripped: Record<string, unknown> = {
    id: slide.id,
    kind: slide.kind,
    moduleId: slide.moduleId,
    moduleTitle: slide.moduleTitle,
    moduleOrder: slide.moduleOrder,
  };
  const copyFields: Array<keyof PresentationSlide> = [
    "title", "subtitle", "body", "bullets", "visualizations",
    "phaseTag", "summaryLine", "highlightCallouts", "cards",
    "closingQuote", "narrativeThread", "featurePills", "domainTags",
    "narrativeBeats", "layoutIntensity", "overlayComposition",
    "speakerNotes", "overlayIds",
  ];
  for (const key of copyFields) {
    const val = slide[key as keyof PresentationSlide];
    if (val !== undefined) stripped[key] = val as unknown;
  }
  return stripped;
}

/**
 * Build the LLM prompt for presentation enhancement.
 *
 * Three-tier compression:
 * 1. System rules (~3KB) — 66 rules condensed to 10 critical constraints
 * 2. ResumeData summary (~2-4KB) — flattened text from buildResumeDataSummary()
 * 3. Baseline fields (~3KB) — stripped slides with only modifiable fields
 */
export function buildPresentationEnhancePrompt(
  baseline: PresentationDraft,
  data: ResumeData,
  instruction?: string,
): string {
  const resumeSummary = buildResumeDataSummary(data);
  const strippedSlides = baseline.slides.map(stripSlide);
  const narrativeProfile = baseline.narrativeProfile;
  const storyBlueprint = baseline.storyBlueprint;
  const strippedOverlays = baseline.overlays.map((o) => ({
    id: o.id,
    title: o.title,
    kind: o.kind,
    body: o.body,
  }));

  const systemRules = [
    "You are a career narrative editor for a modular interview-space presentation.",
    "Given a deterministic baseline generated from resume data, improve text quality,",
    "narrative structure, strategic framing, and visualization data.",
    "The baseline may already contain a structured narrativeProfile and",
    "storyBlueprint. Treat them as the controlled source of layout/diagram intent.",
    "",
    "=== CRITICAL RULES (violation = invalid output) ===",
    "",
    "R0: NO FABRICATION. Every claim, company, date, metric, project name MUST be",
    "    traceable to the ResumeData summary below. Never invent numbers, awards,",
    "    headcounts, client names, or technical terms not in the data.",
    "    Do NOT inflate metrics (e.g. '效率提升 20%' → '50%+' is FORBIDDEN).",
    "    If the data says '参与', do not change it to '主导'.",
    "",
    "R1: The existing slide list is fixed. The deck is a self-story presentation,",
    "    usually 8-12 slides. Do NOT add/remove/reorder slides.",
    "    Do NOT rename ids, change moduleId, or collapse the story. Improve only",
    "    the text/structured visual fields of slides that already exist.",
    "",
    "R2: Quantified metrics are valuable only when present in the source data.",
    "    Never invent numbers. Prioritize evidence mapping, risk boundaries,",
    "    and interview-ready spoken language.",
    "",
    "R3: Tension and resolution SHOULD visually echo each other.",
    "    If both use v-model diagrams, keep the same node sets and only change",
    "    status/variant data.",
    "",
    "R4: If an agent_leap slide exists, it is a core page with high info density.",
    "    Open with a COUNTERINTUITIVE statement:",
    '    "晋升后我做的第一件事不是{最酷的部分}——是先把{前提}做完整。"',
    "    Then explain WHY this order matters (card-accent explaining strategic logic).",
    "",
    "R5: ALL body text in first-person '我' perspective. No third-person, no",
    "    passive-voice hiding of agency. Body should sound like spoken interview answers.",
    "",
    "R6: Preserve the renderer contract for each slide kind. You may improve cards,",
    "    callouts, bullets, and speakerNotes, but do not require every slide to share",
    "    the same visual pattern.",
    "",
    "R7: If a foundation slide exists, it compresses early-career/internship experiences into",
    "    ONE page. Frame them as '基础训练' not '工作经历'. Each internship ends with",
    "    a meta-skill takeaway ('学会了：{可迁移的元能力}'), not domain knowledge.",
    "    Maximum 3 internship cards. Closing card-accent declares these are",
    "    TRANSFERABLE methodology, not domain expertise.",
    "",
    "R8: Colors carry FIXED semantics — do NOT change color assignments:",
    "    gold (#a07018) = emphasis / key metrics / brand",
    "    violet (#6b5ea0) = AI / Agent / strategy / strategic insight",
    "    teal (#1a7d62) = domestic success / verified / platform",
    "    rose (#b85d6a) = before-state / problems / warnings",
    "    blue (#3d7fb8) = data / information / communication",
    "    cyan (#318a94) = simulation / verification",
    "    green (#4a8a5a) = DevOps / delivery / engineering",
    "",
    "R9: If resolution and tension slides both exist, resolution should form a",
    "    callback to the earlier tension without inventing a new storyline.",
    "    Keep Before/After comparisons grounded in the source data.",
    "    Final sentence is a personal brand statement:",
    '    "我是{姓名}。从{起点}做到{终点}——我做的事一直在变，但逻辑始终一致：{核心信念}。"',
    "",
    "=== OUTPUT FORMAT ===",
    "",
    "Return ONE JSON object. Only include fields you are changing.",
    "Omit fields that are already good. The output shape:",
    '{ "slides": [{ "id": "hero", ...fields }], "overlays": [{ "id": "...", ...fields }] }',
    "Allowed slide fields are text fields plus: visualizations, narrativeBeats,",
    "layoutIntensity, overlayComposition, cards, highlightCallouts, featurePills,",
    "domainTags. Never output raw HTML, raw SVG, JavaScript, CSS, or React code.",
    "",
    "For visualizations, generate structured JSON data (NOT raw SVG strings):",
    "v-model: { type:'v-model', data:{ variant, designNodes:[{name,tool,domestic}],",
    "  testNodes:[{name,tool,color}], platformName, platformSubtitle, caption }}",
    "hero-architecture: { type:'hero-architecture', data:{ agents, ragLabel,",
    "  ragSubtitle, ragBlocks, toolchainLabel, toolchainSubtitle, toolchainBlocks }}",
    "agent-workflow: { type:'agent-workflow', data:{ agents, workflowLabel,",
    "  workflowSteps, ragBlocks, ragFooter, strategyInsight, conflictTypes }}",
    "pipeline: { type:'pipeline', data:{ stages:[{name,subtitle,bullets,agentNote,color}],",
    "  agentLayerLabel, ragLabel }}",
  ].join("\n");

  return [
    systemRules,
    "",
    "=== RESUME DATA ===",
    resumeSummary || "(no resume data available)",
    "",
    "=== BASELINE DRAFT (only modifiable fields shown) ===",
    `targetRole: ${baseline.targetRole}`,
    `template: ${baseline.template}`,
    `themeId: ${baseline.themeId}`,
    "narrativeProfile:",
    JSON.stringify(narrativeProfile ?? null, null, 2),
    "storyBlueprint:",
    JSON.stringify(storyBlueprint
      ? {
          presetId: storyBlueprint.presetId,
          slideArc: storyBlueprint.slideArc,
          diagrams: Object.fromEntries(Object.entries(storyBlueprint.diagrams).map(([key, value]) => [key, value.type])),
        }
      : null, null, 2),
    "slides:",
    JSON.stringify(strippedSlides, null, 2),
    "overlays:",
    JSON.stringify(strippedOverlays, null, 2),
    instruction?.trim()
      ? [
          "",
          "=== USER REVISION INSTRUCTION ===",
          instruction.trim().slice(0, 500),
          "Apply this instruction only when it is grounded in ResumeData or the existing draft. If it asks for a role-specific version, prioritize interview-ready spoken pages.",
        ].join("\n")
      : "",
    "",
    "Return ONLY the JSON object. No markdown, no explanation.",
  ].join("\n");
}
