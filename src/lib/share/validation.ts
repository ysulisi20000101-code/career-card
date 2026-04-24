import type {
  ResumeData,
  UserProfile,
  TimelineNode,
  SkillNode,
  ArchitectureModule,
  Education,
  RoleUnderstanding,
} from "@/types";
import { createDefaultRoleUnderstanding } from "@/lib/role-understanding/default";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeProfile(input: unknown): UserProfile {
  const profile = isRecord(input) ? input : {};
  return {
    id: asString(profile.id),
    name: asString(profile.name),
    email: asString(profile.email),
    phone: asString(profile.phone) || undefined,
    title: asString(profile.title) || undefined,
    summary: asString(profile.summary) || undefined,
    avatar: asString(profile.avatar) || undefined,
    location: asString(profile.location) || undefined,
    website: asString(profile.website) || undefined,
    linkedin: asString(profile.linkedin) || undefined,
  };
}

function sanitizeTimeline(input: unknown): TimelineNode[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isRecord)
    .map((node) => ({
      id: asString(node.id),
      company: asString(node.company),
      position: asString(node.position),
      startDate: asString(node.startDate),
      endDate: asString(node.endDate),
      description: asString(node.description),
      highlights: asStringArray(node.highlights),
      projects: Array.isArray(node.projects)
        ? node.projects
            .filter(isRecord)
            .map((project) => ({
              id: asString(project.id),
              name: asString(project.name),
              description: asString(project.description),
              role: asString(project.role),
              highlights: asStringArray(project.highlights),
              techStack: asStringArray(project.techStack),
            }))
        : [],
      skills: asStringArray(node.skills),
      order: asNumber(node.order),
    }))
    .filter((node) => node.id.length > 0);
}

function sanitizeSkills(input: unknown): SkillNode[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isRecord)
    .map((skill) => ({
      id: asString(skill.id),
      name: asString(skill.name),
      category: asString(skill.category),
      level: Math.max(1, Math.min(5, asNumber(skill.level, 1))),
      parentId: typeof skill.parentId === "string" ? skill.parentId : null,
      x: typeof skill.x === "number" ? skill.x : undefined,
      y: typeof skill.y === "number" ? skill.y : undefined,
    }))
    .filter((skill) => skill.id.length > 0);
}

function sanitizeArchitecture(input: unknown): ArchitectureModule[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isRecord)
    .map((module) => {
      const position = isRecord(module.position) ? module.position : {};
      const type: ArchitectureModule["type"] =
        module.type === "technical" ? "technical" : "business";
      const industry: ArchitectureModule["industry"] =
        module.industry === "automotive" || module.industry === "finance"
          ? module.industry
          : "internet";
      return {
        id: asString(module.id),
        title: asString(module.title),
        description: asString(module.description),
        type,
        industry,
        position: { x: asNumber(position.x), y: asNumber(position.y) },
        parentId: typeof module.parentId === "string" ? module.parentId : null,
        relatedTimelineIds: asStringArray(module.relatedTimelineIds),
      };
    })
    .filter((module) => module.id.length > 0);
}

function sanitizeEducation(input: unknown): Education[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(isRecord)
    .map((education) => ({
      id: asString(education.id),
      school: asString(education.school),
      degree: asString(education.degree),
      major: asString(education.major),
      startDate: asString(education.startDate),
      endDate: asString(education.endDate),
    }))
    .filter((education) => education.id.length > 0);
}

function sanitizeRoleUnderstanding(input: unknown): RoleUnderstanding {
  const role = isRecord(input) ? input : {};
  const fallback = createDefaultRoleUnderstanding();
  const priorityProblems = Array.isArray(role.priorityProblems)
    ? role.priorityProblems
        .filter(isRecord)
        .map((item, index) => ({
          id: asString(item.id) || `problem-${index + 1}`,
          problem: asString(item.problem),
          impact: asString(item.impact),
          evidence: asString(item.evidence) || undefined,
        }))
    : [];

  const mappings = Array.isArray(role.experienceMappings)
    ? role.experienceMappings
        .filter(isRecord)
        .map((item, index) => ({
          id: asString(item.id) || `mapping-${index + 1}`,
          requirement: asString(item.requirement),
          myExperience: asString(item.myExperience),
          outcomeEvidence: asString(item.outcomeEvidence),
        }))
    : [];

  const plan = isRecord(role.ninetyDayPlan) ? role.ninetyDayPlan : {};

  return {
    targetRoleTitle: asString(role.targetRoleTitle),
    companyContext: asString(role.companyContext) || undefined,
    oneLineInterpretation: asString(role.oneLineInterpretation),
    priorityProblems: priorityProblems.length > 0 ? priorityProblems : fallback.priorityProblems,
    ninetyDayPlan: {
      day0To30: asString(plan.day0To30),
      day31To60: asString(plan.day31To60),
      day61To90: asString(plan.day61To90),
    },
    experienceMappings: mappings.length > 0 ? mappings : fallback.experienceMappings,
  };
}

export function sanitizeResumeData(input: unknown): ResumeData | null {
  if (!isRecord(input)) return null;

  const profile = sanitizeProfile(input.profile);
  const timeline = sanitizeTimeline(input.timeline);
  const skills = sanitizeSkills(input.skills);
  const architecture = sanitizeArchitecture(input.architecture);
  const education = sanitizeEducation(input.education);
  const roleUnderstanding = sanitizeRoleUnderstanding(input.roleUnderstanding);

  if (!profile.name && timeline.length === 0 && skills.length === 0 && education.length === 0) {
    return null;
  }

  return { profile, timeline, skills, architecture, education, roleUnderstanding };
}
