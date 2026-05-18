import type { ResumeData } from "@/types";
import type { InterviewProjectData, PersonalSiteData } from "@/types/project";

export function personalToResumeData(data: PersonalSiteData): ResumeData {
  return data;
}

export function resumeDataToPersonal(data: ResumeData): PersonalSiteData {
  return data;
}

export function interviewToResumeData(data: InterviewProjectData): ResumeData {
  return {
    ...data.resume,
    roleUnderstanding: data.roleUnderstanding,
  };
}

export function resumeDataToInterview(
  data: ResumeData,
  existingNotes?: string,
  extras?: { presentationDraftId?: string },
): InterviewProjectData {
  return {
    resume: data,
    roleUnderstanding: data.roleUnderstanding,
    interviewNotes: existingNotes ?? "",
    presentationDraftId: extras?.presentationDraftId,
  };
}
