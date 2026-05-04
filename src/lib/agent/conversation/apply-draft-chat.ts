import type { ResumeData } from "@/types";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import type {
  CareerSiteChatResult,
  CareerSiteDraft,
} from "@/lib/agent/site-generator/types";
import { getStyleForPreset, inferStyleFromText } from "@/lib/agent/site-generator/styles";
import { compact } from "@/lib/utils-helpers";
import { getFirstAvailableProviderConfig } from "@/lib/agent/provider";

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word.toLowerCase()));
}


function findFocusExperience(draft: CareerSiteDraft, text: string): string | null {
  const normalized = text.toLowerCase();
  return (
    draft.experienceBlocks.find((block) =>
      [block.title, block.organization, block.summary, ...block.bullets]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )?.sourceTimelineId ?? null
  );
}

function cloneDraft(base: CareerSiteDraft): CareerSiteDraft {
  return {
    ...base,
    sections: base.sections.map((section) => ({ ...section, bullets: [...section.bullets] })),
    experienceBlocks: base.experienceBlocks.map((block) => ({ ...block, bullets: [...block.bullets] })),
    positioning: { ...base.positioning, coreStrengths: [...base.positioning.coreStrengths] },
    narrative: {
      ...base.narrative,
      featuredExperienceIds: [...base.narrative.featuredExperienceIds],
      proofPoints: [...base.narrative.proofPoints],
    },
    review: {
      ...base.review,
      missingFacts: [...base.review.missingFacts],
      riskyClaims: [...base.review.riskyClaims],
      publishBlockers: [...base.review.publishBlockers],
    },
    versionHistory: [...base.versionHistory],
  };
}

export function applyDraftChat(input: {
  draft?: CareerSiteDraft | null;
  resumeData: ResumeData;
  message: string;
  now?: Date;
}): CareerSiteChatResult {
  const now = input.now ?? new Date();
  const message = input.message.trim();
  const text = message.toLowerCase();
  const base = input.draft ?? generateCareerSiteDraft(input.resumeData, { now });
  const changes: string[] = [];
  const questions: string[] = [];
  let draft = cloneDraft(base);

  const style = inferStyleFromText(text);
  if (style) {
    draft = { ...draft, style: getStyleForPreset(style) };
    changes.push(`视觉风格已切换为「${style}」。`);
  }

  if (includesAny(text, ["ai agent", "agent", "智能体", "大模型", "deepseek", "mimo"])) {
    const name = input.resumeData.profile.name || "候选人";
    draft = {
      ...draft,
      positioning: {
        ...draft.positioning,
        targetRole: "AI Agent 产品 / 平台方向",
        headline: `${name}｜AI Agent 产品 / 平台方向`,
        oneLinePitch: "把复杂业务流程拆解成可交付、可验证、可持续迭代的 Agent 产品系统。",
        coreStrengths: Array.from(new Set(["AI Agent", "工作流设计", "平台产品", "复杂问题拆解", ...draft.positioning.coreStrengths])).slice(0, 8),
      },
      hero: {
        ...draft.hero,
        title: `${name}，AI Agent 产品 / 平台方向`,
        subtitle: "把复杂业务流程拆解成可交付、可验证、可持续迭代的 Agent 产品系统。",
      },
      narrative: {
        ...draft.narrative,
        theme: "从产品判断到 Agent 系统落地",
        storyArc: "叙事重点调整为：如何把复杂协作、流程和知识问题，转化为可复用的 AI Agent 产品能力。",
      },
    };
    changes.push("职业定位已转向 AI Agent 产品 / 平台方向。");
  }

  if (includesAny(text, ["太虚", "更实在", "真实", "别夸张", "降低", "克制", "可信"])) {
    draft = {
      ...draft,
      style: { ...draft.style, tone: "克制、具体、证据优先" },
      sections: draft.sections.map((section) =>
        section.id === "proof"
          ? {
              ...section,
              title: "只保留可被简历支撑的证据",
              body: "这一版会降低形容词密度，优先展示来自简历的事实、负责范围、上线结果和可核验成果。",
              bullets: section.bullets.map((bullet) => compact(bullet, 140)),
            }
          : section,
      ),
      review: {
        ...draft.review,
        riskyClaims: Array.from(new Set([...draft.review.riskyClaims, "请复核所有没有简历来源的强结论表达。"])),
      },
    };
    changes.push("表达已收敛为更具体、可信、证据优先的版本。");
  }

  if (includesAny(text, ["重点", "突出", "放在", "强调", "focus"])) {
    const focusExperienceId = findFocusExperience(draft, text);
    if (focusExperienceId) {
      draft = {
        ...draft,
        narrative: {
          ...draft.narrative,
          featuredExperienceIds: [focusExperienceId, ...draft.narrative.featuredExperienceIds.filter((id) => id !== focusExperienceId)],
        },
      };
      changes.push("已根据你的要求调整重点经历排序。");
    } else {
      draft = {
        ...draft,
        narrative: {
          ...draft.narrative,
          theme: compact(`${draft.narrative.theme}｜重点：${message}`, 120),
          storyArc: compact(`这一版会把叙事重心放在「${message}」，同时不新增简历外事实。`, 180),
        },
      };
      changes.push("叙事重点已根据你的指令调整。");
    }
  }

  if (includesAny(text, ["发布", "能不能发", "检查", "风险", "review"])) {
    questions.push(
      draft.review.publishBlockers.length > 0
        ? `发布前还需要处理：${draft.review.publishBlockers.join("、")}。`
        : "当前没有阻断发布的问题，可以继续做风格和措辞精修。",
    );
    changes.push("已重新解释发布前风险和待确认项。");
  }

  if (changes.length === 0) {
    questions.push("你想优先改职业定位、叙事重点、视觉风格，还是某一段经历的表达？");
    changes.push("这条指令还不够具体，我先不改动网站内容，避免误改事实。");
  }

  draft = {
    ...draft,
    updatedAt: now.toISOString(),
    versionHistory: [
      ...draft.versionHistory,
      {
        id: `v${draft.versionHistory.length + 1}`,
        summary: compact([...changes, ...questions].join(" ")),
        createdAt: now.toISOString(),
      },
    ],
  };

  return {
    draft,
    summary: changes.join(" "),
    changes,
    questions,
  };
}

// ─── LLM-enhanced site-chat ──────────────────────────────────────────────────

function buildSiteChatPrompt(
  draft: CareerSiteDraft,
  message: string,
  baseline: CareerSiteChatResult,
  history?: Array<{ role: "user" | "agent"; content: string }>,
): string {
  const historyBlock = history && history.length > 0
    ? [
        "Recent conversation history:",
        ...history.map((h) => `${h.role === "user" ? "User" : "Agent"}: ${h.content.slice(0, 200)}`),
        "",
      ].join("\n")
    : "";

  return [
    "You are the Career Card site editor. Given a career site DRAFT and the user's instruction, modify the draft accordingly.",
    "Return ONLY a JSON object with the fields to change. Do NOT invent facts, metrics, dates, or awards not present in the draft.",
    "Only include fields that should change. Omit unchanged fields.",
    "",
    historyBlock,
    "Modifiable fields (all optional in response):",
    "- positioning.targetRole: string (role title)",
    "- positioning.headline: string (person | role format)",
    "- positioning.oneLinePitch: string (one-line positioning, max 160 chars)",
    "- positioning.coreStrengths: string[] (top 5-8 skills)",
    "- narrative.theme: string (career narrative theme, max 120 chars)",
    "- narrative.storyArc: string (story arc description, max 260 chars)",
    "- hero.title: string (hero section title)",
    "- hero.subtitle: string (hero section subtitle)",
    "- hero.eyebrow: string (hero eyebrow text)",
    "- hero.primaryCta: string (hero primary call-to-action)",
    "- style.tone: string (tone description)",
    "- sections[proof].body: string (proof section body)",
    "- sections[proof].title: string (proof section title)",
    "- sections[proof].bullets: string[] (proof section bullet points)",
    "- sections[positioning].body: string (positioning body)",
    "- sections[positioning].bullets: string[] (positioning bullet points)",
    "- sections[story].body: string (story body)",
    "",
    "Rules baseline (deterministic enhancement):",
    JSON.stringify({
      changes: baseline.changes,
      questions: baseline.questions,
    }, null, 2),
    "",
    "Current draft (key fields):",
    JSON.stringify({
      positioning: draft.positioning,
      narrative: { theme: draft.narrative.theme, storyArc: draft.narrative.storyArc },
      hero: draft.hero,
      style: draft.style,
    }, null, 2),
    "",
    `User instruction: "${message}"`,
    "",
    "Respond with ONLY a JSON object like:",
    '{"changes": ["描述改动1", "描述改动2"], "questions": ["需要澄清的问题"], "updates": { "positioning": { "targetRole": "新岗位名" }, "hero": { "title": "新标题" } }}',
    "",
    "If the instruction is too vague or cannot be acted on without inventing facts, respond with questions asking for clarification and leave updates empty.",
  ].join("\n");
}

function mergeLLMUpdates(draft: CareerSiteDraft, updates: unknown): CareerSiteDraft {
  if (!updates || typeof updates !== "object") return draft;
  const u = updates as Record<string, unknown>;
  let next = { ...draft };

  if (u.positioning && typeof u.positioning === "object") {
    const p = u.positioning as Record<string, unknown>;
    next = {
      ...next,
      positioning: {
        ...next.positioning,
        ...(typeof p.targetRole === "string" ? { targetRole: p.targetRole } : {}),
        ...(typeof p.headline === "string" ? { headline: p.headline } : {}),
        ...(typeof p.oneLinePitch === "string" ? { oneLinePitch: compact(p.oneLinePitch, 160) } : {}),
        ...(Array.isArray(p.coreStrengths) ? { coreStrengths: (p.coreStrengths as string[]).slice(0, 8) } : {}),
      },
    };
  }

  if (u.narrative && typeof u.narrative === "object") {
    const n = u.narrative as Record<string, unknown>;
    next = {
      ...next,
      narrative: {
        ...next.narrative,
        ...(typeof n.theme === "string" ? { theme: compact(n.theme, 120) } : {}),
        ...(typeof n.storyArc === "string" ? { storyArc: compact(n.storyArc, 260) } : {}),
      },
    };
  }

  if (u.hero && typeof u.hero === "object") {
    const h = u.hero as Record<string, unknown>;
    next = {
      ...next,
      hero: {
        ...next.hero,
        ...(typeof h.title === "string" ? { title: h.title } : {}),
        ...(typeof h.subtitle === "string" ? { subtitle: h.subtitle } : {}),
        ...(typeof h.eyebrow === "string" ? { eyebrow: h.eyebrow } : {}),
        ...(typeof h.primaryCta === "string" ? { primaryCta: h.primaryCta } : {}),
      },
    };
  }

  if (u.style && typeof u.style === "object") {
    const s = u.style as Record<string, unknown>;
    next = {
      ...next,
      style: {
        ...next.style,
        ...(typeof s.tone === "string" ? { tone: s.tone } : {}),
      },
    };
  }

  if (u.sections && typeof u.sections === "object") {
    const sections = u.sections as Record<string, unknown>;
    next = {
      ...next,
      sections: next.sections.map((section) => {
        const sectionUpdate = sections[section.id] as Record<string, unknown> | undefined;
        if (!sectionUpdate) return section;
        return {
          ...section,
          ...(typeof sectionUpdate.body === "string" ? { body: sectionUpdate.body } : {}),
          ...(typeof sectionUpdate.title === "string" ? { title: sectionUpdate.title } : {}),
          ...(Array.isArray(sectionUpdate.bullets) ? { bullets: (sectionUpdate.bullets as string[]).slice(0, 6) } : {}),
        };
      }),
    };
  }

  return next;
}

export async function applyDraftChatWithLLM(input: {
  draft?: CareerSiteDraft | null;
  resumeData: ResumeData;
  message: string;
  now?: Date;
  history?: Array<{ role: "user" | "agent"; content: string }>;
}): Promise<CareerSiteChatResult> {
  const baseline = applyDraftChat(input);
  const result = getFirstAvailableProviderConfig();

  if (!result) {
    return {
      ...baseline,
      summary: `${baseline.summary}  (配置 AI 后可获得更个性化调整。)`,
      questions: [...baseline.questions, "当前未配置 AI 提供商，使用规则引擎调整。配置后可获得更智能的文案优化。"],
    };
  }

  const { config } = result;

  try {
    const draft = baseline.draft;
    const prompt = buildSiteChatPrompt(draft, input.message, baseline, input.history);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const body: Record<string, unknown> = {
      model: config.model,
      messages: [
        { role: "system", content: "Return only valid JSON. No markdown, no explanation." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    };
    if (config.supportsResponseFormat) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(config.chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        ...baseline,
        questions: [...baseline.questions, "AI 服务暂时不可用，当前使用规则引擎调整。"],
      };
    }

    const payload = await response.json();
    const content = (payload as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;
    if (!content) return baseline;

    const parsed = JSON.parse(content.trim());
    const changes = Array.isArray(parsed.changes) ? (parsed.changes as string[]) : baseline.changes;
    const questions = Array.isArray(parsed.questions) ? (parsed.questions as string[]) : [];
    const llmDraft = mergeLLMUpdates(baseline.draft, parsed.updates);

    const now = input.now ?? new Date();
    const finalDraft: CareerSiteDraft = {
      ...llmDraft,
      updatedAt: now.toISOString(),
      versionHistory: [
        ...llmDraft.versionHistory,
        {
          id: `v${llmDraft.versionHistory.length + 1}`,
          summary: compact([...changes, ...questions].join(" ")),
          createdAt: now.toISOString(),
        },
      ],
    };

    return {
      draft: finalDraft,
      summary: changes.join(" "),
      changes,
      questions: questions.length > 0 ? questions : baseline.questions,
    };
  } catch (e) {
    console.error("applyDraftChat LLM enhance failed:", e);
    return {
      ...baseline,
      questions: [...baseline.questions, "AI 增强失败，已使用规则引擎处理。配置稳定的 AI 服务后可获得更好体验。"],
    };
  }
}
