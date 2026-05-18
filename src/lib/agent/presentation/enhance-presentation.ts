import type { ResumeData } from "@/types";
import type { PresentationDraft } from "@/lib/presentation/types";
import { applyInterviewStoryBlueprint } from "@/lib/presentation/interview-story";
import { getFirstAvailableProviderConfig } from "@/lib/agent/provider";
import { buildPresentationEnhancePrompt } from "./build-prompt";
import { normalizeEnhancementOutput, mergePresentationEnhancements, scanForFabrication } from "./normalize-presentation";
import type { PresentationEnhancementResult, ValidationIssue } from "./types";

const PRESENTATION_TIMEOUT_MS = 40_000; // longer timeout for full modular presentation enhancement
const RETRY_DELAYS_MS = [1_000, 2_000];
const MAX_RETRIES = 2;

function parseJsonContent(content: string): unknown | null {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try extracting between first { and last }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || start >= end) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/**
 * Enhance a presentation draft using the best available LLM provider.
 *
 * Flow:
 * 1. Try each provider in priority order (deepseek → mimo → minimax)
 * 2. On success: normalize response, merge into baseline, scan for fabrication
 * 3. On all providers exhausted: return baseline with fallback trace
 *
 * @returns Enhanced draft with trace info and any validation issues.
 */
export async function enhancePresentationDraft(
  baseline: PresentationDraft,
  data: ResumeData,
  instruction?: string,
): Promise<PresentationEnhancementResult> {
  const issues: ValidationIssue[] = [];
  const groundedBaseline = applyInterviewStoryBlueprint(baseline, data);

  const providerResult = getFirstAvailableProviderConfig();
  if (!providerResult) {
    return {
      draft: groundedBaseline,
      issues,
      trace: { provider: "none", status: "fallback", note: "No LLM provider configured; used deterministic story blueprint." },
    };
  }

  const { config, provider } = providerResult;

  // Fallback chain: we only use the first available provider from the priority list.
  // If it fails after retries, we return baseline — the provider chain is exhausted.
  // (Full multi-provider failover requires per-provider configs which adds complexity.)

  const promptContent = buildPresentationEnhancePrompt(groundedBaseline, data, instruction);

  // Try the primary provider with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const body: Record<string, unknown> = {
        model: config.model,
        messages: [
          { role: "system", content: "Return only valid JSON. No markdown, no explanation. The output must be a single JSON object." },
          { role: "user", content: promptContent },
        ],
        temperature: 0.3,
      };
      if (config.supportsResponseFormat) {
        body.response_format = { type: "json_object" };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PRESENTATION_TIMEOUT_MS);

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

      if (!response.ok) {
        if (attempt < MAX_RETRIES && response.status >= 500) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const content = (payload as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in LLM response");

      const parsed = parseJsonContent(content);
      if (!parsed) throw new Error("Failed to parse LLM JSON response");

      const normalized = normalizeEnhancementOutput(parsed, issues);
      if (!normalized) {
        // LLM returned valid JSON but no usable updates — return baseline
        return {
          draft: groundedBaseline,
          issues,
          trace: { provider, status: "fallback", note: "LLM returned no valid slide updates." },
        };
      }

      const merged = mergePresentationEnhancements(groundedBaseline, normalized);

      // Rule 0 scan
      const rule0Issues = scanForFabrication(merged, data);
      issues.push(...rule0Issues);

      return {
        draft: merged,
        issues,
        trace: { provider, status: "used", note: `Enhanced with ${provider}.` },
      };
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        continue;
      }
      console.error("enhancePresentationDraft failed:", e);
    }
  }

  // All retries exhausted
  return {
    draft: groundedBaseline,
    issues,
    trace: { provider, status: "exhausted", note: "All retry attempts failed; used deterministic story blueprint." },
  };
}
