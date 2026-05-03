import { runCareerCardAgent } from "./career-card-agent";
import type {
  AgentInput,
  AgentProviderId,
  AgentResponse,
  AgentSafetyNote,
  AgentToolTrace,
} from "./types";

export interface CareerAgentProvider {
  id: AgentProviderId;
  label: string;
  run(input: AgentInput): Promise<AgentResponse>;
}

interface ChatProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  chatUrl: string;
  supportsResponseFormat: boolean;
}

const MODEL_PROVIDER_LABELS: Record<Exclude<AgentProviderId, "rules">, string> = {
  mimo: "Mimo",
  deepseek: "DeepSeek",
  minimax: "MiniMax",
};

const DEFAULT_TIMEOUT_MS = 20_000;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getProviderConfig(provider: Exclude<AgentProviderId, "rules">): ChatProviderConfig | null {
  if (provider === "deepseek") {
    const apiKey = env("DEEPSEEK_API_KEY");
    if (!apiKey) return null;
    const baseUrl = env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com";
    return {
      apiKey,
      baseUrl,
      model: env("DEEPSEEK_MODEL") ?? "deepseek-v4-flash",
      timeoutMs: Number(env("CAREER_AGENT_TIMEOUT_MS")) || DEFAULT_TIMEOUT_MS,
      chatUrl: `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
      supportsResponseFormat: true,
    };
  }

  if (provider === "mimo") {
    const apiKey = env("MIMO_API_KEY");
    if (!apiKey) return null;
    const baseUrl = env("MIMO_BASE_URL") ?? "https://api.xiaomimimo.com/v1";
    return {
      apiKey,
      baseUrl,
      model: env("MIMO_MODEL") ?? "mimo-v2-flash",
      timeoutMs: Number(env("CAREER_AGENT_TIMEOUT_MS")) || DEFAULT_TIMEOUT_MS,
      chatUrl: `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
      supportsResponseFormat: true,
    };
  }

  if (provider === "minimax") {
    const apiKey = env("MINIMAX_API_KEY");
    if (!apiKey) return null;
    const baseUrl = env("MINIMAX_BASE_URL") ?? "https://api.minimax.chat/v1";
    return {
      apiKey,
      baseUrl,
      model: env("MINIMAX_MODEL") ?? "MiniMax-M2.7",
      timeoutMs: Number(env("CAREER_AGENT_TIMEOUT_MS")) || DEFAULT_TIMEOUT_MS,
      chatUrl: `${baseUrl.replace(/\/+$/, "")}/text/chatcompletion_v2`,
      supportsResponseFormat: false,
    };
  }

  return null;
}

export function getFirstAvailableProviderConfig(): { config: ChatProviderConfig; provider: string } | null {
  const providers: Array<Exclude<AgentProviderId, "rules">> = ["deepseek", "mimo", "minimax"];
  for (const provider of providers) {
    const config = getProviderConfig(provider);
    if (config) return { config, provider };
  }
  return null;
}

function withTrace(response: AgentResponse, trace: AgentToolTrace, safety?: AgentSafetyNote): AgentResponse {
  return {
    ...response,
    safety: safety ? [...response.safety, safety] : response.safety,
    toolTrace: [trace, ...response.toolTrace],
  };
}

function withProviderTrace(response: AgentResponse, provider: AgentProviderId): AgentResponse {
  if (provider === "rules") {
    return withTrace(response, {
      tool: "derive_intent",
      status: "used",
      note: "Used the deterministic rules provider.",
    });
  }

  return withTrace(
    response,
    {
      tool: "derive_intent",
      status: "fallback",
      note: `${MODEL_PROVIDER_LABELS[provider]} is not configured; used the deterministic rules provider.`,
    },
    {
      id: `${provider}-fallback`,
      message: `${MODEL_PROVIDER_LABELS[provider]} is not configured yet, so this response uses the rules fallback.`,
    },
  );
}

const MAX_RESUMEDATA_CHARS = 8_000;

function truncateResumeData(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const text = JSON.stringify(data);
  if (text.length <= MAX_RESUMEDATA_CHARS) return data;

  // Deep-clone with truncation: reduce highlights to 3 items, descriptions to 100 chars
  const clone = JSON.parse(text) as Record<string, unknown>;
  if (Array.isArray(clone.timeline)) {
    clone.timeline = (clone.timeline as Record<string, unknown>[]).map((node) => ({
      ...node,
      highlights: Array.isArray(node.highlights) ? (node.highlights as string[]).slice(0, 3) : [],
      description: typeof node.description === "string" ? (node.description as string).slice(0, 100) : node.description,
    }));
  }
  return clone;
}

const RETRY_DELAYS_MS = [1_000, 2_000];
const MAX_RETRIES = 2;

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("fetch")) return true;
  if (error instanceof DOMException && error.name === "AbortError") return false;
  if (error instanceof Error && /HTTP 5\d{2}/.test(error.message)) return true;
  return false;
}

function safeJson(value: unknown, max = 12_000): string {
  const text = JSON.stringify(value, null, 2);
  if (text.length <= max) return text;

  // Find the last structural boundary (closing } or ]) before the limit
  // that is not inside a string literal
  let lastBoundary = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < max; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString && (ch === "}" || ch === "]")) {
      lastBoundary = i;
    }
  }

  if (lastBoundary > 0) {
    return `${text.slice(0, lastBoundary + 1)}\n...<truncated>`;
  }
  // Fallback: truncate at limit (shouldn't happen with valid JSON)
  return `${text.slice(0, max)}\n...<truncated>`;
}

function buildPrompt(input: AgentInput, fallback: AgentResponse): string {
  return [
    "You are the Career Card agent. Return one JSON object only.",
    "Your response must match the provided AgentResponse shape.",
    "Do not invent facts, metrics, employers, awards, dates, or outcomes.",
    "Every patch must set requiresConfirmation to true.",
    "Use only paths that the product can safely apply: profile.*, roleUnderstanding, roleUnderstanding.*, or timeline[id=<id>].*.",
    "",
    "Agent input:",
    safeJson({
      intent: input.intent,
      currentSection: input.currentSection,
      activeTimelineId: input.activeTimelineId,
      targetRole: input.targetRole,
      jobDescription: input.jobDescription,
      message: input.message,
      resumeData: truncateResumeData(input.resumeData),
    }),
    "",
    "Deterministic baseline you may improve, but you may also return it if it is already sufficient:",
    safeJson(fallback),
  ].join("\n");
}

function extractTextContent(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const choices = (response as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const first = choices[0] as { message?: { content?: unknown } } | undefined;
  const content = first?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string") {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("");
  }
  return null;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return JSON.parse(fenced[1].trim());
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error("Model response did not contain a JSON object.");
}

import { normalizeAgentResponse } from "./response-normalizer";

async function runOpenAICompatibleProvider(
  provider: Exclude<AgentProviderId, "rules">,
  input: AgentInput,
  fallback: AgentResponse,
): Promise<AgentResponse> {
  const config = getProviderConfig(provider);
  if (!config) return withProviderTrace(fallback, provider);

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      {
        role: "system",
        content: "Return strict JSON only. Never include markdown outside the JSON object.",
      },
      { role: "user", content: buildPrompt(input, fallback) },
    ],
    temperature: 0.2,
  };
  if (config.supportsResponseFormat) {
    body.response_format = { type: "json_object" };
  }
  const requestBody = JSON.stringify(body);

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(config.chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: requestBody,
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = new Error(`${MODEL_PROVIDER_LABELS[provider]} request failed with HTTP ${response.status}.`);
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          lastError = err;
          continue;
        }
        throw err;
      }

      const payload = await response.json();
      const content = extractTextContent(payload);
      if (!content) throw new Error(`${MODEL_PROVIDER_LABELS[provider]} returned no message content.`);

      const normalized = normalizeAgentResponse(parseJsonObject(content), fallback);
      return withTrace(
        normalized,
        {
          tool: "derive_intent",
          status: "used",
          note: `${MODEL_PROVIDER_LABELS[provider]} generated a schema-checked response.`,
        },
        {
          id: `${provider}-schema-checked`,
          message: `${MODEL_PROVIDER_LABELS[provider]} output was normalized and all patches still require manual confirmation.`,
        },
      );
    } catch (error) {
      lastError = error;
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        continue;
      }
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  return withTrace(
    fallback,
    {
      tool: "derive_intent",
      status: "fallback",
      note: `${MODEL_PROVIDER_LABELS[provider]} failed; used rules fallback. ${lastError instanceof Error ? lastError.message : ""}`.trim(),
    },
    {
      id: `${provider}-runtime-fallback`,
      message: `${MODEL_PROVIDER_LABELS[provider]} was unavailable or returned invalid output, so this response uses the rules fallback.`,
    },
  );
}

export function createCareerAgentProvider(provider: AgentProviderId = "rules"): CareerAgentProvider {
  return {
    id: provider,
    label: provider === "rules" ? "Rules" : MODEL_PROVIDER_LABELS[provider],
    async run(input) {
      const fallback = runCareerCardAgent(input);
      if (provider === "rules") return withProviderTrace(fallback, provider);
      return runOpenAICompatibleProvider(provider, input, fallback);
    },
  };
}

export async function runCareerCardAgentWithProvider(input: AgentInput): Promise<AgentResponse> {
  const provider = createCareerAgentProvider(input.provider ?? "rules");
  return provider.run(input);
}
