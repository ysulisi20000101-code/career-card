import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/server/auth";
import { updateCareerCard } from "@/lib/server/commercial-repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const body = (await request.json()) as { title?: string; data?: unknown; status?: "draft" | "published" | "archived" };
    const card = await updateCareerCard({
      userId: user.id,
      cardId: id,
      title: body.title,
      data: body.data as never,
      status: body.status,
    });
    return NextResponse.json({ card });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: "CAREER_CARD_UPDATE_FAILED" }, { status });
  }
}
