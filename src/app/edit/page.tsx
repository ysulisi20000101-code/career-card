"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyEditEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workspace/personal/new");
  }, [router]);

  return <div className="p-6 text-sm text-muted-foreground">正在跳转到新的工作台流程...</div>;
}
