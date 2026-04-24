import type { ResumeData, RoleUnderstanding } from "@/types";

export type PersonalSiteData = Omit<ResumeData, "roleUnderstanding">;

export interface InterviewProjectData {
  resume: ResumeData;
  roleUnderstanding: RoleUnderstanding;
  interviewNotes: string;
}

export interface ProjectRecord {
  id: string;
  type: "personal" | "interview";
  title: string;
  status: "draft" | "published";
  updatedAt: string;
}
