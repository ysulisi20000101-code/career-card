import type { ResumeData } from "@/types";
import type { PresentationDraft, PresentationSlide } from "@/lib/presentation/types";
import { buildResumeDataSummary } from "@/lib/presentation/generator";

/**
 * Strip a slide down to only the fields the LLM is allowed to modify.
 * This reduces the baseline payload from ~15KB to ~3KB.
 */
function stripSlide(slide: PresentationSlide): Record<string, unknown> {
  const stripped: Record<string, unknown> = { id: slide.id, kind: slide.kind };
  const copyFields: Array<keyof PresentationSlide> = [
    "title", "subtitle", "body", "bullets", "visualizations",
    "phaseTag", "summaryLine", "highlightCallouts", "cards",
    "closingQuote", "narrativeThread", "featurePills", "domainTags",
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
): string {
  const resumeSummary = buildResumeDataSummary(data);
  const strippedSlides = baseline.slides.map(stripSlide);
  const strippedOverlays = baseline.overlays.map((o) => ({
    id: o.id,
    title: o.title,
    kind: o.kind,
    body: o.body,
  }));

  const systemRules = [
    "You are a career narrative editor for an 8-slide interview presentation.",
    "Given a deterministic baseline generated from resume data, improve text quality,",
    "narrative structure, strategic framing, and visualization data.",
    "",
    "=== CRITICAL RULES (violation = invalid output) ===",
    "",
    "R0: NO FABRICATION. Every claim, company, date, metric, project name MUST be",
    "    traceable to the ResumeData summary below. Never invent numbers, awards,",
    "    headcounts, client names, or technical terms not in the data.",
    "    Do NOT inflate metrics (e.g. '效率提升 20%' → '50%+' is FORBIDDEN).",
    "    If the data says '参与', do not change it to '主导'.",
    "",
    "R1: 8 slides fixed arc. Kinds: hero, foundation, tension, platform_build,",
    "    agent_leap, lifecycle, impact, resolution. Do NOT add/remove slides.",
    "",
    "R2: Every slide needs a phaseTag (time anchor like '2020.12—2021.03') and",
    "    at least 2 quantified metrics in body/bullets. Dates MUST be yyyy.mm format.",
    "    Never use ranges ('50%-60%'); use '50%+' format.",
    "",
    "R3: Slide 3 (tension) & Slide 8 (resolution) MUST reference the same v-model",
    "    diagram structure but with DIFFERENT variant data.",
    "    Slide 3 variant='monopoly' — shows industry before your intervention.",
    "    Slide 8 variant='complete' — shows industry after your intervention.",
    "    designNodes/testNodes MUST be the same set of items, only statuses change.",
    "",
    "R4: Slide 5 (agent_leap) is the ★CORE★ page with highest info density.",
    "    Open with a COUNTERINTUITIVE statement:",
    '    "晋升后我做的第一件事不是{最酷的部分}——是先把{前提}做完整。"',
    "    Then explain WHY this order matters (card-accent explaining strategic logic).",
    "",
    "R5: ALL body text in first-person '我' perspective. No third-person, no",
    "    passive-voice hiding of agency. Body should sound like spoken interview answers.",
    "",
    "R6: Every slide MUST end with a card-accent (emphasis box) as closing insight.",
    "    The card-accent answers: 'what did this phase teach me / what did it prove?'",
    "",
    "R7: Slide 2 (foundation) compresses ALL early-career/internship experiences into",
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
    "R9: Slide 8 MUST form a visual callback to Slide 3 — reuse the same diagram",
    "    structure (same node positions, same layers) but update all statuses.",
    "    Include Before/After comparison cards below the diagram.",
    "    Final sentence is a personal brand statement:",
    '    "我是{姓名}。从{起点}做到{终点}——我做的事一直在变，但逻辑始终一致：{核心信念}。"',
    "",
    "=== OUTPUT FORMAT ===",
    "",
    "Return ONE JSON object. Only include fields you are changing.",
    "Omit fields that are already good. The output shape:",
    '{ "slides": [{ "id": "hero", ...fields }], "overlays": [{ "id": "...", ...fields }] }',
    "",
    "For visualizations, generate structured JSON data (NOT raw SVG strings):",
    "v-model: { type:'v-model', data:{ variant, designNodes:[{name,tool,domestic}],",
    "  testNodes:[{name,tool,color}], platformName, platformSubtitle, caption }}",
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
    "slides:",
    JSON.stringify(strippedSlides, null, 2),
    "overlays:",
    JSON.stringify(strippedOverlays, null, 2),
    "",
    "Return ONLY the JSON object. No markdown, no explanation.",
  ].join("\n");
}
