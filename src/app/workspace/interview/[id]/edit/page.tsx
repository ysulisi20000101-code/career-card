"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Palette, Sparkles, Upload } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadInterviewProject, saveInterviewProject, listProjectRecords } from "@/lib/projects/registry";
import { interviewToResumeData, resumeDataToInterview } from "@/lib/projects/adapters";
import { generatePresentationDraft } from "@/lib/presentation/generator";
import { savePresentationDraft } from "@/lib/presentation/storage";
import { UploadPage } from "@/components/upload/upload-page";
import { ConfirmPage } from "@/components/editor/confirm-page";
import { EditPage } from "@/components/editor/edit-page";
import { AppShell } from "@/components/shell/app-shell";
import { StepIndicator, type StepItem } from "@/components/shell/step-indicator";
import { PageFooterNav } from "@/components/shell/page-footer-nav";
import { Button } from "@/components/ui/button";
import type { EditorStep } from "@/types";

const steps: StepItem<EditorStep>[] = [
  { key: "upload", label: "上传简历", icon: Upload },
  { key: "confirm", label: "自动生成", icon: CheckCircle2 },
  { key: "edit", label: "高级编辑", icon: Palette },
];
const stepOrder: EditorStep[] = steps.map((s) => s.key);

function GeneratingDeckOverlay() {
  const steps = ["提炼候选人故事线", "组织亮点证据", "生成演示结构", "打开 PPT 工作台"];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/55 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-white/15 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-lg shadow-zinc-900/20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-950">
          <Sparkles className="h-4 w-4 text-amber-600" />
          正在把简历变成第一版面试 PPT
        </div>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
          上传已经完成，接下来不需要再点按钮。我会先给你一套可演示的成稿。
        </p>
        <div className="mt-5 grid gap-2 text-left">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                {index + 1}
              </span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InterviewEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const resumeData = useResumeStore((s) => s.resumeData);
  const currentStep = useResumeStore((s) => s.currentStep);
  const setCurrentStep = useResumeStore((s) => s.setCurrentStep);
  const setResumeData = useResumeStore((s) => s.setResumeData);
  const resetResumeData = useResumeStore((s) => s.resetResumeData);
  const interviewNotes = useResumeStore((s) => s.interviewNotes);
  const setInterviewNotes = useResumeStore((s) => s.setInterviewNotes);
  const [projectNotFound, setProjectNotFound] = useState(false);
  const [generatingDeck, setGeneratingDeck] = useState(false);

  useEffect(() => {
    const records = listProjectRecords();
    const record = records.find((r) => r.id === id);
    if (!record) {
      setProjectNotFound(true);
      return;
    }
    const existing = loadInterviewProject(id);
    if (existing) {
      setInterviewNotes(existing.interviewNotes ?? "");
      setResumeData(interviewToResumeData(existing));
      setCurrentStep("edit");
    } else {
      resetResumeData();
      setCurrentStep("upload");
    }
    setProjectNotFound(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!resumeData) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveInterviewProject(
        id,
        resumeDataToInterview(resumeData, useResumeStore.getState().interviewNotes),
      );
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [id, resumeData, interviewNotes]);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = undefined;
    }
    const current = useResumeStore.getState().resumeData;
    if (current) {
      saveInterviewProject(
        id,
        resumeDataToInterview(current, useResumeStore.getState().interviewNotes),
      );
    }
  }, [id]);

  const currentIdx = stepOrder.indexOf(currentStep);
  const canGoBack = currentIdx > 0;
  const hasResume = Boolean(resumeData);
  const enterPreview = () => {
    flushSave();
    router.push(`/workspace/interview/${id}/preview`);
  };
  const generateAndPresent = useCallback(() => {
    flushSave();
    const current = useResumeStore.getState().resumeData;
    if (!current) return;
    setResumeData(current);
    setGeneratingDeck(true);
    window.setTimeout(() => {
      const draft = generatePresentationDraft(current);
      savePresentationDraft(draft);
      try {
        const interviewData = loadInterviewProject(id);
        if (interviewData) {
          saveInterviewProject(id, {
            ...interviewData,
            resume: current,
            roleUnderstanding: current.roleUnderstanding,
            presentationDraftId: draft.id,
          });
        }
      } catch {
        // best-effort
      }
      window.setTimeout(() => router.push(`/workspace/interview/${id}/present`), 180);
    }, 120);
  }, [id, flushSave, router, setResumeData]);
  const goNext = () => {
    if (currentStep === "confirm") {
      generateAndPresent();
      return;
    }
    if (currentStep === "edit") {
      enterPreview();
      return;
    }
    if (currentIdx >= 0 && currentIdx < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIdx + 1]);
    }
  };
  const canGoForward = currentStep === "edit" ? hasResume : currentStep !== "upload" && currentIdx < stepOrder.length - 1;

  if (projectNotFound) {
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

  if (currentStep === "upload") {
    return (
      <>
        <UploadPage
          variant="interview"
          onParsed={() => {
            generateAndPresent();
          }}
        />
        {generatingDeck && <GeneratingDeckOverlay />}
      </>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "工作台", href: "/workspace" },
        { label: "面试空间" },
        { label: "编辑" },
      ]}
      actions={
        <>
          <Link href="/workspace">
            <Button size="sm" variant="ghost" className="rounded-full">
              返回工作台
            </Button>
          </Link>
        </>
      }
      footer={
        <PageFooterNav
          onPrev={() => { if (currentIdx > 0) setCurrentStep(stepOrder[currentIdx - 1]); }}
          onNext={goNext}
          disablePrev={!canGoBack}
          disableNext={!canGoForward}
          nextLabel={currentStep === "confirm" ? "生成面试 PPT" : currentStep === "edit" ? "完整预览" : "下一步"}
          nextHint={!hasResume ? "请先上传并解析简历" : undefined}
          hint={`${Math.max(currentIdx + 1, 1)} / ${stepOrder.length}`}
        />
      }
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-zinc-100 bg-white/70 px-4 py-3 backdrop-blur lg:px-8">
          <StepIndicator<EditorStep>
            steps={steps}
            current={currentStep}
            onStepClick={(key) => {
              if (key === "upload" || resumeData) setCurrentStep(key);
            }}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {currentStep === "confirm" && <ConfirmPage mode="interview" onGenerate={generateAndPresent} />}
          {currentStep === "edit" && (
            <EditPage
              mode="interview"
              projectId={id}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
