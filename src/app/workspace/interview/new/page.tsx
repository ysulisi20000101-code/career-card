"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createProjectRecord } from "@/lib/projects/registry";
import { BrandLogo } from "@/components/shell/brand-logo";

export default function NewInterviewProjectPage() {
  const router = useRouter();

  useEffect(() => {
    const record = createProjectRecord("interview", "面试空间项目");
    router.replace(`/workspace/interview/${record.id}/edit`);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 via-white to-white">
      <header className="border-b border-zinc-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <BrandLogo />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-200/50 to-amber-200/50 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">正在创建面试空间项目</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          面试空间能独立管理岗位理解与讲述节奏，稍后会自动进入编辑页。
        </p>
      </main>
    </div>
  );
}
