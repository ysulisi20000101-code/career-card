import { NextResponse } from "next/server";
import { requireSessionUser, upgradeSubscription } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = (await request.json()) as { plan?: "pro" | "advanced" };
    const plan = body.plan === "advanced" ? "advanced" : "pro";

    // 本地商业化地基：先模拟支付成功，后续把这里替换为微信/支付宝/Stripe checkout。
    const subscription = await upgradeSubscription(user.id, plan);
    return NextResponse.json({
      subscription,
      checkoutMode: "mock",
      message: "本地模拟支付已完成，生产环境请接入真实支付回调。",
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: "CHECKOUT_FAILED" }, { status });
  }
}
