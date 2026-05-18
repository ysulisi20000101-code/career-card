"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MonitorPlay, Presentation, Sparkles } from "lucide-react";
import { LoadingPage } from "@/components/ui/loading";
import { useResumeStore } from "@/store/resume-store";
import { loadInterviewProject, saveInterviewProject } from "@/lib/projects/registry";
import { interviewToResumeData } from "@/lib/projects/adapters";
import { loadPresentationDraft, savePresentationDraft } from "@/lib/presentation/storage";
import { generatePresentationDraft } from "@/lib/presentation/generator";
import { applyPresentationInstruction } from "@/lib/presentation/instruction-edit";
import { getResumeRevision } from "@/lib/public-narrative/from-draft";
import { diffPresentationDraft, type AgentChangeSet } from "@/lib/agent/change-diff";
import type { PresentationDraft } from "@/lib/presentation/types";
import type { PresentationEnhancementResult } from "@/lib/agent/presentation/types";
import { PresentationShell } from "@/components/presentation/story-deck/presentation-shell";
import { PresentationAgentWorkbench } from "@/components/interview/presentation-agent-workbench";
import { ExactHtmlInterviewSpace } from "@/components/interview/exact-html-interview-space";
import { useClientValue } from "@/hooks/use-client-value";
import { LIJINTAO_TEMPLATE_ID, shouldUseLijintaoInterviewTemplate } from "@/lib/presentation/lijintao-template";
import type { InterviewProjectData } from "@/types/project";

interface LoadedState {
  interviewData: NonNullable<ReturnType<typeof loadInterviewProject>>;
  draft: PresentationDraft;
}

function loadOrGenerate(id: string): LoadedState | null {
  try {
    const interviewData = loadInterviewProject(id);
    if (!interviewData) return null;

    let draft: PresentationDraft | null = null;
    const resumeData = interviewToResumeData(interviewData);
    const resumeRevision = getResumeRevision(resumeData);

    if (interviewData.presentationDraftId) {
      draft = loadPresentationDraft(interviewData.presentationDraftId);
      if (draft) {
        const draftHasRemovedModules = draft.slides.some(
          (slide) => slide.moduleId === "job" || slide.moduleId === "material" || slide.kind.startsWith("job_"),
        );
        const staleResume = draft.sourceResumeRevision !== resumeRevision;
        if (draftHasRemovedModules || staleResume) {
          draft = null;
        }
      }
    }

    if (!draft) {
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
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [agentNotice, setAgentNotice] = useState<string | null>(null);
  const [lastChangeSet, setLastChangeSet] = useState<AgentChangeSet | null>(null);
  const [lastBeforeDraft, setLastBeforeDraft] = useState<PresentationDraft | null>(null);
  const [lastBeforeInterviewData, setLastBeforeInterviewData] = useState<InterviewProjectData | null>(null);
  const [interviewMode, setInterviewMode] = useState(false);

  useEffect(() => {
    if (loaded) {
      setResumeData(interviewToResumeData(loaded.interviewData));
      setDraft(loaded.draft);
    }
  }, [loaded, setResumeData]);

  const rememberChange = useCallback((
    before: PresentationDraft | null,
    after: PresentationDraft,
    summary: string,
    changes?: AgentChangeSet,
    beforeInterviewData?: InterviewProjectData | null,
  ) => {
    setLastBeforeDraft(before);
    setLastBeforeInterviewData(beforeInterviewData ?? null);
    setLastChangeSet(changes ?? diffPresentationDraft(before, after, summary));
  }, []);

  const handleRegenerate = useCallback(() => {
    setRegenerating(true);
    setEnhanceError(null);
    setAgentNotice(null);
    const interviewData = loadInterviewProject(id);
    if (!interviewData) {
      setRegenerating(false);
      return;
    }
    const resumeData = interviewToResumeData(interviewData);
    const newDraft = generatePresentationDraft(resumeData);
    savePresentationDraft(newDraft);
    saveInterviewProject(id, { ...interviewData, presentationDraftId: newDraft.id });
    rememberChange(draft, newDraft, "已重新生成一版面试故事 PPT。");
    setDraft(newDraft);
    setAgentNotice("已重新生成一版面试故事 PPT。");
    setRegenerating(false);
  }, [draft, id, rememberChange]);

  const handlePrompt = useCallback((prompt: string) => {
    if (!draft) return;
    setAgentNotice(null);
    const result = applyPresentationInstruction(draft, prompt);
    setAgentNotice(result.summary);
    if (result.draft === draft) return;

    const interviewData = loadInterviewProject(id);
    savePresentationDraft(result.draft);
    if (interviewData) {
      saveInterviewProject(id, { ...interviewData, presentationDraftId: result.draft.id });
    }
    rememberChange(draft, result.draft, result.summary, result.changes, interviewData);
    setDraft(result.draft);
  }, [draft, id, rememberChange]);

  const handleAIEnhance = useCallback(async () => {
    const interviewData = loadInterviewProject(id);
    if (!interviewData || !draft) return;

    setEnhancing(true);
    setEnhanceError(null);
    setAgentNotice(null);

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
      saveInterviewProject(id, { ...interviewData, resume: resumeData, roleUnderstanding: resumeData.roleUnderstanding, presentationDraftId: result.draft.id });
      setResumeData(resumeData);
      rememberChange(draft, result.draft, "AI 精修已完成，当前演示已更新。", undefined, interviewData);
      setDraft(result.draft);
      setAgentNotice("AI 精修已完成，当前演示已更新。");

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
  }, [id, draft, rememberChange, setResumeData]);

  const handleShellDraftChange = useCallback((previous: PresentationDraft, updated: PresentationDraft) => {
    const interviewData = loadInterviewProject(id);
    savePresentationDraft(updated);
    if (interviewData) {
      saveInterviewProject(id, { ...interviewData, presentationDraftId: updated.id });
    }
    setDraft(updated);
    rememberChange(previous, updated, "已在演示编辑器中更新 PPT 内容。", undefined, interviewData);
  }, [id, rememberChange]);

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
  const visibleSlideCount = draft.slides.filter((slide) => !slide.hidden && (slide.moduleId ?? "self") === "self").length;
  const resumeForExactRestoration = interviewToResumeData(loaded.interviewData);
  const useExactHtmlRestoration =
    draft.narrativeProfile?.presetId === LIJINTAO_TEMPLATE_ID ||
    shouldUseLijintaoInterviewTemplate(resumeForExactRestoration) ||
    resumeForExactRestoration.profile.name.includes("李锦涛");
  const handleUndoChange = () => {
    if (!lastBeforeDraft) return;
    const interviewData = loadInterviewProject(id);
    savePresentationDraft(lastBeforeDraft);
    if (interviewData) {
      saveInterviewProject(id, lastBeforeInterviewData ?? { ...interviewData, presentationDraftId: lastBeforeDraft.id });
    }
    setDraft(lastBeforeDraft);
    if (lastBeforeInterviewData) setResumeData(interviewToResumeData(lastBeforeInterviewData));
    setAgentNotice("已撤回上一次 Agent 修改。");
    setLastBeforeDraft(null);
    setLastBeforeInterviewData(null);
    setLastChangeSet(null);
  };

  if (useExactHtmlRestoration) {
    return <ExactHtmlInterviewSpace />;
  }

  if (interviewMode) {
    return (
      <div className="fixed inset-0 z-[200] bg-white" data-testid="presentation-interview-stage">
        <PresentationShell
          draft={draft}
          displayMode="interview"
          onExit={() => setInterviewMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:grid lg:grid-cols-[minmax(0,1fr)_420px]">
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

      <main className="min-h-0 bg-zinc-100">
        <div
          data-testid="presentation-ready-status"
          className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-2.5 backdrop-blur"
        >
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-600">
            <Presentation className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
            <span className="shrink-0 font-semibold text-zinc-900">第一版 PPT 已生成</span>
            <span className="hidden h-3 w-px bg-zinc-200 sm:block" />
            <span className="truncate">{visibleSlideCount} 页，可直接演示；右侧 Agent 可继续微调</span>
          </div>
          <button
            type="button"
            data-testid="presentation-top-interview-mode"
            onClick={() => setInterviewMode(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            面试模式
          </button>
        </div>
        <div className="relative h-[calc(100vh-43px)] min-h-[620px]">
          <PresentationShell
            draft={draft}
            embedded
            displayMode="prepare"
            onDraftChange={handleShellDraftChange}
            onExit={() => router.push(`/workspace/interview/${id}/preview`)}
          />
        </div>
      </main>
      <PresentationAgentWorkbench
        disabled={isProcessing}
        notice={agentNotice ?? enhanceError}
        slideCount={visibleSlideCount}
        changeSet={lastChangeSet}
        onPrompt={handlePrompt}
        onAIEnhance={handleAIEnhance}
        onRegenerate={handleRegenerate}
        onEnterInterviewMode={() => setInterviewMode(true)}
        onClearChangeSet={() => setLastChangeSet(null)}
        onUndoChange={lastBeforeDraft ? handleUndoChange : undefined}
      />
    </div>
  );
}
