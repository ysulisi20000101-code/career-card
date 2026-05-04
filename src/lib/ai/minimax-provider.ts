import type { PromotionStage, StoryMood, TimelineNode } from "@/types";

export interface AiStorySuggestion {
  storyTitle: string;
  storyScene: string;
  storyChallenge: string;
  storyAction: string;
  storyOutcome: string;
  storyReflection: string;
  storyMood: StoryMood;
  evidenceProblem: string;
  evidenceAction: string;
  evidenceResult: string;
  evidenceProof: string;
}

export interface AiPromotionSuggestion {
  stages: PromotionStage[];
}

export type AiProviderErrorCode =
  | "missing_key"
  | "auth_failed"
  | "model_failed"
  | "parse_failed"
  | "quality_failed"
  | "network_failed";

export class AiProviderError extends Error {
  constructor(
    readonly code: AiProviderErrorCode,
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

const STORY_MOODS: StoryMood[] = [
  "focus",
  "growth",
  "breakthrough",
  "craft",
  "impact",
];

function compactNode(node: TimelineNode) {
  return {
    company: node.company,
    position: node.position,
    startDate: node.startDate,
    endDate: node.endDate,
    description: node.description,
    highlights: node.highlights,
    skills: node.skills,
    storyTitle: node.storyTitle,
    storyScene: node.storyScene,
    storyChallenge: node.storyChallenge,
    storyAction: node.storyAction,
    storyOutcome: node.storyOutcome,
    storyReflection: node.storyReflection,
  };
}

function buildStoryPrompt(node: TimelineNode): string {
  return [
    "请把下面这段求职经历整理成个人职业网站中的职业故事和亮点支撑。",
    "只输出一个 JSON 对象，不要 Markdown，不要解释。",
    "必须基于已提供的 company、position、description、highlights、skills 改写，不要编造具体数字、奖项、公司事实或不存在的结果。",
    "禁止输出“待补充”“待完善”“无法生成”“请提供”等占位或拒绝文案。",
    "语气要专业、克制、可信，适合产品、技术、运营岗位面试官快速阅读。",
    "每个中文字段控制在 1-2 句。",
    "storyMood 必须是 focus、growth、breakthrough、craft、impact 之一。",
    "亮点支撑字段含义：evidenceProblem 表示挑战，evidenceAction 表示行动，evidenceResult 表示产出，evidenceProof 表示可补充的细节素材。",
    "JSON 字段必须完整包含：storyTitle, storyScene, storyChallenge, storyAction, storyOutcome, storyReflection, storyMood, evidenceProblem, evidenceAction, evidenceResult, evidenceProof。",
    "",
    "经历数据：",
    JSON.stringify(compactNode(node), null, 2),
  ].join("\n");
}

function buildPromotionPrompt(node: TimelineNode): string {
  return [
    "请从下面这段最新社招经历中，抽取职业晋升阶段。",
    "只输出一个 JSON 对象，不要 Markdown，不要解释。",
    "目标是识别候选人是否经历了角色变化，例如：产品经理、产品负责人/leader、产品总监。",
    "阶段名称必须优先沿用 position、description、highlights 中出现过的产品角色，不要把产品岗位改写成技术专家、研发负责人等不一致 title。",
    "如果职位或描述中出现“产品经理”“产品leader”“产品总监”，阶段 title 必须围绕这些词组织。",
    "必须基于简历原文、故事字段和亮点内容推断，禁止编造明确日期、团队人数或汇报关系。",
    "如果原文没有明确数字，可以用“约3-5人”“约10人”“未明确”等谨慎表达。",
    "leadershipType 必须是 none、dotted、solid 之一：none 表示独立负责但不带人，dotted 表示虚线协同/带队，solid 表示实线团队管理。",
    "每个阶段要写清：阶段名称、时间/阶段描述、带队规模、职责变化、产出、思考。",
    "如果无法识别任何阶段，返回 {\"stages\":[]}。",
    "JSON 字段必须为：stages。每个 stage 包含 id, title, period, teamScale, leadershipType, responsibility, outcome, reflection。",
    "",
    "经历数据：",
    JSON.stringify(compactNode(node), null, 2),
  ].join("\n");
}

function pickMiniMaxContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const first = choices[0];
  if (!first || typeof first !== "object") return "";
  const message = (first as Record<string, unknown>).message;
  if (!message || typeof message !== "object") return "";
  const content = (message as Record<string, unknown>).content;
  return typeof content === "string" ? content : "";
}

function parseJsonFromText(text: string): Record<string, unknown> | null {
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  try {
    return JSON.parse(withoutThink) as Record<string, unknown>;
  } catch {
    // Find the first { and match balanced brackets
    const start = withoutThink.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < withoutThink.length; i++) {
      const ch = withoutThink[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(withoutThink.slice(start, i + 1)) as Record<string, unknown>;
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function hasPlaceholder(value: string): boolean {
  return /待补充|待完善|无法生成|请提供|占位/.test(value);
}

function validateStorySuggestion(value: unknown): AiStorySuggestion {
  if (!value || typeof value !== "object") {
    throw new AiProviderError("parse_failed", "AI 返回内容不是有效对象", 502);
  }
  const record = value as Record<string, unknown>;
  const storyMood = record.storyMood;
  const suggestion: AiStorySuggestion = {
    storyTitle: stringField(record, "storyTitle"),
    storyScene: stringField(record, "storyScene"),
    storyChallenge: stringField(record, "storyChallenge"),
    storyAction: stringField(record, "storyAction"),
    storyOutcome: stringField(record, "storyOutcome"),
    storyReflection: stringField(record, "storyReflection"),
    storyMood: STORY_MOODS.includes(storyMood as StoryMood)
      ? (storyMood as StoryMood)
      : "focus",
    evidenceProblem: stringField(record, "evidenceProblem"),
    evidenceAction: stringField(record, "evidenceAction"),
    evidenceResult: stringField(record, "evidenceResult"),
    evidenceProof: stringField(record, "evidenceProof"),
  };

  const requiredText = [
    suggestion.storyTitle,
    suggestion.storyScene,
    suggestion.storyChallenge,
    suggestion.storyAction,
    suggestion.storyOutcome,
    suggestion.storyReflection,
    suggestion.evidenceProblem,
    suggestion.evidenceAction,
    suggestion.evidenceResult,
  ];
  if (requiredText.some((text) => !text || hasPlaceholder(text))) {
    throw new AiProviderError(
      "quality_failed",
      "AI 返回内容不够完整，请补充经历信息后重新生成",
      422,
    );
  }

  return suggestion;
}

function leadershipType(value: unknown): PromotionStage["leadershipType"] {
  return value === "dotted" || value === "solid" ? value : "none";
}

function validatePromotionSuggestion(value: unknown): AiPromotionSuggestion {
  if (!value || typeof value !== "object") {
    throw new AiProviderError("parse_failed", "AI 返回内容不是有效对象", 502);
  }
  const stages = Array.isArray((value as Record<string, unknown>).stages)
    ? ((value as Record<string, unknown>).stages as unknown[])
    : [];

  return {
    stages: stages
      .filter((stage): stage is Record<string, unknown> => {
        return typeof stage === "object" && stage !== null;
      })
      .map((stage, index) => ({
        id: stringField(stage, "id") || `promotion-${index + 1}`,
        title: stringField(stage, "title"),
        period: stringField(stage, "period"),
        teamScale: stringField(stage, "teamScale"),
        leadershipType: leadershipType(stage.leadershipType),
        responsibility: stringField(stage, "responsibility"),
        outcome: stringField(stage, "outcome"),
        reflection: stringField(stage, "reflection"),
      }))
      .filter((stage) => {
        const required = [stage.title, stage.responsibility, stage.outcome];
        return required.every((text) => text && !hasPlaceholder(text));
      })
      .slice(0, 5),
  };
}

function fallbackPromotionStages(node: TimelineNode): PromotionStage[] {
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
  const stages: PromotionStage[] = [];
  const hasPm = text.includes("\u4ea7\u54c1\u7ecf\u7406");
  const hasLeader =
    /leader/i.test(text) || text.includes("\u4ea7\u54c1\u8d1f\u8d23\u4eba");
  const hasDirector =
    text.includes("\u4ea7\u54c1\u603b\u76d1") || text.includes("\u603b\u76d1");

  if (hasPm) {
    stages.push({
      id: "promotion-product-manager",
      title: "\u4ea7\u54c1\u7ecf\u7406",
      period: node.startDate ? `${node.startDate} \u8d77` : "\u65e9\u671f\u9636\u6bb5",
      teamScale: "\u72ec\u7acb\u8d1f\u8d23",
      leadershipType: "none",
      responsibility: "\u56f4\u7ed5\u5177\u4f53\u4ea7\u54c1\u6a21\u5757\u6216\u5de5\u5177\u94fe\u80fd\u529b\u8fdb\u884c\u9700\u6c42\u62c6\u89e3\u3001\u65b9\u6848\u8bbe\u8ba1\u548c\u63a8\u8fdb\u843d\u5730\u3002",
      outcome: "\u5b8c\u6210\u4ece\u6267\u884c\u5230\u72ec\u7acb\u8d1f\u8d23\u7684\u89d2\u8272\u5efa\u7acb\uff0c\u5f00\u59cb\u5f62\u6210\u7a33\u5b9a\u7684\u4ea7\u54c1\u89c4\u5212\u548c\u4ea4\u4ed8\u65b9\u6cd5\u3002",
      reflection: "\u8fd9\u4e00\u9636\u6bb5\u7684\u91cd\u70b9\u662f\u628a\u590d\u6742\u95ee\u9898\u62c6\u6e05\u695a\uff0c\u5e76\u7528\u53ef\u4ea4\u4ed8\u7684\u65b9\u6848\u5efa\u7acb\u4fe1\u4efb\u3002",
    });
  }

  if (hasLeader) {
      const scaleMatch = text.match(
        /(?:\u865a\u7ebf|\u534f\u540c|\u5e26)(?:\u961f)?\s*(\d+\s*[-~\u5230]\s*\d+\s*\u4eba?|\d+\s*\u4eba)/,
      );
      stages.push({
        id: "promotion-product-leader",
        title: "\u4ea7\u54c1 leader",
        period: "\u4e2d\u671f\u9636\u6bb5",
        teamScale: scaleMatch?.[1] || "\u865a\u7ebf\u534f\u540c\u56e2\u961f",
        leadershipType: "dotted",
        responsibility: "\u4ece\u72ec\u7acb\u8d1f\u8d23\u6269\u5c55\u5230\u8de8\u89d2\u8272\u534f\u540c\uff0c\u63a8\u52a8\u591a\u4eba\u56f4\u7ed5\u540c\u4e00\u4ea7\u54c1\u76ee\u6807\u5f62\u6210\u8282\u594f\u548c\u5171\u8bc6\u3002",
        outcome: "\u627f\u62c5\u4e86\u66f4\u590d\u6742\u7684\u534f\u4f5c\u548c\u63a8\u8fdb\u8d23\u4efb\uff0c\u89d2\u8272\u4ece\u4e2a\u4eba\u8d21\u732e\u8005\u8f6c\u5411\u5c0f\u56e2\u961f\u7275\u5f15\u8005\u3002",
        reflection: "\u8fd9\u4e00\u9636\u6bb5\u7684\u5173\u952e\u53d8\u5316\uff0c\u662f\u4ece\u628a\u4e8b\u60c5\u505a\u6210\uff0c\u5347\u7ea7\u4e3a\u8ba9\u4e00\u7ec4\u4eba\u56f4\u7ed5\u76ee\u6807\u6301\u7eed\u505a\u6210\u3002",
    });
  }

  if (hasDirector) {
      const scaleMatch = text.match(
        /(?:\u5b9e\u7ebf|\u7ba1\u7406|\u5e26)(?:\u961f)?\s*(\d+\s*[-~\u5230]?\s*\d*\s*\u4eba?)/,
      );
      stages.push({
        id: "promotion-product-director",
        title: "\u4ea7\u54c1\u603b\u76d1",
        period: node.endDate ? `\u81f3 ${node.endDate}` : "\u6700\u65b0\u9636\u6bb5",
        teamScale: scaleMatch?.[1] || "\u5b9e\u7ebf\u7ba1\u7406\u56e2\u961f",
        leadershipType: "solid",
        responsibility: "\u8d1f\u8d23\u66f4\u5b8c\u6574\u7684\u5e73\u53f0\u4ea7\u54c1\u89c4\u5212\u3001\u56e2\u961f\u5206\u5de5\u3001\u534f\u4f5c\u673a\u5236\u548c\u4ea4\u4ed8\u8d28\u91cf\u3002",
        outcome: "\u89d2\u8272\u4ece\u9879\u76ee\u548c\u6a21\u5757\u63a8\u8fdb\uff0c\u8fdb\u4e00\u6b65\u5347\u7ea7\u5230\u56e2\u961f\u7ba1\u7406\u4e0e\u4ea7\u54c1\u65b9\u5411\u7edf\u7b79\u3002",
        reflection: "\u8fd9\u4e00\u9636\u6bb5\u66f4\u5173\u6ce8\u7cfb\u7edf\u6027\u5224\u65ad\uff1a\u65b9\u5411\u662f\u5426\u6b63\u786e\u3001\u7ec4\u7ec7\u662f\u5426\u6709\u6548\u3001\u4ea4\u4ed8\u662f\u5426\u53ef\u6301\u7eed\u3002",
    });
  }

  return stages;
}

function errorMessage(payload: unknown): string {
  const record =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const base =
    record.base_resp && typeof record.base_resp === "object"
      ? (record.base_resp as Record<string, unknown>)
      : {};
  const error =
    record.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : {};
  return String(error.message ?? base.status_msg ?? record.error ?? "MiniMax API 调用失败");
}

function mapMiniMaxError(payload: unknown, status: number): AiProviderError {
  const message = errorMessage(payload);
  if (status === 401 || /invalid api key|login fail|authorization|unauthorized/i.test(message)) {
    return new AiProviderError("auth_failed", "MiniMax 鉴权失败，请检查本地 API Key", 401);
  }
  return new AiProviderError("model_failed", message, status >= 400 ? status : 502);
}

async function callMiniMax(prompt: string): Promise<unknown> {
  const apiKey = process.env.MINIMAX_API_KEY?.trim();
  if (!apiKey) {
    throw new AiProviderError(
      "missing_key",
      "本地环境缺少 MINIMAX_API_KEY，请配置后重启开发服务",
      500,
    );
  }

  const model = process.env.MINIMAX_MODEL || "MiniMax-M2.7";
  const baseUrl = (process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com/v1").replace(
    /\/$/,
    "",
  );

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/text/chatcompletion_v2`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是求职个人网站的职业叙事编辑，擅长把简历经历整理成可信、克制、有亮点支撑的成长故事。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
      }),
    });
  } catch {
    throw new AiProviderError("network_failed", "无法连接 MiniMax 服务，请稍后重试", 503);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw mapMiniMaxError(payload, response.status);

  const baseResp =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>).base_resp
      : null;
  if (
    baseResp &&
    typeof baseResp === "object" &&
    typeof (baseResp as Record<string, unknown>).status_code === "number" &&
    (baseResp as Record<string, unknown>).status_code !== 0
  ) {
    throw mapMiniMaxError(payload, 502);
  }

  return parseJsonFromText(pickMiniMaxContent(payload));
}

export async function organizeTimelineStoryWithMiniMax(
  node: TimelineNode,
): Promise<AiStorySuggestion> {
  return validateStorySuggestion(await callMiniMax(buildStoryPrompt(node)));
}

export async function extractPromotionStagesWithMiniMax(
  node: TimelineNode,
): Promise<AiPromotionSuggestion> {
  const suggestion = validatePromotionSuggestion(await callMiniMax(buildPromotionPrompt(node)));
  const fallback = fallbackPromotionStages(node);
  const merged = [...suggestion.stages];
  const normalizeTitle = (value: string) => value.toLowerCase().replace(/\s+/g, "");
  for (const stage of fallback) {
    const exists = merged.some(
      (item) =>
        normalizeTitle(item.title).includes(normalizeTitle(stage.title)) ||
        normalizeTitle(stage.title).includes(normalizeTitle(item.title)) ||
        item.id === stage.id,
    );
    if (!exists) merged.push(stage);
  }
  return { stages: merged };
}
