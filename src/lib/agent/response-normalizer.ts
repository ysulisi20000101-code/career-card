import { isRecord, asString } from "@/lib/utils-helpers";
import type {
  AgentFinding,
  AgentOutputType,
  AgentPatch,
  AgentQuestion,
  AgentResponse,
  AgentSafetyNote,
  AgentSuggestion,
} from "./types";

function normalizeArray<T>(value: unknown, normalize: (item: unknown) => T | null): T[] {
  return Array.isArray(value) ? value.map(normalize).filter((item): item is T => item !== null) : [];
}

function normalizePatch(value: unknown): AgentPatch | null {
  if (!isRecord(value) || typeof value.path !== "string" || typeof value.id !== "string") return null;
  return {
    id: value.id,
    label: typeof value.label === "string" ? value.label : value.id,
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

export function normalizeAgentResponse(candidate: unknown, fallback: AgentResponse): AgentResponse {
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
    summary: typeof candidate.summary === "string" ? candidate.summary : fallback.summary,
    questions: normalizeArray(candidate.questions, normalizeQuestion),
    suggestions,
    findings: normalizeArray(candidate.findings, normalizeFinding),
    patches: patches.length > 0 ? patches : suggestionPatches,
    safety: normalizeArray(candidate.safety, normalizeSafety),
    toolTrace: [],
    createdAt: new Date().toISOString(),
  };
}
