"use client";

import { useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Palette, Upload } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadPersonalProject, savePersonalProject } from "@/lib/projects/registry";
import { personalToResumeData, resumeDataToPersonal } from "@/lib/projects/adapters";
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

const stepOrder: EditorStep[] = steps.map((step) => step.key);

export default function PersonalEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const resumeData = useResumeStore((state) => state.resumeData);
  const currentStep = useResumeStore((state) => state.currentStep);
  const setCurrentStep = useResumeStore((state) => state.setCurrentStep);
  const setResumeData = useResumeStore((state) => state.setResumeData);
  const resetResumeData = useResumeStore((state) => state.resetResumeData);

  useEffect(() => {
    const existing = loadPersonalProject(id);
    if (existing) {
      setResumeData(personalToResumeData(existing));
      setCurrentStep("edit");
    } else {
      resetResumeData();
      setCurrentStep("upload");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!resumeData) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      savePersonalProject(id, resumeDataToPersonal(resumeData));
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [id, resumeData]);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = undefined;
    }
    const current = useResumeStore.getState().resumeData;
    if (current) {
      savePersonalProject(id, resumeDataToPersonal(current));
    }
  }, [id]);

  const currentIdx = stepOrder.indexOf(currentStep);
  const canGoBack = currentIdx > 0;
  const hasResume = Boolean(resumeData);
  const enterPreview = () => {
    flushSave();
    router.push(`/workspace/personal/${id}/preview`);
  };
  const goNext = () => {
    if (currentStep === "confirm") {
      enterPreview();
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
  const canGoForward = currentStep === "confirm" ? hasResume : currentStep === "edit" ? hasResume : currentStep !== "upload" && currentIdx < stepOrder.length - 1;

  return (
    <AppShell
      breadcrumbs={[
        { label: "工作台", href: "/workspace" },
        { label: "职业档案" },
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
          nextLabel={currentStep === "confirm" ? "进入 Agent 工作台" : currentStep === "edit" ? "完整预览" : "下一步"}
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
                enterPreview();
              }}
            />
          )}
          {currentStep === "confirm" && <ConfirmPage mode="personal" onGenerate={enterPreview} />}
          {currentStep === "edit" && <EditPage mode="personal" />}
        </div>
      </div>
    </AppShell>
  );
}
