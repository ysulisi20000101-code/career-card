import type { ResumeData } from "@/types";
import type { PublishedSnapshotV2 } from "@/lib/share/published-snapshot";
import { buildSkillNodesFromProfile, buildSkillProfileFromResume } from "@/lib/skills/profile";
import { sanitizeResumeData } from "@/lib/share/validation";

export function buildPublishSnapshot(data: ResumeData): ResumeData | null {
  const skillProfile = data.skillProfile ?? buildSkillProfileFromResume(data);
  return sanitizeResumeData({
    ...data,
    skillProfile,
    roleTemplateId: data.roleTemplateId ?? skillProfile.templateId,
    skills: data.skills?.length ? data.skills : buildSkillNodesFromProfile(skillProfile),
    publishedAt: new Date().toISOString(),
  });
}

export function buildPublishedSnapshotV2(params: {
  slug: string;
  data: ResumeData;
  now?: Date;
}): PublishedSnapshotV2 | null {
  const resumeData = buildPublishSnapshot(params.data);
  if (!resumeData) return null;
  return {
    schemaVersion: 2,
    slug: params.slug,
    version: 1,
    publishedAt: (params.now ?? new Date()).toISOString(),
    resumeData,
  };
}
