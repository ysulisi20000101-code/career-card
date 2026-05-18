import { NextResponse } from "next/server";
import { applyDraftChatWithLLM } from "@/lib/agent/conversation/apply-draft-chat";
import type { CareerSiteDraft } from "@/lib/agent/site-generator/types";
import { sanitizeResumeData } from "@/lib/share/validation";
import { checkApiKey } from "@/lib/server/auth";
import { asString } from "@/lib/utils-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authFailure = checkApiKey(request);
  if (authFailure) return authFailure;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const resumeData = sanitizeResumeData(body?.resumeData);
  const message = asString(body?.message).trim();
  const history: Array<{ role: "user" | "agent"; content: string }> = Array.isArray(body?.history)
    ? (body.history as unknown[]).filter(
        (item): item is { role: "user" | "agent"; content: string } =>
          typeof item === "object" &&
          item !== null &&
          ((item as Record<string, unknown>).role === "user" ||
            (item as Record<string, unknown>).role === "agent") &&
          typeof (item as Record<string, unknown>).content === "string",
      ).slice(-6)
    : [];

  if (message.length > 2000) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 400 });
  }

  const resumeStr = JSON.stringify(body?.resumeData ?? "");
  if (resumeStr.length > 50_000) {
    return NextResponse.json({ error: "RESUME_DATA_TOO_LARGE" }, { status: 400 });
  }

  if (!resumeData || !message) {
    return NextResponse.json(
      { error: "INVALID_SITE_CHAT_INPUT", detail: "Missing resume data or message." },
      { status: 400 },
    );
  }

  const result = await applyDraftChatWithLLM({
    resumeData,
    draft: (body?.draft ?? null) as CareerSiteDraft | null,
    message,
    history: history.length > 0 ? history : undefined,
  });

  return NextResponse.json(result);
}
