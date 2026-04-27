import type { ResumeData } from "@/types";
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
