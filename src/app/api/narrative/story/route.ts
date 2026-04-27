import { NextResponse } from "next/server";
import type { TimelineNode } from "@/types";
import {
  AiProviderError,
  organizeTimelineStoryWithMiniMax,
} from "@/lib/ai/minimax-provider";

export const runtime = "nodejs";

const USER_MESSAGES: Record<string, string> = {
  missing_key: "AI 服务还没有配置本地 Key，请配置后重启开发服务。",
  auth_failed: "AI 服务鉴权失败，请检查 MiniMax Key 是否有效。",
  model_failed: "AI 模型调用失败，请稍后重试或检查模型配置。",
  parse_failed: "AI 返回格式异常，系统没有拿到可用 JSON，请重新生成。",
  quality_failed: "AI 返回内容不够完整，请补充经历信息后重新生成。",
  network_failed: "暂时无法连接 AI 服务，请稍后重试。",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const node = body?.node as TimelineNode | undefined;

  if (!node || typeof node !== "object") {
    return NextResponse.json(
      { code: "invalid_input", error: "缺少经历数据，请先选择一段工作经历。" },
      { status: 400 },
    );
  }

  try {
    const suggestion = await organizeTimelineStoryWithMiniMax(node);
    return NextResponse.json({ suggestion });
  } catch (error) {
    if (error instanceof AiProviderError) {
      return NextResponse.json(
        {
          code: error.code,
          error: USER_MESSAGES[error.code] ?? error.message,
          detail: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { code: "unknown_error", error: "AI 整理失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
