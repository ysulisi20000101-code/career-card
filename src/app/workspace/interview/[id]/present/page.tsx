"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Sparkles, Zap } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { useResumeStore } from "@/store/resume-store";
import { loadInterviewProject, saveInterviewProject } from "@/lib/projects/registry";
import { interviewToResumeData } from "@/lib/projects/adapters";
import { loadPresentationDraft, savePresentationDraft } from "@/lib/presentation/storage";
import { generatePresentationDraft } from "@/lib/presentation/generator";
import type { PresentationDraft } from "@/lib/presentation/types";
import type { PresentationEnhancementResult } from "@/lib/agent/presentation/types";
import { PresentationShell } from "@/components/presentation/story-deck/presentation-shell";
import { useClientValue } from "@/hooks/use-client-value";

type GenerateMode = "rules" | "ai";

interface LoadedState {
  interviewData: NonNullable<ReturnType<typeof loadInterviewProject>>;
  draft: PresentationDraft;
}

function loadOrGenerate(id: string): LoadedState | null {
  try {
    const interviewData = loadInterviewProject(id);
    if (!interviewData) return null;

    let draft: PresentationDraft | null = null;

    if (interviewData.presentationDraftId) {
      draft = loadPresentationDraft(interviewData.presentationDraftId);
    }

    if (!draft) {
      const resumeData = interviewToResumeData(interviewData);
      draft = generatePresentationDraft(resumeData);
      savePresentationDraft(draft);
      saveInterviewProject(id, { ...interviewData, presentationDraftId: draft.id });
    }

    return { interviewData, draft };
  } catch (e) {
    console.error("[career-card] Failed to load or generate presentation:", e);
    return null;
  }
}

export default function InterviewPresentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const setResumeData = useResumeStore((s) => s.setResumeData);

  const { value: loaded, loading } = useClientValue(() => loadOrGenerate(id), null, [id]);
  const [draft, setDraft] = useState<PresentationDraft | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [mode, setMode] = useState<GenerateMode>("rules");
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) {
      setResumeData(interviewToResumeData(loaded.interviewData));
      setDraft(loaded.draft);
    }
  }, [loaded, setResumeData]);

  const handleRegenerate = useCallback(() => {
    setRegenerating(true);
    setEnhanceError(null);
    const interviewData = loadInterviewProject(id);
    if (!interviewData) return;
    const resumeData = interviewToResumeData(interviewData);
    const newDraft = generatePresentationDraft(resumeData);
    savePresentationDraft(newDraft);
    saveInterviewProject(id, { ...interviewData, presentationDraftId: newDraft.id });
    setDraft(newDraft);
    setRegenerating(false);
  }, [id]);

  const handleAIEnhance = useCallback(async () => {
    const interviewData = loadInterviewProject(id);
    if (!interviewData || !draft) return;

    setEnhancing(true);
    setEnhanceError(null);

    try {
      const resumeData = interviewToResumeData(interviewData);
      const res = await fetch("/api/agent/interview-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, baseline: draft, mode: "enhance" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const result: PresentationEnhancementResult = await res.json();

      // Save enhanced draft
      savePresentationDraft(result.draft);
      saveInterviewProject(id, { ...interviewData, presentationDraftId: result.draft.id });
      setDraft(result.draft);

      if (result.issues.length > 0) {
        console.warn("[career-card] AI enhancement issues:", result.issues);
      }
      if (result.trace.status === "fallback" || result.trace.status === "exhausted") {
        setEnhanceError(result.trace.note ?? "AI 增强不可用，已使用基线版本。");
      }
    } catch (e) {
      console.error("[career-card] AI enhancement failed:", e);
      setEnhanceError(e instanceof Error ? e.message : "AI 增强失败，当前显示基线版本。");
    } finally {
      setEnhancing(false);
    }
  }, [id, draft]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!loaded || !draft) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">项目未找到</p>
          <p className="mt-2 text-sm text-zinc-500">该项目可能已被删除。</p>
          <Link href="/workspace" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            返回工作台
          </Link>
        </div>
      </div>
    );
  }

  const isProcessing = regenerating || enhancing;

  return (
    <div className="relative">
      {/* Top-right controls */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        {/* Mode toggle */}
        <div className="flex rounded-full border border-zinc-300 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setMode("rules")}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === "rules"
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
            disabled={isProcessing}
          >
            <Zap className="h-3 w-3" />
            快速
          </button>
          <button
            onClick={() => {
              setMode("ai");
              handleAIEnhance();
            }}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === "ai"
                ? "bg-violet-600 text-white"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
            disabled={isProcessing}
          >
            <Sparkles className="h-3 w-3" />
            AI 精修
          </button>
        </div>

        {/* Regenerate */}
        <button
          onClick={() => {
            handleRegenerate();
            if (mode === "ai") {
              // Will re-trigger after state update — handled by useEffect below
              setTimeout(() => handleAIEnhance(), 100);
            }
          }}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
          重新生成
        </button>
      </div>

      {/* AI enhancement loading overlay */}
      {enhancing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-xl bg-white px-8 py-6 text-center shadow-2xl">
            <Sparkles className="mx-auto h-8 w-8 animate-pulse text-violet-600" />
            <p className="mt-3 text-sm font-semibold text-zinc-800">AI 正在优化叙事...</p>
            <p className="mt-1 text-xs text-zinc-500">分析简历数据、构建战略叙事、生成可视化</p>
          </div>
        </div>
      )}

      {/* Enhance error notice */}
      {enhanceError && (
        <div className="absolute left-4 right-4 top-16 z-[60] mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">
          {enhanceError}
          <button
            onClick={() => setEnhanceError(null)}
            className="ml-2 font-medium underline hover:no-underline"
          >
            关闭
          </button>
        </div>
      )}

      <PresentationShell
        draft={draft}
        onExit={() => router.push(`/workspace/interview/${id}/preview`)}
      />
    </div>
  );
}
