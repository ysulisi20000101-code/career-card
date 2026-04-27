import type { TimelineNode } from "@/types";
import { formatDate } from "@/lib/utils";
import { buildTimelineStory, type TimelineStory } from "@/lib/narrative/story";

const MIN_DATE = -8640000000000000;

function timestamp(value: string): number {
  if (/至今|现在|present|now/i.test(value)) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? MIN_DATE : parsed;
}

export function getNarrativeTimeline(nodes: TimelineNode[]): TimelineNode[] {
  return [...nodes].sort((a, b) => {
    const diff = timestamp(a.startDate) - timestamp(b.startDate);
    if (diff !== 0) return diff;
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.id.localeCompare(b.id);
  });
}

export function inferCareerKind(node: TimelineNode): "internship" | "fulltime" {
  if (node.careerKind) return node.careerKind;
  const text = [node.company, node.position, node.description, ...node.highlights].join(" ");
  return /实习|intern|internship/i.test(text) ? "internship" : "fulltime";
}

export interface EarlyExploration {
  id: string;
  period: string;
  title: string;
  story: TimelineStory;
  nodes: TimelineNode[];
  skills: string[];
}

export interface NarrativeSequence {
  earlyExploration: EarlyExploration | null;
  careerNodes: TimelineNode[];
  latestCareerNode: TimelineNode | null;
  allItemsCount: number;
}

function joinList(values: string[], fallback: string): string {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.slice(0, 4).join("、") : fallback;
}

export function buildEarlyExploration(nodes: TimelineNode[]): EarlyExploration | null {
  if (nodes.length === 0) return null;
  const ordered = getNarrativeTimeline(nodes);
  const skills = Array.from(new Set(ordered.flatMap((node) => node.skills))).slice(0, 8);
  const companies = ordered.map((node) => node.company).filter(Boolean);
  const highlights = ordered.flatMap((node) => node.highlights).filter(Boolean);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const companyText = joinList(companies, "早期业务场景");
  const skillText = joinList(skills, "后台产品、数据分析和用户路径优化");
  const firstHighlight = highlights[0] || `在 ${companyText} 中参与真实业务问题拆解。`;
  const secondHighlight = highlights[1] || `围绕 ${skillText} 建立早期产品工作方法。`;
  const thirdHighlight = highlights[2] || "把具体执行经验沉淀为后续平台产品工作的业务敏感度。";

  const synthetic: TimelineNode = {
    id: "early-exploration",
    company: companyText,
    position: "早期业务训练",
    startDate: first.startDate,
    endDate: last.endDate,
    description: `${companyText} 的经历，让我在不同业务场景中训练 ${skillText}。`,
    highlights: [firstHighlight, secondHighlight, thirdHighlight],
    projects: [],
    skills,
    order: -1,
    careerKind: "internship",
    storyTitle: "产品能力的早期底色",
    storyScene: `${companyText} 的早期经历，让我在不同业务场景中反复训练 ${skillText}。`,
    storyChallenge: "当时的重点是快速进入业务现场，理解用户路径、运营机制、后台流程和数据口径。",
    storyAction: "我从具体模块和流程入手，参与产品迭代、后台建设、权益机制、数据看板和用户路径优化。",
    storyOutcome: "这些经历不是履历中最重的部分，却构成了我后来做复杂平台产品时的业务敏感度。",
    storyReflection: "早期训练让我确认了一件事：产品判断不是凭空产生的，它来自足够多的业务现场、用户路径和交付细节。",
    evidenceProblem: "需要在不同业务环境中快速理解真实问题。",
    evidenceAction: "参与产品迭代、后台流程、权益机制和数据分析等具体工作。",
    evidenceResult: "形成了进入社招阶段后持续复用的业务理解、沟通协作和交付意识。",
    evidenceProof: [companyText, skillText].filter(Boolean).join(" · "),
    storyMood: "growth",
  };

  return {
    id: synthetic.id,
    period: `${formatDate(first.startDate)} - ${formatDate(last.endDate)}`,
    title: "产品能力的早期底色",
    story: buildTimelineStory(synthetic, 0),
    nodes: ordered,
    skills,
  };
}

export function buildNarrativeSequence(nodes: TimelineNode[]): NarrativeSequence {
  const ordered = getNarrativeTimeline(nodes);
  const internshipNodes = ordered.filter((node) => inferCareerKind(node) === "internship");
  const careerNodes = ordered.filter((node) => inferCareerKind(node) === "fulltime");
  return {
    earlyExploration: buildEarlyExploration(internshipNodes),
    careerNodes,
    latestCareerNode: careerNodes.at(-1) ?? null,
    allItemsCount: careerNodes.length + (internshipNodes.length > 0 ? 1 : 0),
  };
}
