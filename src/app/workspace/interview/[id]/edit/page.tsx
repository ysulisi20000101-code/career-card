"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Palette, Upload } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadInterviewProject, saveInterviewProject, listProjectRecords, updateProjectRecord } from "@/lib/projects/registry";
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
  { key: "confirm", label: "确认信息", icon: CheckCircle2 },
  { key: "edit", label: "可视化编辑", icon: Palette },
];
const stepOrder: EditorStep[] = steps.map((s) => s.key);

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
      saveInterviewProject(id, resumeDataToInterview(resumeData, useResumeStore.getState().interviewNotes));
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
      saveInterviewProject(id, resumeDataToInterview(current, useResumeStore.getState().interviewNotes));
    }
  }, [id, interviewNotes]);

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
    const draft = generatePresentationDraft(current);
    savePresentationDraft(draft);
    try {
      const interviewData = loadInterviewProject(id);
      if (interviewData) {
        saveInterviewProject(id, { ...interviewData, presentationDraftId: draft.id });
      }
    } catch {
      // best-effort
    }
    router.push(`/workspace/interview/${id}/present`);
  }, [id, flushSave]);
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
          nextLabel={currentStep === "confirm" ? "生成故事演示" : currentStep === "edit" ? "完整预览" : "下一步"}
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
          {currentStep === "upload" && (
            <UploadPage
              onParsed={() => {
                generateAndPresent();
              }}
            />
          )}
          {currentStep === "confirm" && <ConfirmPage mode="interview" onGenerate={generateAndPresent} />}
          {currentStep === "edit" && <EditPage mode="interview" projectId={id} />}
        </div>
      </div>
    </AppShell>
  );
}
