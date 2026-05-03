import type { Metadata } from "next";
import { headers } from "next/headers";
import { ShareView } from "@/components/share/share-view";
import { ErrorBoundary } from "@/components/error-boundary";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const hdrs = await headers();
    const host = hdrs.get("host") || process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") || "";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    const res = await fetch(`${baseUrl}/api/published-sites/${slug}`, { cache: "no-store" });
    if (!res.ok) return { title: "Career Card" };
    const payload = await res.json();
    const profile = payload.site?.resumeData?.profile ?? payload.site?.profile;
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
