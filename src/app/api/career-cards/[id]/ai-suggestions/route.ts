import { NextResponse } from "next/server";
import { getSubscription, requireSessionUser } from "@/lib/server/auth";
import { createAiSuggestion } from "@/lib/server/commercial-repository";
import { canUseDeepAi } from "@/lib/commercial/plans";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser();
    const subscription = await getSubscription(user.id);
    if (!canUseDeepAi(subscription)) {
      return NextResponse.json({ error: "AI_CREDIT_EXHAUSTED" }, { status: 402 });
    }
    const { id } = await context.params;
    const body = (await request.json()) as {
      type?: "story" | "highlight_support" | "skill_profile" | "promotion_stage";
      sourceVersion?: number;
      payload?: unknown;
    };
    const suggestion = await createAiSuggestion({
      userId: user.id,
      cardId: id,
      type: body.type ?? "story",
      sourceVersion: Number(body.sourceVersion ?? 1),
      payload: body.payload ?? {},
    });
    return NextResponse.json({ suggestion });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: "AI_SUGGESTION_CREATE_FAILED" }, { status });
  }
}
