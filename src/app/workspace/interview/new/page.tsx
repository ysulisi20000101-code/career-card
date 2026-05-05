"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createProjectRecord } from "@/lib/projects/registry";
import { BrandLogo } from "@/components/shell/brand-logo";

export default function NewInterviewProjectPage() {
  const [error, setError] = useState(false);
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    try {
      const now = new Date();
      const name = `面试演示 ${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const record = createProjectRecord("interview", name);
      window.location.href = `/workspace/interview/${record.id}/edit`;
    } catch (err) {
      console.error("[career-card] Failed to create interview project:", err);
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
              无法创建面试空间项目，请检查浏览器存储设置后重试。
            </p>
            <Link href="/workspace" className="mt-4 text-sm text-indigo-600 hover:underline">
              返回工作台
            </Link>
          </>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-200/50 to-amber-200/50 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">正在创建面试空间项目</h1>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              面试空间能独立管理岗位理解与讲述节奏，稍后会自动进入编辑页。
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
