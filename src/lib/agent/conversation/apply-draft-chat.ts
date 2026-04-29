import type { ResumeData } from "@/types";
import { generateCareerSiteDraft } from "@/lib/agent/site-generator/generate-site-draft";
import type {
  CareerSiteChatResult,
  CareerSiteDraft,
  CareerSiteStylePreset,
} from "@/lib/agent/site-generator/types";

function compact(value: string, max = 220): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized;
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function stylePatch(preset: CareerSiteStylePreset): CareerSiteDraft["style"] {
  const styles: Record<CareerSiteStylePreset, CareerSiteDraft["style"]> = {
    executive: {
      preset,
      tone: "克制、可信、面向决策者",
      density: "balanced",
      colorTheme: "墨黑、暖白、深青",
      layoutStyle: "高管档案式叙事，先给判断，再给证据",
      typography: "沉稳标题字重，紧凑正文",
    },
    "product-led": {
      preset,
      tone: "结构清晰、结果导向、有产品判断",
      density: "balanced",
      colorTheme: "石墨黑、白色、信号蓝",
      layoutStyle: "产品案例式叙事，突出问题、选择和结果",
      typography: "现代无衬线，清晰层级",
    },
    "technical-builder": {
      preset,
      tone: "精确、系统化、证据优先",
      density: "detailed",
      colorTheme: "炭黑、雾白、电光青",
      layoutStyle: "技术建设者叙事，突出系统、链路和可交付结果",
      typography: "紧凑无衬线，搭配技术感标注",
    },
    minimal: {
      preset,
      tone: "直接、干净、易读",
      density: "focused",
      colorTheme: "黑、白、中性灰",
      layoutStyle: "单列作品集，减少装饰，突出内容",
      typography: "安静的无衬线字体",
    },
    creative: {
      preset,
      tone: "有人味、故事感、表达鲜明",
      density: "balanced",
      colorTheme: "墨黑、白色、珊瑚红",
      layoutStyle: "杂志式职业故事，突出关键转折",
      typography: "更有识别度的标题和清爽正文",
    },
  };
  return styles[preset];
}

function inferStyle(text: string): CareerSiteStylePreset | null {
  if (includesAny(text, ["极简", "简洁", "干净", "克制", "minimal", "clean"])) return "minimal";
  if (includesAny(text, ["科技", "技术", "架构", "ai", "agent", "rag", "llm", "智能体", "大模型"])) return "technical-builder";
  if (includesAny(text, ["产品", "增长", "saas", "平台", "product", "pm"])) return "product-led";
  if (includesAny(text, ["高级", "高管", "管理", "负责人", "executive", "senior"])) return "executive";
  if (includesAny(text, ["创意", "设计", "品牌", "creative"])) return "creative";
  return null;
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

  const style = inferStyle(text);
  if (style) {
    draft = { ...draft, style: stylePatch(style) };
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
        summary: compact(changes.join(" ")),
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
