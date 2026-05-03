import type { ResumeData, RoleUnderstanding } from "@/types";

export type PersonalSiteData = ResumeData;

export interface InterviewProjectData {
  resume: ResumeData;
  roleUnderstanding: RoleUnderstanding;
  interviewNotes: string;
  presentationDraftId?: string;
}

export interface ProjectRecord {
  id: string;
  type: "personal" | "interview";
  title: string;
  status: "draft" | "published" | "archived";
  updatedAt: string;
  createdAt: string;
  siteIds: string[];
  /** @deprecated use per-site slug on PersonalSite */
  publishedSlug?: string;
  /** @deprecated use per-site publishedAt on PersonalSite */
  publishedAt?: string;
  _prevStatus?: string;
}
