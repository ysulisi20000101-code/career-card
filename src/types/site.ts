import type { CareerSiteDraft } from "@/lib/agent/site-generator/types";

export interface PersonalSite {
  id: string;
  projectId: string;
  targetRole: string;
  draft: CareerSiteDraft | null;
  slug: string | null;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
