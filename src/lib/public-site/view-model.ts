import type { ResumeData } from "@/types";
import { buildPublicSiteContent } from "@/lib/public-site/content";

export function buildPublicSiteViewModel(data: ResumeData) {
  return buildPublicSiteContent(data);
}
