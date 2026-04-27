"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createProjectRecord } from "@/lib/projects/registry";
import { BrandLogo } from "@/components/shell/brand-logo";

export default function NewPersonalProjectPage() {
  const router = useRouter();

  useEffect(() => {
    const record = createProjectRecord("personal", "职业档案草稿");
    router.replace(`/workspace/personal/${record.id}/edit`);
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
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">正在创建职业档案草稿</h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          稍后会进入上传与校准流程。
        </p>
      </main>
    </div>
  );
}
