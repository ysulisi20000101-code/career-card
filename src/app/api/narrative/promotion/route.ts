import { NextResponse } from "next/server";
import type { PromotionStage, TimelineNode } from "@/types";
import {
  AiProviderError,
  extractPromotionStagesWithMiniMax,
} from "@/lib/ai/minimax-provider";

export const runtime = "nodejs";

const USER_MESSAGES: Record<string, string> = {
  missing_key: "AI 服务还没有配置本地 Key，请配置后重启开发服务。",
  auth_failed: "AI 服务鉴权失败，请检查 MiniMax Key 是否有效。",
  model_failed: "AI 模型调用失败，请稍后重试或检查模型配置。",
  parse_failed: "AI 返回格式异常，系统没有拿到可用阶段数据。",
  quality_failed: "AI 没有抽取到可用晋升阶段，请补充经历后再试。",
  network_failed: "暂时无法连接 AI 服务，请稍后重试。",
};

function appendExplicitProductStages(
  node: TimelineNode,
  stages: PromotionStage[],
): PromotionStage[] {
  const text = [
    node.position,
    node.description,
    ...node.highlights,
    node.storyAction,
    node.storyOutcome,
    node.storyReflection,
  ]
    .filter(Boolean)
    .join(" ");
  const next = [...stages];
  const normalizeTitle = (value: string) => value.toLowerCase().replace(/\s+/g, "");
  const addIfMissing = (stage: PromotionStage) => {
    const exists = next.some(
      (item) =>
        item.id === stage.id ||
        normalizeTitle(item.title).includes(normalizeTitle(stage.title)) ||
        normalizeTitle(stage.title).includes(normalizeTitle(item.title)),
    );
    if (!exists) next.push(stage);
  };

  if (text.includes("\u4ea7\u54c1\u7ecf\u7406")) {
    addIfMissing({
      id: "promotion-product-manager",
      title: "\u4ea7\u54c1\u7ecf\u7406",
      period: node.startDate ? `${node.startDate} \u8d77` : "\u65e9\u671f\u9636\u6bb5",
      teamScale: "\u72ec\u7acb\u8d1f\u8d23",
      leadershipType: "none",
      responsibility:
        "\u56f4\u7ed5\u5177\u4f53\u4ea7\u54c1\u6a21\u5757\u6216\u5de5\u5177\u94fe\u80fd\u529b\u8fdb\u884c\u9700\u6c42\u62c6\u89e3\u3001\u65b9\u6848\u8bbe\u8ba1\u548c\u63a8\u8fdb\u843d\u5730\u3002",
      outcome:
        "\u5b8c\u6210\u4ece\u6267\u884c\u5230\u72ec\u7acb\u8d1f\u8d23\u7684\u89d2\u8272\u5efa\u7acb\uff0c\u5f00\u59cb\u5f62\u6210\u7a33\u5b9a\u7684\u4ea7\u54c1\u89c4\u5212\u548c\u4ea4\u4ed8\u65b9\u6cd5\u3002",
      reflection:
        "\u8fd9\u4e00\u9636\u6bb5\u7684\u91cd\u70b9\u662f\u628a\u590d\u6742\u95ee\u9898\u62c6\u6e05\u695a\uff0c\u5e76\u7528\u53ef\u4ea4\u4ed8\u7684\u65b9\u6848\u5efa\u7acb\u4fe1\u4efb\u3002",
    });
  }

  if (/leader/i.test(text) || text.includes("\u4ea7\u54c1\u8d1f\u8d23\u4eba")) {
    addIfMissing({
      id: "promotion-product-leader",
      title: "\u4ea7\u54c1 leader",
      period: "\u4e2d\u671f\u9636\u6bb5",
      teamScale: "\u865a\u7ebf\u534f\u540c\u56e2\u961f",
      leadershipType: "dotted",
      responsibility:
        "\u4ece\u72ec\u7acb\u8d1f\u8d23\u6269\u5c55\u5230\u8de8\u89d2\u8272\u534f\u540c\uff0c\u63a8\u52a8\u591a\u4eba\u56f4\u7ed5\u540c\u4e00\u4ea7\u54c1\u76ee\u6807\u5f62\u6210\u8282\u594f\u548c\u5171\u8bc6\u3002",
      outcome:
        "\u627f\u62c5\u4e86\u66f4\u590d\u6742\u7684\u534f\u4f5c\u548c\u63a8\u8fdb\u8d23\u4efb\uff0c\u89d2\u8272\u4ece\u4e2a\u4eba\u8d21\u732e\u8005\u8f6c\u5411\u5c0f\u56e2\u961f\u7275\u5f15\u8005\u3002",
      reflection:
        "\u8fd9\u4e00\u9636\u6bb5\u7684\u5173\u952e\u53d8\u5316\uff0c\u662f\u4ece\u628a\u4e8b\u60c5\u505a\u6210\uff0c\u5347\u7ea7\u4e3a\u8ba9\u4e00\u7ec4\u4eba\u56f4\u7ed5\u76ee\u6807\u6301\u7eed\u505a\u6210\u3002",
    });
  }

  if (text.includes("\u4ea7\u54c1\u603b\u76d1") || text.includes("\u603b\u76d1")) {
    addIfMissing({
      id: "promotion-product-director",
      title: "\u4ea7\u54c1\u603b\u76d1",
      period: node.endDate ? `\u81f3 ${node.endDate}` : "\u6700\u65b0\u9636\u6bb5",
      teamScale: "\u5b9e\u7ebf\u7ba1\u7406\u56e2\u961f",
      leadershipType: "solid",
      responsibility:
        "\u8d1f\u8d23\u66f4\u5b8c\u6574\u7684\u5e73\u53f0\u4ea7\u54c1\u89c4\u5212\u3001\u56e2\u961f\u5206\u5de5\u3001\u534f\u4f5c\u673a\u5236\u548c\u4ea4\u4ed8\u8d28\u91cf\u3002",
      outcome:
        "\u89d2\u8272\u4ece\u9879\u76ee\u548c\u6a21\u5757\u63a8\u8fdb\uff0c\u8fdb\u4e00\u6b65\u5347\u7ea7\u5230\u56e2\u961f\u7ba1\u7406\u4e0e\u4ea7\u54c1\u65b9\u5411\u7edf\u7b79\u3002",
      reflection:
        "\u8fd9\u4e00\u9636\u6bb5\u66f4\u5173\u6ce8\u7cfb\u7edf\u6027\u5224\u65ad\uff1a\u65b9\u5411\u662f\u5426\u6b63\u786e\u3001\u7ec4\u7ec7\u662f\u5426\u6709\u6548\u3001\u4ea4\u4ed8\u662f\u5426\u53ef\u6301\u7eed\u3002",
    });
  }

  return next;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const node = body?.node as TimelineNode | undefined;

  if (!node || typeof node !== "object") {
    return NextResponse.json(
      { code: "invalid_input", error: "缺少经历数据，请先选择最新社招经历。" },
      { status: 400 },
    );
  }

  try {
    const suggestion = await extractPromotionStagesWithMiniMax(node);
    return NextResponse.json({
      suggestion: {
        stages: appendExplicitProductStages(node, suggestion.stages),
      },
    });
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
      { code: "unknown_error", error: "AI 推断晋升阶段失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
