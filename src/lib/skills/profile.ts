import type {
  ResumeData,
  RoleSkillTemplate,
  SkillMatch,
  SkillNode,
  SkillProfile,
  TimelineNode,
} from "@/types";
import { roleSkillTemplates } from "@/lib/templates";

interface BuildSkillProfileInput {
  text: string;
  timeline?: TimelineNode[];
  profileTitle?: string;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function includesAny(text: string, values: string[]): boolean {
  const normalizedText = normalize(text);
  return values.some((value) => normalizedText.includes(normalize(value)));
}

function scoreTemplate(template: RoleSkillTemplate, input: BuildSkillProfileInput): number {
  const text = `${input.profileTitle ?? ""} ${input.text}`;
  let score = 0;
  for (const alias of template.aliases) {
    if (includesAny(text, [alias])) score += 6;
  }
  for (const category of template.categories) {
    for (const skill of category.skills) {
      if (includesAny(text, [skill.name, ...skill.aliases])) {
        score += skill.importance === "core" ? 3 : 2;
      }
    }
  }
  return score;
}

export function detectRoleTemplate(input: BuildSkillProfileInput): RoleSkillTemplate {
  const ranked = roleSkillTemplates
    .map((template) => ({ template, score: scoreTemplate(template, input) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.template ?? roleSkillTemplates[0];
}

function findSkillSources(
  skillName: string,
  aliases: string[],
  text: string,
  timeline: TimelineNode[],
): Pick<SkillMatch, "status" | "sourceTimelineIds" | "sourceSnippets"> {
  const terms = [skillName, ...aliases];
  const sourceTimelineIds: string[] = [];
  const sourceSnippets: string[] = [];

  for (const node of timeline) {
    const nodeText = [
      node.company,
      node.position,
      node.description,
      ...node.highlights,
      ...node.skills,
    ].join(" ");
    if (includesAny(nodeText, terms)) {
      sourceTimelineIds.push(node.id);
      sourceSnippets.push(
        node.highlights.find((highlight) => includesAny(highlight, terms)) ||
          node.description ||
          node.position,
      );
    }
  }

  if (sourceTimelineIds.length > 0) {
    return { status: "owned", sourceTimelineIds, sourceSnippets: sourceSnippets.slice(0, 3) };
  }
  if (includesAny(text, terms)) {
    return { status: "inferred", sourceTimelineIds: [], sourceSnippets: [skillName] };
  }
  return { status: "missing", sourceTimelineIds: [], sourceSnippets: [] };
}

export function buildSkillProfile(input: BuildSkillProfileInput): SkillProfile {
  const timeline = input.timeline ?? [];
  const template = detectRoleTemplate(input);
  const text = `${input.profileTitle ?? ""} ${input.text} ${timeline
    .map((node) => [node.company, node.position, node.description, ...node.highlights, ...node.skills].join(" "))
    .join(" ")}`;

  const categories = template.categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    matches: category.skills.map((skill) => {
      const sources = findSkillSources(skill.name, skill.aliases, text, timeline);
      return {
        skillId: skill.id,
        name: skill.name,
        categoryId: category.id,
        categoryName: category.name,
        status: sources.status,
        importance: skill.importance,
        sourceTimelineIds: sources.sourceTimelineIds,
        sourceSnippets: sources.sourceSnippets,
      };
    }),
  }));

  const allMatches = categories.flatMap((category) => category.matches);
  const ownedMatches = allMatches.filter((match) => match.status !== "missing");
  const coreMatches = allMatches.filter((match) => match.importance === "core");
  const coreOwnedMatches = coreMatches.filter((match) => match.status !== "missing");

  return {
    templateId: template.templateId,
    roleName: template.roleName,
    confidence: Math.min(95, Math.max(35, Math.round((ownedMatches.length / Math.max(allMatches.length, 1)) * 100 + 35))),
    categories,
    coverage: {
      owned: ownedMatches.length,
      total: allMatches.length,
      coreOwned: coreOwnedMatches.length,
      coreTotal: coreMatches.length,
      percent: Math.round((ownedMatches.length / Math.max(allMatches.length, 1)) * 100),
    },
    detectedSkillNames: ownedMatches.map((match) => match.name),
  };
}

export function buildSkillProfileFromResume(data: ResumeData): SkillProfile {
  return buildSkillProfile({
    text: [
      data.profile.name,
      data.profile.title,
      data.profile.summary,
      data.skills.map((skill) => skill.name).join(" "),
    ].join(" "),
    timeline: data.timeline,
    profileTitle: data.profile.title,
  });
}

export function buildSkillNodesFromProfile(profile: SkillProfile): SkillNode[] {
  const rootId = "skill-root";
  const nodes: SkillNode[] = [
    {
      id: rootId,
      name: `${profile.roleName}能力地图`,
      category: "root",
      level: 5,
      parentId: null,
      status: "owned",
      importance: "core",
    },
  ];

  for (const category of profile.categories) {
    const categoryId = `category-${category.id}`;
    const ownedCount = category.matches.filter((match) => match.status !== "missing").length;
    nodes.push({
      id: categoryId,
      name: category.name,
      category: category.name,
      level: Math.max(2, Math.min(5, ownedCount + 1)),
      parentId: rootId,
      status: ownedCount > 0 ? "owned" : "missing",
      importance: "core",
    });

    for (const match of category.matches) {
      nodes.push({
        id: `skill-${match.skillId}`,
        name: match.name,
        category: category.name,
        level: match.importance === "core" ? 5 : match.importance === "important" ? 4 : 3,
        parentId: categoryId,
        status: match.status,
        importance: match.importance,
        sourceTimelineIds: match.sourceTimelineIds,
        sourceSnippets: match.sourceSnippets,
      });
    }
  }

  return nodes;
}
