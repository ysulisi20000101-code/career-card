import { NextResponse } from "next/server";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import { validateCareerSiteDraft } from "@/lib/agent/site-generator/validate-site-draft";
import type { AgentProviderId } from "@/lib/agent/types";
import { sanitizeResumeData } from "@/lib/share/validation";

export const runtime = "nodejs";

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asProvider(value: unknown): AgentProviderId | undefined {
  return value === "rules" || value === "mimo" || value === "deepseek" ? value : undefined;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const resumeData = sanitizeResumeData(body?.resumeData);
  if (!resumeData) {
    return NextResponse.json(
      { error: "INVALID_SITE_DRAFT_INPUT", detail: "Missing valid resume data." },
      { status: 400 },
    );
  }

  const draft = generateCareerSiteDraft(resumeData, {
    provider: asProvider(body?.provider),
    instruction: asString(body?.instruction),
  });

  return NextResponse.json({ draft, issues: validateCareerSiteDraft(draft) });
}
