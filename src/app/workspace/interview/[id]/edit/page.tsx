"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Palette, Upload } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadInterviewProject, saveInterviewProject } from "@/lib/projects/registry";
import { interviewToResumeData, resumeDataToInterview } from "@/lib/projects/adapters";
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

  useEffect(() => {
    resetResumeData();
    const existing = loadInterviewProject(id);
    if (existing) {
      setResumeData(interviewToResumeData(existing));
      setCurrentStep("edit");
    } else {
      setCurrentStep("upload");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!resumeData) return;
    saveInterviewProject(id, resumeDataToInterview(resumeData));
  }, [id, resumeData]);

  const currentIdx = stepOrder.indexOf(currentStep);
  const canGoBack = currentIdx > 0;
  const hasResume = Boolean(resumeData);
  const enterPreview = () => router.push(`/workspace/interview/${id}/preview`);
  const goNext = () => {
    if (currentStep === "edit") {
      enterPreview();
      return;
    }
    if (currentIdx >= 0 && currentIdx < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIdx + 1]);
    }
  };
  const canGoForward = currentStep === "edit" ? hasResume : currentStep !== "upload" && currentIdx < stepOrder.length - 1;

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
          onPrev={() => setCurrentStep(stepOrder[currentIdx - 1])}
          onNext={goNext}
          disablePrev={!canGoBack}
          disableNext={!canGoForward}
          nextLabel={currentStep === "edit" ? "完整预览" : "下一步"}
          nextHint={!hasResume ? "请先上传并解析简历" : undefined}
          hint={`${currentIdx + 1} / ${stepOrder.length}`}
        />
      }
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-zinc-100 bg-white/70 px-4 py-3 backdrop-blur lg:px-8">
          <StepIndicator<EditorStep>
            steps={steps}
            current={currentStep}
            onStepClick={(key) => setCurrentStep(key)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {currentStep === "upload" && <UploadPage />}
          {currentStep === "confirm" && <ConfirmPage />}
          {currentStep === "edit" && <EditPage mode="interview" />}
        </div>
      </div>
    </AppShell>
  );
}
