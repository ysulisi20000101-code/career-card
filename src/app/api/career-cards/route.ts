import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/server/auth";
import { createCareerCard, listCareerCards } from "@/lib/server/commercial-repository";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const cards = await listCareerCards(user.id);
    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as { title?: string; data?: unknown };
    const card = await createCareerCard({
      userId: user.id,
      title: body.title || "",
      data: body.data as never,
    });
    return NextResponse.json({ card });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: "CAREER_CARD_CREATE_FAILED" }, { status });
  }
}
