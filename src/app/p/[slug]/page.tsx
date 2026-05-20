import type { Metadata } from "next";
import { ShareView } from "@/components/share/share-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { createLocalPublishedSiteRepository, normalizeSlug } from "@/lib/share/published-site-repository";
import { getSnapshotResumeData } from "@/lib/share/published-snapshot";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const normalized = normalizeSlug(slug);
    if (!normalized) return { title: "Career Card" };

    const repo = createLocalPublishedSiteRepository();
    const site = await repo.find(normalized);
    if (!site) return { title: "Career Card" };

    const resumeData = getSnapshotResumeData(site);
    const profile = resumeData.profile;
    const name = profile?.name || "候选人";
    const title = profile?.title || "";
    return {
      title: `${name} - Career Card`,
      description: title ? `${name}的${title}职业档案` : `${name}的职业档案`,
      openGraph: { title: `${name} - Career Card`, description: title || "职业档案" },
    };
  } catch {
    return { title: "Career Card" };
  }
}

export default function SharedResumePage() {
  return (
    <ErrorBoundary>
      <ShareView />
    </ErrorBoundary>
  );
}
