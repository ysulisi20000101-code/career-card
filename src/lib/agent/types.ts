import type { ResumeData } from "@/types";

export type AgentIntent =
  | "analyze_resume"
  | "ask_clarifying_questions"
  | "rewrite_experience_story"
  | "map_to_target_role"
  | "review_before_publish";

export type AgentSection =
  | "profile"
  | "timeline"
  | "skills"
  | "architecture"
  | "role"
  | "preview"
  | "publish";

export type AgentOutputType = "question" | "suggestion" | "review" | "fallback";
export type AgentPriority = "high" | "medium" | "low";
export type AgentFindingSeverity = "blocker" | "warning" | "info" | "passed";
export type AgentPatchValue = string | number | boolean | null | Record<string, unknown> | unknown[];
export type AgentProviderId = "rules" | "mimo" | "deepseek" | "minimax";

export interface AgentInput {
  resumeData: ResumeData;
  intent?: AgentIntent;
  provider?: AgentProviderId;
  message?: string;
  currentSection?: AgentSection;
  activeTimelineId?: string | null;
  targetRole?: string;
  jobDescription?: string;
}

export interface AgentQuestion {
  id: string;
  label: string;
  reason: string;
  targetPath?: string;
  required?: boolean;
}

export interface AgentPatch {
  id: string;
  label: string;
  path: string;
  value: AgentPatchValue;
  previousValue?: AgentPatchValue;
  requiresConfirmation: boolean;
}

export interface AgentSuggestion {
  id: string;
  title: string;
  body: string;
  priority: AgentPriority;
  evidence: string[];
  patches: AgentPatch[];
}

export interface AgentFinding {
  id: string;
  severity: AgentFindingSeverity;
  title: string;
  body: string;
  targetPath?: string;
}

export interface AgentSafetyNote {
  id: string;
  message: string;
}

export interface AgentToolTrace {
  tool: AgentIntent | "derive_intent";
  status: "used" | "skipped" | "fallback";
  note: string;
}

export interface AgentResponse {
  type: AgentOutputType;
  intent: AgentIntent;
  summary: string;
  questions: AgentQuestion[];
  suggestions: AgentSuggestion[];
  findings: AgentFinding[];
  patches: AgentPatch[];
  safety: AgentSafetyNote[];
  toolTrace: AgentToolTrace[];
  createdAt: string;
}
