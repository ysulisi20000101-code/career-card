import type { ResumeData } from "@/types";
import type { InterviewProjectData, PersonalSiteData } from "@/types/project";
import { createDefaultRoleUnderstanding } from "@/lib/role-understanding/default";

export function personalToResumeData(data: PersonalSiteData): ResumeData {
  return {
    ...data,
    roleUnderstanding: createDefaultRoleUnderstanding(data.timeline[0]?.position ?? ""),
  };
}

export function resumeDataToPersonal(data: ResumeData): PersonalSiteData {
  const { roleUnderstanding, ...rest } = data;
  void roleUnderstanding;
  return rest;
}

export function interviewToResumeData(data: InterviewProjectData): ResumeData {
  return {
    ...data.resume,
    roleUnderstanding: data.roleUnderstanding,
  };
}

export function resumeDataToInterview(data: ResumeData): InterviewProjectData {
  return {
    resume: data,
    roleUnderstanding: data.roleUnderstanding,
    interviewNotes: "",
  };
}
