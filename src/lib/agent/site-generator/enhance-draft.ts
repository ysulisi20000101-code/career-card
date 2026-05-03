import type { CareerSiteDraft } from "./types";
import type { ResumeData } from "@/types";
import { getFirstAvailableProviderConfig } from "@/lib/agent/provider";

function buildEnhancePrompt(draft: CareerSiteDraft, data: ResumeData): string {
  const personName = data.profile.name || "候选人";
  const timelineSummary = data.timeline.slice(0, 3).map((node) =>
    `${node.company} ${node.position}: ${node.description?.slice(0, 80) ?? ""}`
  ).join(" | ");

  return [
    "You are a career narrative editor for a personal career website.",
    "Given a machine-generated draft, improve the text quality to sound more natural, specific, and human.",
    "Rules:",
    "- Do NOT invent facts, metrics, dates, awards, or company details not present in the draft.",
    "- Keep targetRole, headline structure (name｜role), and coreStrengths unchanged — only improve phrasing.",
    "- hero.subtitle and positioning.oneLinePitch should feel like a real person's self-introduction, not a template.",
    "- narrative.theme and narrative.storyArc should connect the person's actual experience (see timeline below).",
    "- Max 120 chars for theme, 260 for storyArc, 160 for positioning.oneLinePitch.",
    "- Return ONLY a JSON object with optional fields: hero.subtitle, positioning.oneLinePitch, narrative.theme, narrative.storyArc.",
    "- If the current text is already good enough, return an empty object {}.",
    "",
    `Person: ${personName}`,
    `Timeline: ${timelineSummary || "无经历记录"}`,
    "",
    "Current draft:",
    JSON.stringify({
      hero: { subtitle: draft.hero.subtitle },
      positioning: { oneLinePitch: draft.positioning.oneLinePitch, targetRole: draft.positioning.targetRole },
      narrative: { theme: draft.narrative.theme, storyArc: draft.narrative.storyArc },
    }, null, 2),
  ].join("\n");
}

function mergeEnhancements(draft: CareerSiteDraft, updates: Record<string, unknown>): CareerSiteDraft {
  const next = { ...draft };

  if (typeof updates["hero.subtitle"] === "string") {
    next.hero = { ...next.hero, subtitle: updates["hero.subtitle"] as string };
  }
  if (typeof updates["positioning.oneLinePitch"] === "string") {
    const pitch = (updates["positioning.oneLinePitch"] as string).slice(0, 160);
    next.positioning = { ...next.positioning, oneLinePitch: pitch };
  }
  if (typeof updates["narrative.theme"] === "string") {
    const theme = (updates["narrative.theme"] as string).slice(0, 120);
    next.narrative = { ...next.narrative, theme };
  }
  if (typeof updates["narrative.storyArc"] === "string") {
    const arc = (updates["narrative.storyArc"] as string).slice(0, 260);
    next.narrative = { ...next.narrative, storyArc: arc };
  }

  return next;
}

export async function enhanceSiteDraft(
  draft: CareerSiteDraft,
  data: ResumeData,
): Promise<CareerSiteDraft> {
  const result = getFirstAvailableProviderConfig();
  if (!result) return draft;

  const { config, provider } = result;

  try {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: "system", content: "Return only valid JSON. No markdown, no explanation." },
        { role: "user", content: buildEnhancePrompt(draft, data) },
      ],
      temperature: 0.3,
    };
    if (config.supportsResponseFormat) {
      body.response_format = { type: "json_object" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const response = await fetch(config.chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return draft;

    const payload = await response.json();
    const content = (payload as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;
    if (!content) return draft;

    const trimmed = content.trim();
    const parsed = JSON.parse(trimmed.startsWith("{") ? trimmed : trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1));

    if (!parsed || typeof parsed !== "object" || Object.keys(parsed as object).length === 0) return draft;

    const enhanced = mergeEnhancements(draft, parsed as Record<string, unknown>);
    enhanced.versionHistory = [
      ...enhanced.versionHistory,
      {
        id: `v${enhanced.versionHistory.length + 1}`,
        summary: "LLM 优化了文案表达质量。",
        createdAt: new Date().toISOString(),
      },
    ];
    enhanced.updatedAt = new Date().toISOString();

    return enhanced;
  } catch (e) {
    console.error("enhanceSiteDraft failed:", e);
    return draft;
  }
}
