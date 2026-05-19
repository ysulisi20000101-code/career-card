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
import { diffPresentationDraft, type AgentChangeItem, type AgentChangeSet } from "@/lib/agent/change-diff";
import {
  buildDiagnosisMessage,
  diagnosePresentationDraft,
  makePresentationAgentMessage,
  type PresentationDiagnosis,
} from "@/lib/agent/presentation/diagnose-presentation";
import type { PresentationDraft, PresentationSlide } from "@/lib/presentation/types";
import type { PresentationEnhancementResult } from "@/lib/agent/presentation/types";
import { PresentationShell } from "@/components/presentation/story-deck/presentation-shell";
import { PresentationAgentWorkbench } from "@/components/interview/presentation-agent-workbench";
import { ExactHtmlInterviewSpace } from "@/components/interview/exact-html-interview-space";
import { useClientValue } from "@/hooks/use-client-value";
import { LIJINTAO_TEMPLATE_ID, shouldUseLijintaoInterviewTemplate } from "@/lib/presentation/lijintao-template";
import type { InterviewProjectData } from "@/types/project";
import { generateId } from "@/lib/utils";

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
  const [diagnosis, setDiagnosis] = useState<PresentationDiagnosis | null>(null);
  const [agentMessages, setAgentMessages] = useState<ReturnType<typeof makePresentationAgentMessage>[]>([]);
  const [interviewMode, setInterviewMode] = useState(false);
  const [referencePreviewDismissed, setReferencePreviewDismissed] = useState(false);
  const [activeSlide, setActiveSlide] = useState<{ slideNumber: number; title: string; total: number } | null>(null);

  useEffect(() => {
    if (loaded) {
      setResumeData(interviewToResumeData(loaded.interviewData));
      setDraft(loaded.draft);
      const nextDiagnosis = diagnosePresentationDraft(loaded.draft);
      setDiagnosis(nextDiagnosis);
      setAgentMessages([buildDiagnosisMessage(nextDiagnosis)]);
      setReferencePreviewDismissed(false);
      const firstSlide = loaded.draft.slides.find((slide) => !slide.hidden && (slide.moduleId ?? "self") === "self");
      setActiveSlide(firstSlide ? { slideNumber: 1, title: firstSlide.title, total: nextDiagnosis.slideDiagnoses.length } : null);
    }
  }, [loaded, setResumeData]);

  const handleActiveSlideChange = useCallback((slide: PresentationSlide, index: number, total: number) => {
    setActiveSlide({ slideNumber: index + 1, title: slide.title || `第 ${index + 1} 页`, total });
  }, []);

  const appendAgentMessages = useCallback((...messages: ReturnType<typeof makePresentationAgentMessage>[]) => {
    setAgentMessages((previous) => [...previous, ...messages].slice(-18));
  }, []);

  const refreshDiagnosis = useCallback((nextDraft: PresentationDraft) => {
    const nextDiagnosis = diagnosePresentationDraft(nextDraft);
    setDiagnosis(nextDiagnosis);
    return nextDiagnosis;
  }, []);

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
    setReferencePreviewDismissed(true);
    rememberChange(draft, newDraft, "已重新生成一版面试演示 PPT。");
    setDraft(newDraft);
    const nextDiagnosis = refreshDiagnosis(newDraft);
    setAgentMessages([buildDiagnosisMessage(nextDiagnosis)]);
    setAgentNotice("已重新生成一版面试演示 PPT。");
    setRegenerating(false);
  }, [draft, id, rememberChange, refreshDiagnosis]);

  const handlePrompt = useCallback((prompt: string) => {
    if (!draft) return;
    setAgentNotice(null);
    appendAgentMessages(makePresentationAgentMessage("user", prompt));
    const result = applyPresentationInstruction(draft, prompt);
    setAgentNotice(result.summary);
    if (result.draft === draft) {
      appendAgentMessages(makePresentationAgentMessage("agent", result.summary));
      return;
    }

    const interviewData = loadInterviewProject(id);
    savePresentationDraft(result.draft);
    if (interviewData) {
      saveInterviewProject(id, { ...interviewData, presentationDraftId: result.draft.id });
    }
    setReferencePreviewDismissed(true);
    rememberChange(draft, result.draft, result.summary, result.changes, interviewData);
    setDraft(result.draft);
    const nextDiagnosis = refreshDiagnosis(result.draft);
    appendAgentMessages(makePresentationAgentMessage(
      "agent",
      [
        result.summary,
        nextDiagnosis.priorities[0] ? `下一步建议：${nextDiagnosis.priorities[0].label}。` : "",
        result.changes?.riskFlags?.length ? "这次修改里有事实或数字表达需要你确认，我已经放到对比面板里。" : "",
      ].filter(Boolean).join("\n"),
    ));
  }, [appendAgentMessages, draft, id, rememberChange, refreshDiagnosis]);

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
      const aiChangeSet = diffPresentationDraft(draft, result.draft, "AI 精修已完成，当前演示已更新。");
      if (result.issues.length > 0) {
        aiChangeSet.riskFlags = [
          ...(aiChangeSet.riskFlags ?? []),
          ...result.issues.map((issue) => ({
            id: issue.id,
            severity: issue.severity,
            label: issue.slideId ? `${issue.slideId} 需要确认` : "AI 输出需要确认",
            detail: issue.message,
            slideId: issue.slideId,
          })),
        ];
      }
      setReferencePreviewDismissed(true);
      rememberChange(draft, result.draft, "AI 精修已完成，当前演示已更新。", aiChangeSet, interviewData);
      setDraft(result.draft);
      const nextDiagnosis = refreshDiagnosis(result.draft);
      appendAgentMessages(makePresentationAgentMessage(
        "agent",
        [
          "AI 精修已完成，当前演示已更新。",
          nextDiagnosis.priorities[0] ? `我建议继续处理：${nextDiagnosis.priorities[0].label}。` : "",
          result.issues.length > 0 ? "我检测到部分事实表达需要确认，已放入修改对比。" : "",
        ].filter(Boolean).join("\n"),
      ));
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
  }, [appendAgentMessages, id, draft, rememberChange, refreshDiagnosis, setResumeData]);

  const handleShellDraftChange = useCallback((previous: PresentationDraft, updated: PresentationDraft) => {
    const interviewData = loadInterviewProject(id);
    savePresentationDraft(updated);
    if (interviewData) {
      saveInterviewProject(id, { ...interviewData, presentationDraftId: updated.id });
    }
    setReferencePreviewDismissed(true);
    setDraft(updated);
    refreshDiagnosis(updated);
    rememberChange(previous, updated, "已在演示编辑器中更新 PPT 内容。", undefined, interviewData);
  }, [id, rememberChange, refreshDiagnosis]);

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
  const agentStatus = regenerating
    ? { label: "正在重新生成 PPT", detail: "解析简历、重建演示主线，并刷新 Agent 诊断。", tone: "working" as const }
    : enhancing
      ? { label: "正在 AI 精修", detail: "优化表达、检查事实风险，并准备修改对比。", tone: "working" as const }
      : lastChangeSet?.items.length
        ? { label: "修改已生成，等待审阅", detail: "你可以逐条接受或撤回，确认后再进入面试模式。", tone: "review" as const }
        : diagnosis
          ? { label: "诊断完成", detail: diagnosis.priorities[0] ? `建议先做：${diagnosis.priorities[0].label}。` : "当前版本可以继续预览或练习。", tone: "ready" as const }
          : undefined;
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
    setReferencePreviewDismissed(false);
    const nextDiagnosis = refreshDiagnosis(lastBeforeDraft);
    appendAgentMessages(makePresentationAgentMessage("agent", `已撤回上一次修改。${nextDiagnosis.priorities[0] ? `现在建议先处理：${nextDiagnosis.priorities[0].label}。` : ""}`));
    setLastBeforeDraft(null);
    setLastBeforeInterviewData(null);
    setLastChangeSet(null);
  };

  const showExactReference = useExactHtmlRestoration && !referencePreviewDismissed;

  if (interviewMode) {
    if (showExactReference) {
      return <ExactHtmlInterviewSpace />;
    }
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

  const handleAcceptChangeItem = (itemId: string) => {
    setLastChangeSet((previous) => {
      if (!previous) return previous;
      const accepted = previous.items.find((item) => item.id === itemId);
      const items = previous.items.filter((item) => item.id !== itemId);
      return {
        ...previous,
        items,
        riskFlags: previous.riskFlags?.filter((risk) => risk.label !== accepted?.label),
      };
    });
  };

  const handleRejectChangeItem = (item: AgentChangeItem) => {
    if (!draft || item.scope !== "presentation" || !item.field) return;
    const updated = structuredClone(draft) as PresentationDraft;
    if (item.field === "themeId") {
      updated.themeId = typeof item.beforeValue === "string" ? item.beforeValue : updated.themeId;
    } else if (item.slideId) {
      const slide = updated.slides.find((candidate) => candidate.id === item.slideId);
      if (!slide) return;
      const record = slide as unknown as Record<string, unknown>;
      if (item.beforeValue === undefined) {
        delete record[item.field];
      } else {
        record[item.field] = item.beforeValue;
      }
    } else {
      return;
    }

    updated.id = generateId();
    updated.updatedAt = new Date().toISOString();
    const interviewData = loadInterviewProject(id);
    savePresentationDraft(updated);
    if (interviewData) {
      saveInterviewProject(id, { ...interviewData, presentationDraftId: updated.id });
    }
    setReferencePreviewDismissed(true);
    setDraft(updated);
    refreshDiagnosis(updated);
    setAgentNotice(`已撤回：${item.label}`);
    appendAgentMessages(makePresentationAgentMessage("agent", `已撤回「${item.label}」，其他修改仍然保留。`));
    setLastChangeSet((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        items: previous.items.filter((candidate) => candidate.id !== item.id),
        riskFlags: previous.riskFlags?.filter((risk) => risk.label !== item.label),
      };
    });
  };

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
            <span className="shrink-0 font-semibold text-zinc-900">
              {showExactReference ? "HTML 还原版已生成" : "第一版 PPT 已生成"}
            </span>
            <span className="hidden h-3 w-px bg-zinc-200 sm:block" />
            <span className="truncate">
              {visibleSlideCount} 页，Agent 已完成诊断；进入面试模式会隐藏编辑区
            </span>
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
        <div className="relative h-[68vh] min-h-[420px] sm:h-[calc(100vh-43px)] sm:min-h-[620px]">
          {showExactReference ? (
            <ExactHtmlInterviewSpace embedded />
          ) : (
            <PresentationShell
              draft={draft}
              embedded
              displayMode="prepare"
              onDraftChange={handleShellDraftChange}
              onActiveSlideChange={handleActiveSlideChange}
              onExit={() => router.push(`/workspace/interview/${id}/preview`)}
            />
          )}
        </div>
      </main>
      <PresentationAgentWorkbench
        disabled={isProcessing}
        notice={agentNotice ?? enhanceError}
        slideCount={visibleSlideCount}
        activeSlide={activeSlide}
        agentStatus={agentStatus}
        diagnosis={diagnosis}
        messages={agentMessages}
        changeSet={lastChangeSet}
        onPrompt={handlePrompt}
        onAIEnhance={handleAIEnhance}
        onRegenerate={handleRegenerate}
        onEnterInterviewMode={() => setInterviewMode(true)}
        onClearChangeSet={() => setLastChangeSet(null)}
        onUndoChange={lastBeforeDraft ? handleUndoChange : undefined}
        onAcceptChangeItem={handleAcceptChangeItem}
        onRejectChangeItem={handleRejectChangeItem}
      />
    </div>
  );
}
