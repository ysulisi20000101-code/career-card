import { NextResponse } from "next/server";
import { applyDraftChat } from "@/lib/agent/conversation/apply-draft-chat";
import type { CareerSiteDraft } from "@/lib/agent/site-generator/types";
import { sanitizeResumeData } from "@/lib/share/validation";

export const runtime = "nodejs";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const resumeData = sanitizeResumeData(body?.resumeData);
  const message = asString(body?.message).trim();
  if (!resumeData || !message) {
    return NextResponse.json(
      { error: "INVALID_SITE_CHAT_INPUT", detail: "Missing resume data or message." },
      { status: 400 },
    );
  }

  const result = applyDraftChat({
    resumeData,
    draft: (body?.draft ?? null) as CareerSiteDraft | null,
    message,
  });

  return NextResponse.json(result);
}
