import { NextResponse } from "next/server";
import { runCareerCardAgentWithProvider } from "@/lib/agent/provider";
import type { AgentInput, AgentIntent, AgentProviderId, AgentSection } from "@/lib/agent/types";
import { sanitizeResumeData } from "@/lib/share/validation";

export const runtime = "nodejs";

function asIntent(value: unknown): AgentIntent | undefined {
  return value === "analyze_resume" ||
    value === "ask_clarifying_questions" ||
    value === "rewrite_experience_story" ||
    value === "map_to_target_role" ||
    value === "review_before_publish"
    ? value
    : undefined;
}

function asSection(value: unknown): AgentSection | undefined {
  return value === "profile" ||
    value === "timeline" ||
    value === "skills" ||
    value === "architecture" ||
    value === "role" ||
    value === "preview" ||
    value === "publish"
    ? value
    : undefined;
}

function asProvider(value: unknown): AgentProviderId | undefined {
  return value === "rules" || value === "mimo" || value === "deepseek" ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<AgentInput> | null;
  const resumeData = sanitizeResumeData(body?.resumeData);
  if (!resumeData) {
    return NextResponse.json(
      { error: "INVALID_AGENT_INPUT", detail: "缺少有效职业档案数据。" },
      { status: 400 },
    );
  }

  const response = await runCareerCardAgentWithProvider({
    resumeData,
    intent: asIntent(body?.intent),
    provider: asProvider(body?.provider),
    currentSection: asSection(body?.currentSection),
    message: asString(body?.message),
    activeTimelineId: asString(body?.activeTimelineId) ?? null,
    targetRole: asString(body?.targetRole),
    jobDescription: asString(body?.jobDescription),
  });

  return NextResponse.json({ response });
}
