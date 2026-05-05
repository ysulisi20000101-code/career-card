"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createProjectRecord, listProjectRecords } from "@/lib/projects/registry";
import { BrandLogo } from "@/components/shell/brand-logo";

export default function NewInterviewProjectPage() {
  const [error, setError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [latestId, setLatestId] = useState<string | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    try {
      const now = new Date();
      const name = `面试演示 ${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      const record = createProjectRecord("interview", name);
      queueMicrotask(() => setLatestId(record.id));
      window.location.href = `/workspace/interview/${record.id}/edit`;
    } catch (err) {
      console.error("[career-card] Failed to create interview project:", err);
      const records = listProjectRecords();
      const interviews = records.filter((r) => r.type === "interview");
      if (interviews.length > 0) {
        queueMicrotask(() => setLatestId(interviews[0].id));
      }
      queueMicrotask(() => setError(true));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 3000);
    return () => clearTimeout(timer);
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
            <div className="mt-6 flex flex-col gap-3">
              {latestId && (
                <Link href={`/workspace/interview/${latestId}/edit`}>
                  <Button variant="brand" className="gap-2 rounded-full px-6">
                    进入面试演示编辑页
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/workspace/interview/new" className="text-sm text-indigo-600 hover:underline">
                重试
              </Link>
              <Link href="/workspace" className="text-sm text-zinc-400 hover:text-zinc-600">
                返回工作台
              </Link>
            </div>
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
            {showFallback && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-zinc-500">如果没有自动跳转，请点击下方按钮</p>
                {latestId ? (
                  <Link href={`/workspace/interview/${latestId}/edit`}>
                    <Button variant="brand" className="gap-2 rounded-full px-6">
                      进入面试演示编辑页
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="brand"
                    className="gap-2 rounded-full px-6"
                    onClick={() => {
                      try {
                        const now = new Date();
                        const name = `面试演示 ${now.getMonth()+1}/${now.getDate()}`;
                        const record = createProjectRecord("interview", name);
                        window.location.href = `/workspace/interview/${record.id}/edit`;
                      } catch {
                        setError(true);
                      }
                    }}
                  >
                    重试创建
                  </Button>
                )}
              </div>
            )}
            <Link href="/workspace" className="mt-4 text-sm text-zinc-400 hover:text-zinc-600">
              取消
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
