"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { createSite, loadPersonalProject } from "@/lib/projects/registry";
import { BrandLogo } from "@/components/shell/brand-logo";
import { Button } from "@/components/ui/button";
import { useClientValue } from "@/hooks/use-client-value";

export default function NewSitePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const { value: hasResume, loading } = useClientValue(() => {
    const data = loadPersonalProject(projectId);
    return data !== null;
  }, false, [projectId]);

  const [targetRole, setTargetRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmedRole = targetRole.trim();
    if (!trimmedRole) {
      setError("请输入目标岗位。");
      return;
    }
    setError("");

    // 只创建站点记录，草稿生成由 Agent 工作台负责
    const site = createSite(projectId, {
      targetRole: trimmedRole,
      jdText: jdText.trim() || undefined,
    });

    router.push(`/workspace/personal/${projectId}/sites/${site.id}`);
  };

  if (loading) {
    return (
      <LoadingPage />
    );
  }

  if (!hasResume) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 to-white">
        <header className="border-b border-zinc-100 bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
            <BrandLogo />
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">请先上传简历</h1>
          <p className="mt-2 text-sm text-zinc-500">
            创建站点需要有简历数据作为基础。
          </p>
          <Link href={`/workspace/personal/${projectId}/edit`} className="mt-4">
            <Button variant="brand" className="gap-1.5 rounded-full">
              前往上传简历
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <BrandLogo />
          <Link href={`/workspace/personal/${projectId}/preview`} className="text-xs text-zinc-500 hover:text-zinc-900">
            返回
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-xs font-medium text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              新建目标站点
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-zinc-950">
              基于你的简历创建一个目标岗位站点
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              同一份简历可以创建多个站点，每个站点针对不同的目标岗位进行优化。
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="targetRole" className="block text-sm font-medium text-zinc-800">
                目标岗位 <span className="text-red-400">*</span>
              </label>
              <p className="mt-1 text-xs text-zinc-400">
                例如：AI Agent 产品经理、技术产品负责人、增长产品经理
              </p>
              <input
                id="targetRole"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="输入目标岗位名称"
                maxLength={80}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              />
            </div>

            <div>
              <label htmlFor="jdText" className="block text-sm font-medium text-zinc-800">
                岗位描述 (JD) <span className="text-xs font-normal text-zinc-400">可选</span>
              </label>
              <p className="mt-1 text-xs text-zinc-400">
                粘贴目标岗位的 JD 全文，Agent 会据此优化网站定位和叙事重点。
              </p>
              <textarea
                id="jdText"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="粘贴 JD 全文..."
                rows={8}
                maxLength={5000}
                className="mt-2 w-full resize-none rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-right text-[11px] text-zinc-400">
                {jdText.length} / 5000
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Link href={`/workspace/personal/${projectId}/preview`}>
                <Button variant="outline" className="gap-1.5 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>
              </Link>
              <Button
                variant="brand"
                className="gap-1.5 rounded-full"
                onClick={handleSubmit}
                disabled={!targetRole.trim()}
              >
                <Plus className="h-4 w-4" />
                创建站点
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
