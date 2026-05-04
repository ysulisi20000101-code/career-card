import { NextResponse } from "next/server";
import { sanitizeResumeData } from "@/lib/share/validation";
import { checkApiKey } from "@/lib/server/auth";
import { enhancePresentationDraft } from "@/lib/agent/presentation/enhance-presentation";
import type { ResumeData } from "@/types";
import type { PresentationDraft } from "@/lib/presentation/types";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 80_000;
const MAX_TIMELINE_NODES = 25;

function isPresentationDraft(v: unknown): v is PresentationDraft {
  if (!v || typeof v !== "object") return false;
  const d = v as Record<string, unknown>;
  return (
    d.schemaVersion === 1 &&
    typeof d.id === "string" &&
    Array.isArray(d.slides) &&
    d.slides.length >= 6 &&
    d.slides.length <= 12
  );
}

export async function POST(request: Request) {
  const authFailure = checkApiKey(request);
  if (authFailure) return authFailure;

  try {
    // Size check
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "PAYLOAD_TOO_LARGE", detail: `Body must not exceed ${MAX_BODY_SIZE} bytes.` },
        { status: 413 },
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    // Validate and sanitize resume data
    const resumeData = sanitizeResumeData(body.resumeData) as ResumeData;
    if (!resumeData || !resumeData.profile) {
      return NextResponse.json(
        { error: "INVALID_RESUME_DATA", detail: "Missing or invalid resumeData." },
        { status: 400 },
      );
    }

    // Cap timeline nodes to prevent token blowup
    if (resumeData.timeline && resumeData.timeline.length > MAX_TIMELINE_NODES) {
      resumeData.timeline = resumeData.timeline.slice(0, MAX_TIMELINE_NODES);
    }

    // Validate baseline
    const baseline = body.baseline;
    if (!isPresentationDraft(baseline)) {
      return NextResponse.json(
        { error: "INVALID_BASELINE", detail: "Missing or invalid baseline PresentationDraft." },
        { status: 400 },
      );
    }

    const result = await enhancePresentationDraft(baseline, resumeData);

    return NextResponse.json({
      draft: result.draft,
      issues: result.issues,
      trace: result.trace,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ENHANCEMENT_FAILED";
    console.error("[interview-presentation] Enhancement failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
