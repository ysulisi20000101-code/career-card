import { NextResponse } from "next/server";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import { validateCareerSiteDraft } from "@/lib/agent/site-generator/validate-site-draft";
import { enhanceSiteDraft } from "@/lib/agent/site-generator/enhance-draft";
import type { AgentProviderId } from "@/lib/agent/types";
import { sanitizeResumeData } from "@/lib/share/validation";
import { checkApiKey } from "@/lib/server/auth";

export const runtime = "nodejs";

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asProvider(value: unknown): AgentProviderId | undefined {
  return value === "rules" || value === "mimo" || value === "deepseek" || value === "minimax" ? value : undefined;
}

export async function POST(request: Request) {
  const authFailure = checkApiKey(request);
  if (authFailure) return authFailure;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const rawJson = JSON.stringify(body?.resumeData ?? {});
  if (rawJson.length > 50000) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 400 });
  }

  const resumeData = sanitizeResumeData(body?.resumeData);
  if (!resumeData) {
    return NextResponse.json(
      { error: "INVALID_SITE_DRAFT_INPUT", detail: "Missing valid resume data." },
      { status: 400 },
    );
  }

  const baseline = generateCareerSiteDraft(resumeData, {
    provider: asProvider(body?.provider),
    instruction: asOptionalString(body?.instruction),
    targetRoleOverride: asOptionalString(body?.targetRole),
  });
  const draft = await enhanceSiteDraft(baseline, resumeData);

  return NextResponse.json({
    draft,
    issues: validateCareerSiteDraft(draft),
  });
}
