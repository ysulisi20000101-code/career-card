import { runCareerCardAgent } from "./career-card-agent";
import type {
  AgentFinding,
  AgentInput,
  AgentOutputType,
  AgentPatch,
  AgentProviderId,
  AgentQuestion,
  AgentResponse,
  AgentSafetyNote,
  AgentSuggestion,
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
}

const MODEL_PROVIDER_LABELS: Record<Exclude<AgentProviderId, "rules">, string> = {
  mimo: "Mimo",
  deepseek: "DeepSeek",
};

const DEFAULT_TIMEOUT_MS = 20_000;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getProviderConfig(provider: Exclude<AgentProviderId, "rules">): ChatProviderConfig | null {
  if (provider === "deepseek") {
    const apiKey = env("DEEPSEEK_API_KEY");
    if (!apiKey) return null;
    return {
      apiKey,
      baseUrl: env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com",
      model: env("DEEPSEEK_MODEL") ?? "deepseek-v4-flash",
      timeoutMs: Number(env("CAREER_AGENT_TIMEOUT_MS")) || DEFAULT_TIMEOUT_MS,
    };
  }

  const apiKey = env("MIMO_API_KEY");
  const baseUrl = env("MIMO_BASE_URL");
  if (!apiKey || !baseUrl) return null;
  return {
    apiKey,
    baseUrl,
    model: env("MIMO_MODEL") ?? "mimo-v2-flash",
    timeoutMs: Number(env("CAREER_AGENT_TIMEOUT_MS")) || DEFAULT_TIMEOUT_MS,
  };
}

function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
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

function safeJson(value: unknown, max = 12_000): string {
  const text = JSON.stringify(value, null, 2);
  return text.length > max ? `${text.slice(0, max)}\n...<truncated>` : text;
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
      resumeData: input.resumeData,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeArray<T>(value: unknown, normalize: (item: unknown) => T | null): T[] {
  return Array.isArray(value) ? value.map(normalize).filter((item): item is T => item !== null) : [];
}

function normalizePatch(value: unknown): AgentPatch | null {
  if (!isRecord(value) || typeof value.path !== "string" || typeof value.id !== "string") return null;
  return {
    id: value.id,
    label: asString(value.label, value.id),
    path: value.path,
    value: value.value as AgentPatch["value"],
    previousValue: value.previousValue as AgentPatch["previousValue"],
    requiresConfirmation: true,
  };
}

function normalizeQuestion(value: unknown): AgentQuestion | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.label !== "string") return null;
  return {
    id: value.id,
    label: value.label,
    reason: asString(value.reason),
    targetPath: typeof value.targetPath === "string" ? value.targetPath : undefined,
    required: typeof value.required === "boolean" ? value.required : undefined,
  };
}

function normalizeSuggestion(value: unknown): AgentSuggestion | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") return null;
  const priority = value.priority === "high" || value.priority === "medium" || value.priority === "low" ? value.priority : "medium";
  return {
    id: value.id,
    title: value.title,
    body: asString(value.body),
    priority,
    evidence: normalizeArray(value.evidence, (item) => (typeof item === "string" ? item : null)),
    patches: normalizeArray(value.patches, normalizePatch),
  };
}

function normalizeFinding(value: unknown): AgentFinding | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") return null;
  const severity =
    value.severity === "blocker" ||
    value.severity === "warning" ||
    value.severity === "info" ||
    value.severity === "passed"
      ? value.severity
      : "info";
  return {
    id: value.id,
    severity,
    title: value.title,
    body: asString(value.body),
    targetPath: typeof value.targetPath === "string" ? value.targetPath : undefined,
  };
}

function normalizeSafety(value: unknown): AgentSafetyNote | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.message !== "string") return null;
  return { id: value.id, message: value.message };
}

function normalizeAgentResponse(candidate: unknown, fallback: AgentResponse): AgentResponse {
  if (!isRecord(candidate)) throw new Error("Agent response must be an object.");

  const type: AgentOutputType =
    candidate.type === "question" ||
    candidate.type === "suggestion" ||
    candidate.type === "review" ||
    candidate.type === "fallback"
      ? candidate.type
      : fallback.type;
  const suggestions = normalizeArray(candidate.suggestions, normalizeSuggestion);
  const patches = normalizeArray(candidate.patches, normalizePatch);
  const suggestionPatches = suggestions.flatMap((suggestion) => suggestion.patches);

  return {
    type,
    intent: fallback.intent,
    summary: asString(candidate.summary, fallback.summary),
    questions: normalizeArray(candidate.questions, normalizeQuestion),
    suggestions,
    findings: normalizeArray(candidate.findings, normalizeFinding),
    patches: patches.length > 0 ? patches : suggestionPatches,
    safety: normalizeArray(candidate.safety, normalizeSafety),
    toolTrace: [],
    createdAt: new Date().toISOString(),
  };
}

async function runOpenAICompatibleProvider(
  provider: Exclude<AgentProviderId, "rules">,
  input: AgentInput,
  fallback: AgentResponse,
): Promise<AgentResponse> {
  const config = getProviderConfig(provider);
  if (!config) return withProviderTrace(fallback, provider);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(chatCompletionsUrl(config.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content: "Return strict JSON only. Never include markdown outside the JSON object.",
          },
          { role: "user", content: buildPrompt(input, fallback) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${MODEL_PROVIDER_LABELS[provider]} request failed with HTTP ${response.status}.`);
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
    return withTrace(
      fallback,
      {
        tool: "derive_intent",
        status: "fallback",
        note: `${MODEL_PROVIDER_LABELS[provider]} failed; used rules fallback. ${error instanceof Error ? error.message : ""}`.trim(),
      },
      {
        id: `${provider}-runtime-fallback`,
        message: `${MODEL_PROVIDER_LABELS[provider]} was unavailable or returned invalid output, so this response uses the rules fallback.`,
      },
    );
  } finally {
    clearTimeout(timeout);
  }
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
