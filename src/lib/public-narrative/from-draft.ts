import type { ResumeData } from "@/types";

function hashText(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

export function getResumeRevision(data: ResumeData): string {
  return hashText(
    JSON.stringify({
      profile: data.profile,
      timeline: data.timeline,
      skills: data.skills,
      education: data.education,
      roleUnderstanding: data.roleUnderstanding,
      publicSiteTemplate: data.publicSiteTemplate,
      siteThemeId: data.siteThemeId,
    }),
  );
}
