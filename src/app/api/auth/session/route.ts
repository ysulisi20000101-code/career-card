import { NextResponse } from "next/server";
import { getSessionUser, signIn, signOut } from "@/lib/server/auth";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { identity?: string };
    const user = await signIn(body.identity ?? "");
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "请输入有效的邮箱或手机号" }, { status: 400 });
  }
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ ok: true });
}
