"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/loading";
import {
  loadPersonalProject,
  listSitesByProject,
  migrateProjectToMultiSite,
} from "@/lib/projects/registry";
import { useClientValue } from "@/hooks/use-client-value";

export default function PersonalPreviewRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const { value: defaultSiteId, loading } = useClientValue(() => {
    // Auto-migrate if needed
    const legacy = loadPersonalProject(projectId);
    if (legacy) {
      const existingSites = listSitesByProject(projectId);
      if (existingSites.length === 0) {
        migrateProjectToMultiSite(projectId);
      }
    }
    // Find first non-archived site
    const sites = listSitesByProject(projectId);
    const active = sites.find((s) => s.status !== "archived");
    return active?.id ?? sites[0]?.id ?? null;
  }, null, [projectId]);

  useEffect(() => {
    if (loading) return;
    if (defaultSiteId) {
      router.replace(`/workspace/personal/${projectId}/sites/${defaultSiteId}`);
    }
  }, [loading, defaultSiteId, projectId, router]);

  if (loading) {
    return (
      <LoadingPage />
    );
  }

  // Fallback: no sites created, go to edit page
  if (!defaultSiteId) {
    return (
      <LoadingPage />
    );
  }

  return (
    <LoadingPage />
  );
}
