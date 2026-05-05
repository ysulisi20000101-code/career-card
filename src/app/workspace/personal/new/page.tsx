"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createProjectRecord } from "@/lib/projects/registry";
import { BrandLogo } from "@/components/shell/brand-logo";

export default function NewPersonalProjectPage() {
  const createdRef = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    try {
      const record = createProjectRecord("personal", "职业档案草稿");
      // Use full page navigation instead of client-side routing for reliability on EdgeOne
      window.location.href = `/workspace/personal/${record.id}/edit`;
    } catch (err) {
      console.error("[career-card] Failed to create personal project:", err);
      queueMicrotask(() => setError(true));
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 via-white to-white">
      <header className="border-b border-zinc-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <BrandLogo />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-zinc-900">创建失败</h1>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              无法创建职业档案草稿，请检查浏览器存储设置后重试。
            </p>
            <Link href="/workspace" className="mt-4 text-sm text-indigo-600 hover:underline">
              返回工作台
            </Link>
          </>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">正在创建职业档案草稿</h1>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              稍后会进入上传与校准流程。
            </p>
            <Link href="/workspace" className="mt-4 text-sm text-zinc-400 hover:text-zinc-600">
              取消
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
