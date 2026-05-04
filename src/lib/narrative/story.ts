import type { StoryMood, TimelineNode } from "@/types";
import { formatDate } from "@/lib/utils";
import { clean } from "@/lib/utils-helpers";

export interface TimelineStory {
  title: string;
  scene: string;
  challenge: string;
  action: string;
  outcome: string;
  reflection: string;
  evidenceProblem: string;
  evidenceAction: string;
  evidenceResult: string;
  evidenceProof: string;
  mood: StoryMood;
  period: string;
}

export const STORY_MOODS: StoryMood[] = ["focus", "growth", "breakthrough", "craft", "impact"];

export const STORY_MOOD_LABELS: Record<StoryMood, string> = {
  focus: "聚焦",
  growth: "成长",
  breakthrough: "突破",
  craft: "打磨",
  impact: "影响",
};

export const STORY_MOOD_STYLES: Record<
  StoryMood,
  { page: string; accent: string; soft: string; text: string; glow: string }
> = {
  focus: {
    page: "from-slate-950 via-slate-900 to-cyan-950",
    accent: "from-cyan-300 to-blue-400",
    soft: "bg-cyan-50 text-cyan-700 border-cyan-100",
    text: "text-cyan-200",
    glow: "bg-cyan-400/20",
  },
  growth: {
    page: "from-emerald-950 via-stone-950 to-zinc-950",
    accent: "from-emerald-300 to-lime-300",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-100",
    text: "text-emerald-200",
    glow: "bg-emerald-400/20",
  },
  breakthrough: {
    page: "from-zinc-950 via-indigo-950 to-rose-950",
    accent: "from-rose-300 to-indigo-300",
    soft: "bg-rose-50 text-rose-700 border-rose-100",
    text: "text-rose-200",
    glow: "bg-rose-400/20",
  },
  craft: {
    page: "from-zinc-950 via-neutral-900 to-amber-950",
    accent: "from-amber-200 to-orange-300",
    soft: "bg-amber-50 text-amber-800 border-amber-100",
    text: "text-amber-200",
    glow: "bg-amber-300/20",
  },
  impact: {
    page: "from-slate-950 via-violet-950 to-fuchsia-950",
    accent: "from-violet-300 to-fuchsia-300",
    soft: "bg-violet-50 text-violet-700 border-violet-100",
    text: "text-violet-200",
    glow: "bg-violet-400/20",
  },
};

function firstMeaningful(values: Array<string | undefined>): string {
  return values.map(clean).find(Boolean) ?? "";
}

function highlight(node: TimelineNode, index: number): string {
  return clean(node.highlights[index]);
}

function coreWork(node: TimelineNode): string {
  return firstMeaningful([node.position, node.description.slice(0, 24), "核心工作"]);
}

function defaultReflection(node: TimelineNode): string {
  const skills = node.skills.map(clean).filter(Boolean).slice(0, 3);
  if (skills.length > 0) return `这段经历让我把 ${skills.join("、")} 放进真实业务场景中验证。`;
  return `${clean(node.company) || "这段经历"}让我进一步校准了产品判断、协作节奏和交付边界。`;
}

export function resolveStoryMood(node: TimelineNode, index = 0): StoryMood {
  if (node.storyMood && STORY_MOODS.includes(node.storyMood)) return node.storyMood;
  return STORY_MOODS[index % STORY_MOODS.length];
}

export function buildTimelineStory(node: TimelineNode, index = 0): TimelineStory {
  const company = clean(node.company) || "这段经历";
  const work = coreWork(node);
  const description = clean(node.description);
  const challenge = highlight(node, 0);
  const action = highlight(node, 1);
  const outcome = highlight(node, 2);
  const proof = [node.company, node.position, node.skills.slice(0, 3).join("、")].filter(Boolean).join(" · ");

  return {
    title: clean(node.storyTitle) || `${company}｜${work}`,
    scene: firstMeaningful([node.storyScene, description, `${company}，${work}`]),
    challenge: firstMeaningful([node.storyChallenge, challenge, description, `${work}中的关键问题需要被拆清楚。`]),
    action: firstMeaningful([node.storyAction, action, `围绕 ${work} 做需求拆解、方案设计和交付推进。`]),
    outcome: firstMeaningful([node.storyOutcome, outcome, description, `${company} 的工作沉淀为可复用的产品经验。`]),
    reflection: clean(node.storyReflection) || defaultReflection(node),
    evidenceProblem: firstMeaningful([node.evidenceProblem, challenge, description]),
    evidenceAction: firstMeaningful([node.evidenceAction, action, `围绕 ${work} 推进方案落地。`]),
    evidenceResult: firstMeaningful([node.evidenceResult, outcome, description]),
    evidenceProof: firstMeaningful([node.evidenceProof, proof]),
    mood: resolveStoryMood(node, index),
    period: `${formatDate(node.startDate)} - ${formatDate(node.endDate)}`,
  };
}
